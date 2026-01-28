/**
 * Sync Queue Processor
 *
 * Background processor that syncs queued writes when online using batch-state sync strategy.
 * The queue stores "dirty entities" (latest state per localId). The processor sends current
 * local state for all dirty entities to `/auth/sync`, which resolves conflicts via timestamps.
 */

import { api } from '../../../services/api';
import {
  syncQueueStorage,
  type QueuedWrite,
  type QueuedWriteStatus,
  type SyncCheckpoint,
} from '../storage';
import { getIsOnline } from '../../networkStatus';
import { cacheEvents } from '../../cacheEvents';
import { invalidateCache } from '../../repositories/cacheAwareRepository';
import type { SyncEntityType } from '../../cacheMetadata';
import type { Recipe } from '../../../mocks/recipes';
import type { ShoppingList, ShoppingItem } from '../../../mocks/shopping';
import type { Chore } from '../../../mocks/chores';
import * as Crypto from 'expo-crypto';
import {
  MAX_BATCH_SIZE,
  MAX_RETRY_ATTEMPTS,
} from './syncQueueProcessor.constants';
import {
  calculateBackoffDelay,
  waitForDelay,
  waitForDelayWithCancellation,
  calculateEarliestNextAttempt,
  filterItemsReadyForRetry,
  isCheckpointReadyForAttempt,
  isCheckpointStale,
  parseAttemptTimestamp,
  calculateNextAttemptTime,
} from './syncQueueProcessor.backoff';
import {
  SyncDataDto,
  SyncResult,
  ErrorClassification,
  GroupedEntities,
  EntityMap,
  ServerIdMappings,
  SyncRecipeDto,
  SyncShoppingItemDto,
  SyncShoppingListDto,
  SyncChoreDto,
} from './syncQueueProcessor.types';
import { classifySyncError, isValidSyncResult } from './syncQueueProcessor.errorHandling';

function createBatches<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}

// Note: SyncResult and ErrorClassification types, and the isValidSyncResult/classifySyncError
// helpers, now live in ./types and ./errorHandling respectively.

/**
 * Sync Queue Processor Interface
 */
export interface SyncQueueProcessor {
  start(): void; // Start worker loop
  stop(): void; // Stop worker loop
  processQueue(): Promise<void>; // Process all ready items (for backward compatibility)
  processReadyItems(items: QueuedWrite[]): Promise<void>; // Process specific items
  isProcessing(): boolean; // Check if currently processing
  isRunning(): boolean; // Check if worker loop is running
}

/**
 * Sync Queue Processor Implementation
 */
class SyncQueueProcessorImpl implements SyncQueueProcessor {
  private processing = false;
  private processingPromise: Promise<void> | null = null;
  private workerRunning = false; // Worker loop state
  private workerCancellationToken: { cancelled: boolean } = { cancelled: false }; // Cancellation token for race-free stopping
  private workerPromise: Promise<void> | null = null; // Worker loop promise

  /**
   * Start the worker loop
   * Continuously processes queue until empty or stopped
   */
  start(): void {
    if (this.workerRunning) {
      return; // Already running
    }

    this.workerRunning = true;
    this.workerCancellationToken.cancelled = false;
    this.workerPromise = this.runWorkerLoop();
  }

  /**
   * Stop the worker loop
   * Uses cancellation token to ensure race-free stopping even when loop is in waitForDelay()
   */
  stop(): void {
    this.workerCancellationToken.cancelled = true;
    this.workerRunning = false;
  }

  /**
   * Check if worker loop is running
   */
  isRunning(): boolean {
    return this.workerRunning;
  }

  /**
   * Check if queue is currently being processed
   */
  isProcessing(): boolean {
    return this.processing;
  }

  /**
   * Worker loop that continuously processes queue
   * Checks cancellation token to allow race-free stopping
   */
  private async runWorkerLoop(): Promise<void> {
    while (this.workerRunning && !this.workerCancellationToken.cancelled) {
      // Check if online
      if (!getIsOnline()) {
        // Wait and check again, but check cancellation during wait
        await waitForDelayWithCancellation(5000, () => this.workerCancellationToken.cancelled);
        if (this.workerCancellationToken.cancelled) {
          break;
        }
        continue;
      }

      // Check cancellation before expensive operations
      if (this.workerCancellationToken.cancelled) {
        break;
      }

      // Check if queue has items
      const queue = await syncQueueStorage.getAll();

      if (queue.length === 0) {
        // Queue empty, stop worker
        this.workerRunning = false;
        break;
      }

      // If a checkpoint exists, re-drive it first to guarantee crash-safe progress.
      const checkpointProcessed = await this.processCheckpointIfPresent(queue);
      if (checkpointProcessed) {
        // Continue loop immediately (either checkpoint cleared or still in-flight with backoff)
        continue;
      }

      // Filter items that are ready for retry (respect backoff)
      const readyItems = filterItemsReadyForRetry(queue);

      if (readyItems.length === 0) {
        // All items are in backoff, compute time until next attempt
        const nextAttemptTime = calculateEarliestNextAttempt(queue);
        if (nextAttemptTime === null) {
          // No items waiting, stop worker
          this.workerRunning = false;
          break;
        }

        const now = Date.now();
        const waitTime = Math.max(0, nextAttemptTime - now);
        await waitForDelayWithCancellation(waitTime, () => this.workerCancellationToken.cancelled);
        if (this.workerCancellationToken.cancelled) {
          break;
        }
        continue;
      }

      // Process only ready items (pass filtered set to avoid re-reading queue)
      try {
        await this.processReadyItems(readyItems);
      } catch (error) {
        console.error('Worker loop error:', error);
        // Continue loop even if processing fails
      }

      // If there are ready items, process immediately (no extra sleep)
      // Loop will check again on next iteration
    }

    this.workerRunning = false;
    this.workerPromise = null;
  }

  /**
   * If a checkpoint exists, try to re-drive its in-flight batch.
   *
   * Returns true if a checkpoint existed (even if not sent due to backoff),
   * meaning the caller should continue the worker loop without normal batch selection.
   */
  private async processCheckpointIfPresent(queueSnapshot: QueuedWrite[]): Promise<boolean> {
    const checkpoint = await syncQueueStorage.getCheckpoint();
    if (!checkpoint) {
      return false;
    }

    // TTL expiry: if stale, clear and fall back to normal processing (safe via idempotency).
    if (isCheckpointStale(checkpoint)) {
      await syncQueueStorage.clearCheckpoint();
      return false;
    }

    const checkpointItems = this.selectCheckpointItemsFromQueue(queueSnapshot, checkpoint);
    if (checkpointItems.length === 0) {
      // Compaction/clearing removed these items; checkpoint is no longer meaningful.
      await syncQueueStorage.clearCheckpoint();
      return false;
    }

    // Respect per-item backoff AND checkpoint backoff to prevent hot loops.
    const readyCheckpointItems = filterItemsReadyForRetry(checkpointItems);
    if (readyCheckpointItems.length === 0) {
      // Items exist but are not ready; let the existing backoff scheduler handle waiting.
      return true;
    }

    if (!isCheckpointReadyForAttempt(checkpoint)) {
      return true;
    }

    // Re-drive: mark attempt before sending (crash-safe).
    await syncQueueStorage.markCheckpointAttempt();

    try {
      await this.sendBatchesWithCheckpoint(readyCheckpointItems, checkpoint.requestId);
    } catch (error) {
      // Errors are handled inside sendBatchesWithCheckpoint; keep checkpoint for future re-drive.
      console.error('Checkpoint re-drive failed:', error);
    }

    return true;
  }


  private selectCheckpointItemsFromQueue(
    queueSnapshot: QueuedWrite[],
    checkpoint: SyncCheckpoint
  ): QueuedWrite[] {
    const opIdSet = new Set(checkpoint.inFlightOperationIds);
    return queueSnapshot.filter(item => opIdSet.has(item.operationId));
  }


  /**
   * Process specific ready items (called by worker loop with filtered set)
   * This ensures we only process items that passed backoff check
   */
  async processReadyItems(readyItems: QueuedWrite[]): Promise<void> {
    if (readyItems.length === 0) {
      return;
    }

    // Prevent concurrent processing
    if (this.processing) {
      if (this.processingPromise) {
        return this.processingPromise;
      }
    }

    this.processing = true;
    this.processingPromise = this.doProcessReadyItems(readyItems).finally(() => {
      this.processing = false;
      this.processingPromise = null;
    });

    return this.processingPromise;
  }

  /**
   * Process queue (backward compatibility - filters ready items internally)
   */
  async processQueue(): Promise<void> {
    const queue = await syncQueueStorage.getAll();
    const readyItems = filterItemsReadyForRetry(queue);
    return this.processReadyItems(readyItems);
  }

  private async doProcessReadyItems(readyItems: QueuedWrite[]): Promise<void> {
    // Check if online
    if (!getIsOnline()) {
      console.log('Sync queue processing skipped: device is offline');
      return;
    }

    // If checkpoint exists, we must re-drive that first (worker loop handles this).
    // Here we process new work by batching and checkpointing each batch as its own transaction marker.
    const batches = createBatches(readyItems, MAX_BATCH_SIZE);
    console.log(
      `Processing sync queue: ${readyItems.length} ready items (${batches.length} batches)`
    );

    for (const batch of batches) {
      const requestId = Crypto.randomUUID();
      // Save checkpoint before sending (crash-safe). If the app crashes after this point,
      // the worker will re-drive this exact batch from checkpoint on restart.
      await syncQueueStorage.saveCheckpoint({
        inFlightOperationIds: batch.map(i => i.operationId),
        requestId,
      });

      await this.sendBatchesWithCheckpoint(batch, requestId);
    }
  }

  private async sendBatchesWithCheckpoint(batch: QueuedWrite[], requestId: string): Promise<void> {
    try {
      // Build sync payload from batch only
      const syncPayload = await this.buildSyncPayload(batch);
      // Ensure requestId matches checkpoint for observability
      syncPayload.requestId = requestId;

      // Check if payload is empty (all items invalid/compacted away)
      const hasData =
        (syncPayload.recipes && syncPayload.recipes.length > 0) ||
        (syncPayload.lists && syncPayload.lists.length > 0) ||
        (syncPayload.chores && syncPayload.chores.length > 0);

      if (!hasData) {
        // All items were effectively no-ops; remove them and clear checkpoint.
        for (const item of batch) {
          await syncQueueStorage.remove(item.id);
        }
        await syncQueueStorage.clearCheckpoint();
        return;
      }

      // Call sync endpoint
      try {
        const result = await api.post<SyncResult>('/auth/sync', syncPayload);
        await this.handleSyncResult(batch, result);

        const confirmedOperationIds = [
          ...(result.succeeded?.map(s => s.operationId) ?? []),
          ...result.conflicts.map(c => c.operationId),
        ];
        await syncQueueStorage.confirmCheckpointOperationIds(confirmedOperationIds);
      } catch (error) {
        const maybeResult = error instanceof ApiError ? error.response?.data : undefined;
        if (isValidSyncResult(maybeResult)) {
          console.warn('Sync returned error response but with result body, processing...');
          await this.handleSyncResult(batch, maybeResult);

          const confirmedOperationIds = [
            ...(maybeResult.succeeded?.map(s => s.operationId) ?? []),
            ...maybeResult.conflicts.map(c => c.operationId),
          ];
          await syncQueueStorage.confirmCheckpointOperationIds(confirmedOperationIds);

          for (const item of batch) {
            await syncQueueStorage.updateLastAttempt(item.id);
          }
          return;
        }

        throw error;
      }

      // Update lastAttemptAt for all processed items (successful or not)
      for (const item of batch) {
        await syncQueueStorage.updateLastAttempt(item.id);
      }
    } catch (error) {
      const classification = classifySyncError(error);

      if (classification.type === 'STOP_WORKER') {
        this.stop();
        console.error('Sync worker stopped:', classification.reason);
        return;
      }

      if (classification.type === 'DEAD_LETTER') {
        for (const item of batch) {
          await syncQueueStorage.markAsFailedPermanent(item.id, classification.reason);
        }
        return;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Sync queue processing failed (no confirmation):', errorMessage);

      for (const item of batch) {
        await syncQueueStorage.updateLastAttempt(item.id);

        if (classification.shouldIncrement) {
          if (item.attemptCount < MAX_RETRY_ATTEMPTS) {
            await syncQueueStorage.incrementRetry(item.id);
            await syncQueueStorage.updateStatus(item.id, 'RETRYING');
          } else {
            await syncQueueStorage.markAsFailedPermanent(
              item.id,
              `Max retries exceeded: ${errorMessage}`
            );
          }
        } else {
          await syncQueueStorage.updateStatus(item.id, 'RETRYING');
        }
      }
    }
  }

  /**
   * Type guard to validate Recipe payload
   */
  private isValidRecipe(payload: unknown): payload is Recipe {
    if (!payload || typeof payload !== 'object') {
      return false;
    }
    const recipe = payload as Record<string, unknown>;
    return (
      typeof recipe.id === 'string' &&
      typeof recipe.name === 'string' &&
      Array.isArray(recipe.ingredients) &&
      Array.isArray(recipe.instructions)
    );
  }

  /**
   * Transforms Recipe entity to SyncRecipeDto
   *
   * @param recipe - Recipe entity to transform
   * @param operationId - Idempotency key for this operation
   * @returns SyncRecipeDto for backend
   * @throws Error if recipe payload is invalid
   */
  private transformRecipeToDto(recipe: unknown, operationId: string): SyncRecipeDto {
    if (!this.isValidRecipe(recipe)) {
      throw new Error('Invalid recipe payload in queue: missing required fields');
    }

    return {
      id: recipe.id, // Use id (may be localId or serverId)
      operationId, // Include idempotency key
      title: recipe.name,
      ingredients: recipe.ingredients.map(ing => ({
        name: ing.name,
        quantity:
          typeof ing.quantity === 'string'
            ? parseFloat(ing.quantity) || undefined
            : ing.quantity || undefined,
        unit: ing.unit || undefined,
      })),
      instructions: recipe.instructions.map((inst, index) => ({
        step: index + 1,
        instruction: inst.text,
      })),
    };
  }

  /**
   * Type guard to validate ShoppingItem payload
   */
  private isValidShoppingItem(payload: unknown): payload is ShoppingItem {
    if (!payload || typeof payload !== 'object') {
      return false;
    }
    const item = payload as Record<string, unknown>;
    return (
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.listId === 'string'
    );
  }

  /**
   * Transforms ShoppingItem entity to SyncShoppingItemDto
   *
   * @param item - ShoppingItem entity to transform
   * @param operationId - Idempotency key for this operation
   * @returns SyncShoppingItemDto for backend
   * @throws Error if item payload is invalid
   */
  private transformShoppingItemToDto(item: unknown, operationId: string): SyncShoppingItemDto {
    if (!this.isValidShoppingItem(item)) {
      throw new Error('Invalid shopping item payload in queue: missing required fields');
    }

    return {
      id: item.id,
      operationId, // Include idempotency key
      name: item.name,
      quantity: item.quantity || undefined,
      unit: item.unit || undefined,
      category: item.category || undefined,
      isChecked: item.isChecked || undefined,
    };
  }

  /**
   * Type guard to validate ShoppingList payload
   */
  private isValidShoppingListPayload(payload: unknown): payload is ShoppingList {
    if (!payload || typeof payload !== 'object') {
      return false;
    }
    const list = payload as Record<string, unknown>;
    return typeof list.id === 'string' && typeof list.name === 'string';
  }

  /**
   * Transforms ShoppingList entity to SyncShoppingListDto
   * Includes nested items if available in queue
   *
   * @param list - ShoppingList entity to transform
   * @param allItems - Array of shopping items with their operationIds
   * @param operationId - Idempotency key for this list operation
   */
  private transformShoppingListToDto(
    list: ShoppingList,
    allItems: Array<{ entity: ShoppingItem; operationId: string }>,
    operationId: string
  ): SyncShoppingListDto {
    // Find items for this list
    const listItems = allItems.filter(
      ({ entity: item }) => item.listId === list.id || item.listId === (list as any).localId
    );

    return {
      id: list.id,
      operationId, // Include idempotency key
      name: list.name,
      color: list.color || undefined,
      items:
        listItems.length > 0
          ? listItems.map(({ entity: item, operationId: itemOperationId }) =>
              this.transformShoppingItemToDto(item, itemOperationId)
            )
          : undefined,
    };
  }

  /**
   * Type guard to validate Chore payload
   */
  private isValidChore(payload: unknown): payload is Chore {
    if (!payload || typeof payload !== 'object') {
      return false;
    }
    const chore = payload as Record<string, unknown>;
    return typeof chore.id === 'string' && typeof chore.name === 'string';
  }

  /**
   * Transforms Chore entity to SyncChoreDto
   *
   * @param chore - Chore entity to transform
   * @param operationId - Idempotency key for this operation
   * @returns SyncChoreDto for backend
   * @throws Error if chore payload is invalid
   */
  private transformChoreToDto(chore: unknown, operationId: string): SyncChoreDto {
    if (!this.isValidChore(chore)) {
      throw new Error('Invalid chore payload in queue: missing required fields');
    }

    // Parse dueDate string to ISO format if needed
    let dueDate: string | undefined;
    if ((chore as any).dueDate) {
      // For now, just pass through or use current date logic
      dueDate = (chore as any).dueDate;
    }

    return {
      id: (chore as any).id,
      operationId, // Include idempotency key
      title: (chore as any).name,
      assigneeId: undefined, // TODO: Map assignee name to ID if needed
      dueDate,
      isCompleted: (chore as any).completed || undefined,
    };
  }

  /**
   * Groups queued writes by entity type and localId, keeping latest state per entity.
   *
   * @param queue - Array of queued writes
   * @returns Map of entity key to latest queued write
   */
  private groupWritesByEntity(queue: QueuedWrite[]): Map<string, QueuedWrite> {
    const entityMap = new Map<string, QueuedWrite>();

    for (const item of queue) {
      const key = `${item.entityType}:${item.target.localId}`;
      const existing = entityMap.get(key);

      // Keep latest write (by clientTimestamp)
      if (!existing || item.clientTimestamp > existing.clientTimestamp) {
        entityMap.set(key, item);
      }
    }

    return entityMap;
  }

  /**
   * Separates entities by type from grouped writes, maintaining operationId mapping.
   *
   * @param entityMap - Map of entity key to queued write
   * @returns Object with separated entities by type, each with their operationId
   */
  private separateEntitiesByType(
    entityMap: Map<string, QueuedWrite>
  ): {
    recipes: Array<{ entity: Recipe; operationId: string }>;
    lists: Array<{ entity: ShoppingList; operationId: string }>;
    items: Array<{ entity: ShoppingItem; operationId: string }>;
    chores: Array<{ entity: Chore; operationId: string }>;
  } {
    const recipes: Array<{ entity: Recipe; operationId: string }> = [];
    const lists: Array<{ entity: ShoppingList; operationId: string }> = [];
    const items: Array<{ entity: ShoppingItem; operationId: string }> = [];
    const chores: Array<{ entity: Chore; operationId: string }> = [];

    for (const item of entityMap.values()) {
      const payload = item.payload;
      const operationId = item.operationId;

      switch (item.entityType) {
        case 'recipes':
          if (this.isValidRecipe(payload)) {
            recipes.push({ entity: payload, operationId });
          } else {
            console.warn(`Skipping invalid recipe payload for ${item.target.localId}`);
          }
          break;
        case 'shoppingLists':
          if (this.isValidShoppingListPayload(payload)) {
            lists.push({ entity: payload as ShoppingList, operationId });
          } else {
            console.warn(`Skipping invalid shopping list payload for ${item.target.localId}`);
          }
          break;
        case 'shoppingItems':
          if (this.isValidShoppingItem(payload)) {
            items.push({ entity: payload, operationId });
          } else {
            console.warn(`Skipping invalid shopping item payload for ${item.target.localId}`);
          }
          break;
        case 'chores':
          if (this.isValidChore(payload)) {
            chores.push({ entity: payload, operationId });
          } else {
            console.warn(`Skipping invalid chore payload for ${item.target.localId}`);
          }
          break;
      }
    }

    return { recipes, lists, items, chores };
  }

  /**
   * Transforms separated entities to DTO format and handles orphaned items.
   *
   * @param separated - Separated entities by type with operationIds
   * @param requestId - Optional request ID for observability
   * @returns SyncDataDto for backend
   */
  private transformToDto(
    separated: {
      recipes: Array<{ entity: Recipe; operationId: string }>;
      lists: Array<{ entity: ShoppingList; operationId: string }>;
      items: Array<{ entity: ShoppingItem; operationId: string }>;
      chores: Array<{ entity: Chore; operationId: string }>;
    },
    requestId?: string
  ): SyncDataDto {
    const recipes: SyncRecipeDto[] = [];
    const lists: SyncShoppingListDto[] = [];
    const chores: SyncChoreDto[] = [];
    const orphanedItems: Array<{ entity: ShoppingItem; operationId: string }> = [];

    // Transform recipes
    for (const { entity: recipe, operationId } of separated.recipes) {
      try {
        recipes.push(this.transformRecipeToDto(recipe, operationId));
      } catch (error) {
        console.error('Failed to transform recipe:', error);
      }
    }

    // Transform chores
    for (const { entity: chore, operationId } of separated.chores) {
      try {
        chores.push(this.transformChoreToDto(chore, operationId));
      } catch (error) {
        console.error('Failed to transform chore:', error);
      }
    }

    // Transform shopping lists with nested items
    for (const { entity: list, operationId } of separated.lists) {
      try {
        lists.push(this.transformShoppingListToDto(list, separated.items, operationId));
      } catch (error) {
        console.error('Failed to transform shopping list:', error);
      }
    }

    // Check for orphaned items (items without their list in queue)
    for (const { entity: item, operationId } of separated.items) {
      const hasParentList = separated.lists.some(
        ({ entity: list }) => list.id === item.listId || (list as any).localId === item.listId
      );
      if (!hasParentList) {
        orphanedItems.push({ entity: item, operationId });
      }
    }

    if (orphanedItems.length > 0) {
      console.warn(
        `${orphanedItems.length} orphaned shopping items found. ` +
          `They will be synced when their parent list is synced. ` +
          `Orphaned item IDs: ${orphanedItems.map(({ entity }) => entity.id).join(', ')}`
      );
    }

    return {
      requestId, // Include optional request ID
      recipes: recipes.length > 0 ? recipes : undefined,
      lists: lists.length > 0 ? lists : undefined,
      chores: chores.length > 0 ? chores : undefined,
    };
  }

  /**
   * Builds sync payload from queued writes (batch-state sync)
   *
   * Groups by entity type and gets latest state per localId.
   * After compaction, there should be only one write per entity.
   * Transforms entities to backend DTO format.
   *
   * @param queue - Array of queued writes
   * @returns SyncDataDto for backend
   */
  private async buildSyncPayload(queue: QueuedWrite[]): Promise<SyncDataDto> {
    const entityMap = this.groupWritesByEntity(queue);
    const separated = this.separateEntitiesByType(entityMap);

    // Generate requestId for this sync batch (optional, for observability)
    const requestId = Crypto.randomUUID();

    return this.transformToDto(separated, requestId);
  }

  /**
   * Handles sync result from backend with safety-first logic.
   *
   * **Core Safety Rule:** NEVER delete queue items without explicit confirmation.
   *
   * - Explicit Success: Item removed only if operationId is in result.succeeded[]
   * - Explicit Failure: Item kept if operationId is in result.conflicts[]
   * - Unknown: Item kept if operationId is in neither (server bug, incomplete response)
   * - Backward Compatibility: If succeeded missing, only delete all when status === 'synced'
   *
   * @param queue - Array of queued writes that were sent in this sync batch
   * @param result - Sync result from backend
   */
  private async handleSyncResult(queue: QueuedWrite[], result: SyncResult): Promise<void> {
    // Backward compatibility: if succeeded array is missing
    if (!result.succeeded) {
      await this.handleBackwardCompatibleResult(queue, result);
      return;
    }

    // New server with succeeded array: use explicit operationId matching
    const { syncedIds, syncedTypes, serverIdMappings } =
      await this.processSyncResultsByOperationId(queue, result);

    await this.applyServerIdMappings(serverIdMappings);
    await this.invalidateCacheForSyncedTypes(syncedTypes);

    this.logSyncResult(syncedIds.size, result.conflicts.length, queue.length);
  }

  /**
   * Handles backward-compatible sync results (old server without succeeded array).
   *
   * @param queue - Array of queued writes
   * @param result - Sync result from backend (without succeeded array)
   */
  private async handleBackwardCompatibleResult(
    queue: QueuedWrite[],
    result: SyncResult
  ): Promise<void> {
    if (result.status === 'synced') {
      // Old server: status 'synced' means all succeeded
      // Remove all items (current behavior for backward compatibility)
      for (const item of queue) {
        await syncQueueStorage.remove(item.id);
      }

      // Invalidate cache for all synced types
      const syncedTypes = new Set(queue.map(item => item.entityType));
      for (const entityType of syncedTypes) {
        await invalidateCache(entityType);
        cacheEvents.emitCacheChange(entityType);
      }

      console.log(
        `Sync queue processed: ${queue.length} synced (backward compatibility mode)`
      );
    } else {
      // Partial or failed, but no succeeded array
      // SAFE: Don't remove anything (can't prove success)
      // Keep all items for retry
      console.warn(
        'Sync result missing succeeded array but status is not synced. ' +
          'Keeping all items for retry (backward compatibility safety).'
      );
    }
  }

  /**
   * Processes sync results by matching operationIds.
   * Returns tracking information for synced items.
   *
   * @param queue - Array of queued writes
   * @param result - Sync result with succeeded and conflicts arrays
   * @returns Tracking information for synced items
   */
  private async processSyncResultsByOperationId(
    queue: QueuedWrite[],
    result: SyncResult
  ): Promise<{
    syncedIds: Set<string>;
    syncedTypes: Set<SyncEntityType>;
    serverIdMappings: Map<string, { serverId: string; entityType: SyncEntityType }>;
  }> {
    const succeededOperationIds = new Set(result.succeeded!.map(s => s.operationId));
    const failedOperationIds = new Set(result.conflicts.map(c => c.operationId));

    const syncedIds = new Set<string>();
    const syncedTypes = new Set<SyncEntityType>();
    const serverIdMappings = new Map<string, { serverId: string; entityType: SyncEntityType }>();

    // Process each queued item
    for (const item of queue) {
      if (succeededOperationIds.has(item.operationId)) {
        // Explicit success: remove from queue
        syncedIds.add(item.id);
        syncedTypes.add(item.entityType);

        // Track serverId mapping for creates
        const successEntry = result.succeeded!.find(
          s => s.operationId === item.operationId
        );
        if (successEntry && successEntry.id !== item.target.localId) {
          // Server assigned new ID (create operation)
          serverIdMappings.set(item.target.localId, {
            serverId: successEntry.id,
            entityType: item.entityType,
          });
        }

        await syncQueueStorage.remove(item.id);
        continue;
      }

      if (failedOperationIds.has(item.operationId)) {
        // Explicit failure: keep in queue, let existing retry/backoff logic apply
        await this.handleFailedItem(item);
        continue;
      }

      // Unknown: operationId not in succeeded or conflicts
      // SAFE: Do NOT delete. Keep for retry + log warning.
      console.warn('Sync result missing operationId', {
        operationId: item.operationId,
        entityType: item.entityType,
        localId: item.target.localId,
        status: result.status,
      });
      // Keep item in queue for retry (idempotency makes this safe)
    }

    return { syncedIds, syncedTypes, serverIdMappings };
  }

  /**
   * Handles a failed sync item by updating retry count or marking as permanently failed.
   *
   * @param item - Queued write that failed to sync
   */
  private async handleFailedItem(item: QueuedWrite): Promise<void> {
    if (item.attemptCount < MAX_RETRY_ATTEMPTS) {
      await syncQueueStorage.incrementRetry(item.id);
      await syncQueueStorage.updateStatus(item.id, 'RETRYING');
      console.warn(
        `Sync failed for ${item.entityType}:${item.target.localId}, ` +
          `retry ${item.attemptCount + 1}/${MAX_RETRY_ATTEMPTS}`
      );
    } else {
      await syncQueueStorage.markAsFailedPermanent(
        item.id,
        `Sync failed: max retries exceeded`
      );
    }
  }

  /**
   * Applies serverId mappings to cache for create operations.
   *
   * **Current Implementation**: Cache invalidation (via `invalidateCacheForSyncedTypes`)
   * ensures cache is refreshed on next read, which will include server-assigned IDs.
   * This is safe but less efficient than direct cache updates.
   *
   * **Future Enhancement**: Directly update cache entities with serverId mappings
   * to avoid unnecessary cache refresh. Tracked in mobile-apply-serverid-on-success task.
   *
   * @param serverIdMappings - Map of localId to serverId mappings
   */
  private async applyServerIdMappings(
    serverIdMappings: Map<string, { serverId: string; entityType: SyncEntityType }>
  ): Promise<void> {
    // Current implementation: Cache invalidation handles ID mapping via refresh
    // This ensures cache entities get updated with server-assigned IDs on next read
    // Future: Direct cache updates will be more efficient for large batches
    if (serverIdMappings.size > 0) {
      // No-op: Cache invalidation (called separately) handles ID mapping
    }
  }

  /**
   * Invalidates cache for synced entity types and emits cache change events.
   *
   * @param syncedTypes - Set of entity types that were successfully synced
   */
  private async invalidateCacheForSyncedTypes(
    syncedTypes: Set<SyncEntityType>
  ): Promise<void> {
    for (const entityType of syncedTypes) {
      try {
        await invalidateCache(entityType);
        cacheEvents.emitCacheChange(entityType);
      } catch (error) {
        console.error(`Failed to invalidate cache for ${entityType} after sync:`, error);
        cacheEvents.emitCacheChange(entityType);
      }
    }
  }

  /**
   * Logs sync result summary.
   *
   * @param syncedCount - Number of items successfully synced
   * @param failedCount - Number of items that failed
   * @param totalCount - Total number of items in the batch
   */
  private logSyncResult(syncedCount: number, failedCount: number, totalCount: number): void {
    const unknownCount = totalCount - syncedCount - failedCount;
    console.log(
      `Sync queue processed: ${syncedCount} synced, ${failedCount} failed, ` +
        `${unknownCount} unknown (kept for retry)`
    );
  }
}

/**
 * Singleton instance of sync queue processor
 */
let processorInstance: SyncQueueProcessor | null = null;

/**
 * Creates or returns the singleton sync queue processor
 */
export function createSyncQueueProcessor(): SyncQueueProcessor {
  if (!processorInstance) {
    processorInstance = new SyncQueueProcessorImpl();
  }
  return processorInstance;
}

/**
 * Gets the singleton sync queue processor instance
 */
export function getSyncQueueProcessor(): SyncQueueProcessor {
  if (!processorInstance) {
    processorInstance = new SyncQueueProcessorImpl();
  }
  return processorInstance;
}

