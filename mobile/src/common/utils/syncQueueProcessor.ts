/**
 * Sync Queue Processor
 * 
 * Background processor that syncs queued writes when online using batch-state sync strategy.
 * The queue stores "dirty entities" (latest state per localId). The processor sends current
 * local state for all dirty entities to `/auth/sync`, which resolves conflicts via timestamps.
 */

import { api } from '../../services/api';
import { NetworkError, ApiError } from '../../services/api';
import { syncQueueStorage, type QueuedWrite, type QueuedWriteStatus } from './syncQueueStorage';
import { getIsOnline } from './networkStatus';
import { cacheEvents } from './cacheEvents';
import { invalidateCache } from '../repositories/cacheAwareRepository';
import type { SyncEntityType } from './cacheMetadata';
import type { Recipe } from '../../mocks/recipes';
import type { ShoppingList, ShoppingItem } from '../../mocks/shopping';
import type { Chore } from '../../mocks/chores';

/**
 * Sync result from backend
 */
interface SyncResult {
  status: 'synced' | 'partial' | 'failed';
  conflicts: Array<{
    type: 'list' | 'recipe' | 'chore';
    id: string;
    reason: string;
  }>;
}

/**
 * Sync payload DTO for backend
 * Backend expects specific DTO format matching SyncDataDto
 */
interface SyncRecipeDto {
  id: string;
  title: string;
  ingredients: Array<{ name: string; quantity?: number; unit?: string }>;
  instructions: Array<{ step: number; instruction: string }>;
}

interface SyncShoppingItemDto {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  isChecked?: boolean;
}

interface SyncShoppingListDto {
  id: string;
  name: string;
  color?: string;
  items?: SyncShoppingItemDto[];
}

interface SyncChoreDto {
  id: string;
  title: string;
  assigneeId?: string;
  dueDate?: string;
  isCompleted?: boolean;
}

interface SyncDataDto {
  recipes?: SyncRecipeDto[];
  lists?: SyncShoppingListDto[];
  chores?: SyncChoreDto[];
}

/**
 * Maximum retry attempts before giving up
 */
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Base delay for exponential backoff (1 second)
 */
const BASE_BACKOFF_DELAY_MS = 1000;

/**
 * Maximum delay cap for exponential backoff (30 seconds)
 */
const MAX_BACKOFF_DELAY_MS = 30000;

/**
 * Calculate exponential backoff delay in milliseconds
 * Formula: baseDelay * (2 ^ attemptCount)
 * 
 * @param attemptCount - Number of previous attempts (0-indexed)
 * @param baseDelayMs - Base delay in milliseconds (default: 1000ms = 1s)
 * @param maxDelayMs - Maximum delay cap (default: 30000ms = 30s)
 * @returns Delay in milliseconds
 */
function calculateBackoffDelay(
  attemptCount: number,
  baseDelayMs: number = BASE_BACKOFF_DELAY_MS,
  maxDelayMs: number = MAX_BACKOFF_DELAY_MS
): number {
  const delay = baseDelayMs * Math.pow(2, attemptCount);
  return Math.min(delay, maxDelayMs);
}

/**
 * Wait for specified delay (non-blocking for UI)
 */
function waitForDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Error classification result
 */
type ErrorClassification = 
  | { type: 'RETRY'; shouldIncrement: boolean }  // Retry with/without incrementing attemptCount
  | { type: 'STOP_WORKER'; reason: string }  // Stop worker (e.g., auth error)
  | { type: 'DEAD_LETTER'; reason: string };  // Mark as permanently failed

/**
 * Classify sync error to determine retry strategy
 */
function classifySyncError(error: unknown): ErrorClassification {
  // Network errors (offline, timeout, DNS)
  if (error instanceof NetworkError) {
    return { type: 'RETRY', shouldIncrement: false }; // Don't increment, just pause
  }

  // API errors
  if (error instanceof ApiError) {
    const status = error.statusCode;
    
    // Auth errors (401, 403) - stop worker, needs re-auth
    if (status === 401 || status === 403) {
      return { type: 'STOP_WORKER', reason: 'Authentication required' };
    }
    
    // 4xx validation errors (400, 422) - increment and eventually dead-letter
    if (status >= 400 && status < 500) {
      return { type: 'RETRY', shouldIncrement: true };
    }
    
    // 5xx server errors - increment and backoff
    if (status >= 500) {
      return { type: 'RETRY', shouldIncrement: true };
    }
  }

  // Unknown errors - retry with increment
  return { type: 'RETRY', shouldIncrement: true };
}

/**
 * Sync Queue Processor Interface
 */
export interface SyncQueueProcessor {
  start(): void;  // Start worker loop
  stop(): void;   // Stop worker loop
  processQueue(): Promise<void>;  // Process all ready items (for backward compatibility)
  processReadyItems(items: QueuedWrite[]): Promise<void>;  // Process specific items
  isProcessing(): boolean;  // Check if currently processing
  isRunning(): boolean;  // Check if worker loop is running
}

/**
 * Sync Queue Processor Implementation
 */
class SyncQueueProcessorImpl implements SyncQueueProcessor {
  private processing = false;
  private processingPromise: Promise<void> | null = null;
  private workerRunning = false;  // Worker loop state
  private workerCancellationToken: { cancelled: boolean } = { cancelled: false };  // Cancellation token for race-free stopping
  private workerPromise: Promise<void> | null = null;  // Worker loop promise

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
        await this.waitForDelayWithCancellation(5000);
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

      // Filter items that are ready for retry (respect backoff)
      const readyItems = this.filterItemsReadyForRetry(queue);
      
      if (readyItems.length === 0) {
        // All items are in backoff, compute time until next attempt
        const nextAttemptTime = this.calculateEarliestNextAttempt(queue);
        if (nextAttemptTime === null) {
          // No items waiting, stop worker
          this.workerRunning = false;
          break;
        }
        
        const now = Date.now();
        const waitTime = Math.max(0, nextAttemptTime - now);
        await this.waitForDelayWithCancellation(waitTime);
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
   * Wait for delay with cancellation support
   * Checks cancellation token periodically to allow immediate stopping
   * 
   * @param ms - Milliseconds to wait
   * @private
   */
  private async waitForDelayWithCancellation(ms: number): Promise<void> {
    const checkInterval = 100; // Check every 100ms
    const endTime = Date.now() + ms;
    
    while (Date.now() < endTime) {
      if (this.workerCancellationToken.cancelled) {
        return;
      }
      const remaining = Math.min(checkInterval, endTime - Date.now());
      await waitForDelay(remaining);
    }
  }

  /**
   * Calculates the earliest timestamp when any queued item will be ready for retry.
   * 
   * @param queue - Array of queued writes to analyze
   * @returns Timestamp in milliseconds when next item will be ready, or null if no items waiting
   * @private
   */
  private calculateEarliestNextAttempt(queue: QueuedWrite[]): number | null {
    const now = Date.now();
    let earliestNextAttempt: number | null = null;
    
    for (const item of queue) {
      // Skip items that are permanently failed
      if (item.status === 'FAILED_PERMANENT') {
        continue;
      }
      
      // Items with attemptCount === 0 are ready immediately
      if (item.attemptCount === 0) {
        return now; // Ready now
      }
      
      // Calculate next attempt time with validation
      const nextAttempt = this.calculateNextAttemptTime(item, now);
      if (nextAttempt !== null) {
        earliestNextAttempt = earliestNextAttempt === null 
          ? nextAttempt 
          : Math.min(earliestNextAttempt, nextAttempt);
      }
    }
    
    return earliestNextAttempt;
  }

  /**
   * Calculates the next attempt time for a single queued item.
   * Returns null if timestamp is invalid or missing.
   * 
   * @param item - Queued write item to calculate next attempt for
   * @param now - Current timestamp in milliseconds (for consistency)
   * @returns Next attempt timestamp in milliseconds, or null if invalid
   * @private
   */
  private calculateNextAttemptTime(item: QueuedWrite, now: number): number | null {
    if (!item.lastAttemptAt) {
      return null;
    }
    
    const lastAttempt = this.parseAttemptTimestamp(item.lastAttemptAt);
    if (lastAttempt === null) {
      console.warn(`Invalid lastAttemptAt timestamp for item ${item.id}: ${item.lastAttemptAt}`);
      return null;
    }
    
    const backoffDelay = calculateBackoffDelay(item.attemptCount);
    return lastAttempt + backoffDelay;
  }

  /**
   * Parses an ISO timestamp string to milliseconds, with validation.
   * Returns null if timestamp is invalid or cannot be parsed.
   * 
   * @param timestamp - ISO timestamp string to parse
   * @returns Timestamp in milliseconds, or null if invalid
   * @private
   */
  private parseAttemptTimestamp(timestamp: string | undefined): number | null {
    if (!timestamp) {
      return null;
    }
    
    try {
      const parsed = new Date(timestamp).getTime();
      return isNaN(parsed) ? null : parsed;
    } catch {
      return null;
    }
  }

  /**
   * Filters queued items that are ready for retry (backoff period has passed).
   * Validates timestamps and handles invalid dates gracefully.
   * 
   * @param queue - Array of queued writes to filter
   * @returns Array of items ready for retry
   * @private
   */
  private filterItemsReadyForRetry(queue: QueuedWrite[]): QueuedWrite[] {
    const now = Date.now();
    
    return queue.filter(item => {
      // Skip permanently failed items
      if (item.status === 'FAILED_PERMANENT') {
        return false;
      }
      
      // First attempt (attemptCount === 0) is always ready
      if (item.attemptCount === 0) {
        return true;
      }
      
      // Check if backoff period has passed with validation
      if (!item.lastAttemptAt) {
        // No timestamp, assume ready (shouldn't happen but handle gracefully)
        console.warn(`Item ${item.id} has attemptCount > 0 but no lastAttemptAt, treating as ready`);
        return true;
      }
      
      const lastAttempt = this.parseAttemptTimestamp(item.lastAttemptAt);
      if (lastAttempt === null) {
        // Invalid timestamp, treat as ready to retry (better than blocking forever)
        console.warn(`Invalid lastAttemptAt for item ${item.id}, treating as ready`);
        return true;
      }
      
      const backoffDelay = calculateBackoffDelay(item.attemptCount);
      const nextAttemptTime = lastAttempt + backoffDelay;
      
      return now >= nextAttemptTime;
    });
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
    this.processingPromise = this.doProcessReadyItems(readyItems)
      .finally(() => {
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
    const readyItems = this.filterItemsReadyForRetry(queue);
    return this.processReadyItems(readyItems);
  }

  private async doProcessReadyItems(readyItems: QueuedWrite[]): Promise<void> {
    // Check if online
    if (!getIsOnline()) {
      console.log('Sync queue processing skipped: device is offline');
      return;
    }

    console.log(`Processing sync queue: ${readyItems.length} ready items`);

    try {
      // Build sync payload from ready items only
      const syncPayload = await this.buildSyncPayload(readyItems);
      
      // Check if payload is empty (all items were compacted away)
      const hasData = 
        (syncPayload.recipes && syncPayload.recipes.length > 0) ||
        (syncPayload.lists && syncPayload.lists.length > 0) ||
        (syncPayload.chores && syncPayload.chores.length > 0);
      
      if (!hasData) {
        // All items were compacted, remove them
        for (const item of readyItems) {
          await syncQueueStorage.remove(item.id);
        }
        return;
      }

      // Call sync endpoint
      const result = await api.post<SyncResult>('/auth/sync', syncPayload);

      // Handle sync result
      await this.handleSyncResult(readyItems, result);

      // Update lastAttemptAt for all processed items (successful or not)
      for (const item of readyItems) {
        await syncQueueStorage.updateLastAttempt(item.id);
      }

    } catch (error) {
      // Classify error to determine retry strategy
      const classification = classifySyncError(error);
      
      if (classification.type === 'STOP_WORKER') {
        // Stop worker (e.g., auth error)
        this.stop();
        console.error('Sync worker stopped:', classification.reason);
        return;
      }
      
      if (classification.type === 'DEAD_LETTER') {
        // Mark items as permanently failed
        for (const item of readyItems) {
          await syncQueueStorage.markAsFailedPermanent(
            item.id,
            classification.reason
          );
        }
        return;
      }
      
      // RETRY classification
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Sync queue processing failed:', errorMessage);
      
      // Update items based on classification
      for (const item of readyItems) {
        await syncQueueStorage.updateLastAttempt(item.id);
        
        if (classification.shouldIncrement) {
          if (item.attemptCount < MAX_RETRY_ATTEMPTS) {
            await syncQueueStorage.incrementRetry(item.id);
            await syncQueueStorage.updateStatus(item.id, 'RETRYING');
          } else {
            // Max retries reached, mark as permanently failed
            await syncQueueStorage.markAsFailedPermanent(
              item.id,
              `Max retries exceeded: ${errorMessage}`
            );
          }
        } else {
          // Don't increment, just update timestamp (network error)
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
   * @returns SyncRecipeDto for backend
   * @throws Error if recipe payload is invalid
   */
  private transformRecipeToDto(recipe: unknown): SyncRecipeDto {
    if (!this.isValidRecipe(recipe)) {
      throw new Error('Invalid recipe payload in queue: missing required fields');
    }

    return {
      id: recipe.id, // Use id (may be localId or serverId)
      title: recipe.name,
      ingredients: recipe.ingredients.map(ing => ({
        name: ing.name,
        quantity: typeof ing.quantity === 'string' 
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
   * @returns SyncShoppingItemDto for backend
   * @throws Error if item payload is invalid
   */
  private transformShoppingItemToDto(item: unknown): SyncShoppingItemDto {
    if (!this.isValidShoppingItem(item)) {
      throw new Error('Invalid shopping item payload in queue: missing required fields');
    }

    return {
      id: item.id,
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
    return (
      typeof list.id === 'string' &&
      typeof list.name === 'string'
    );
  }

  /**
   * Transforms ShoppingList entity to SyncShoppingListDto
   * Includes nested items if available in queue
   */
  private transformShoppingListToDto(
    list: ShoppingList,
    allItems: ShoppingItem[]
  ): SyncShoppingListDto {
    // Find items for this list
    const listItems = allItems.filter(
      item => item.listId === list.id || item.listId === list.localId
    );

    return {
      id: list.id,
      name: list.name,
      color: list.color || undefined,
      items: listItems.length > 0 
        ? listItems.map(item => this.transformShoppingItemToDto(item))
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
    return (
      typeof chore.id === 'string' &&
      typeof chore.name === 'string'
    );
  }

  /**
   * Transforms Chore entity to SyncChoreDto
   * 
   * @param chore - Chore entity to transform
   * @returns SyncChoreDto for backend
   * @throws Error if chore payload is invalid
   */
  private transformChoreToDto(chore: unknown): SyncChoreDto {
    if (!this.isValidChore(chore)) {
      throw new Error('Invalid chore payload in queue: missing required fields');
    }

    // Parse dueDate string to ISO format if needed
    let dueDate: string | undefined;
    if (chore.dueDate) {
      // Try to parse "Today", "Tomorrow", etc. to actual date
      // For now, just pass through or use current date logic
      // TODO: Better date parsing if needed
      dueDate = chore.dueDate;
    }

    return {
      id: chore.id,
      title: chore.name,
      assigneeId: undefined, // TODO: Map assignee name to ID if needed
      dueDate: dueDate,
      isCompleted: chore.completed || undefined,
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
   * Separates entities by type from grouped writes.
   * 
   * @param entityMap - Map of entity key to queued write
   * @returns Object with separated entities by type
   */
  private separateEntitiesByType(entityMap: Map<string, QueuedWrite>): {
    recipes: Recipe[];
    lists: ShoppingList[];
    items: ShoppingItem[];
    chores: Chore[];
  } {
    const recipes: Recipe[] = [];
    const lists: ShoppingList[] = [];
    const items: ShoppingItem[] = [];
    const chores: Chore[] = [];
    
    for (const item of entityMap.values()) {
      const payload = item.payload;
      
      switch (item.entityType) {
        case 'recipes':
          if (this.isValidRecipe(payload)) {
            recipes.push(payload);
          } else {
            console.warn(`Skipping invalid recipe payload for ${item.target.localId}`);
          }
          break;
        case 'shoppingLists':
          // Validate shopping list payload
          if (this.isValidShoppingListPayload(payload)) {
            lists.push(payload as ShoppingList);
          } else {
            console.warn(`Skipping invalid shopping list payload for ${item.target.localId}`);
          }
          break;
        case 'shoppingItems':
          if (this.isValidShoppingItem(payload)) {
            items.push(payload);
          } else {
            console.warn(`Skipping invalid shopping item payload for ${item.target.localId}`);
          }
          break;
        case 'chores':
          if (this.isValidChore(payload)) {
            chores.push(payload);
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
   * @param separated - Separated entities by type
   * @returns SyncDataDto for backend
   */
  private transformToDto(separated: {
    recipes: Recipe[];
    lists: ShoppingList[];
    items: ShoppingItem[];
    chores: Chore[];
  }): SyncDataDto {
    const recipes: SyncRecipeDto[] = [];
    const lists: SyncShoppingListDto[] = [];
    const chores: SyncChoreDto[] = [];
    const orphanedItems: ShoppingItem[] = [];

    // Transform recipes
    for (const recipe of separated.recipes) {
      try {
        recipes.push(this.transformRecipeToDto(recipe));
      } catch (error) {
        console.error('Failed to transform recipe:', error);
      }
    }

    // Transform chores
    for (const chore of separated.chores) {
      try {
        chores.push(this.transformChoreToDto(chore));
      } catch (error) {
        console.error('Failed to transform chore:', error);
      }
    }

    // Transform shopping lists with nested items
    for (const list of separated.lists) {
      try {
        lists.push(this.transformShoppingListToDto(list, separated.items));
      } catch (error) {
        console.error('Failed to transform shopping list:', error);
      }
    }

    // Check for orphaned items (items without their list in queue)
    for (const item of separated.items) {
      const hasParentList = separated.lists.some(
        list => list.id === item.listId || list.localId === item.listId
      );
      if (!hasParentList) {
        orphanedItems.push(item);
      }
    }

    if (orphanedItems.length > 0) {
      console.warn(
        `${orphanedItems.length} orphaned shopping items found. ` +
        `They will be synced when their parent list is synced. ` +
        `Orphaned item IDs: ${orphanedItems.map(i => i.id).join(', ')}`
      );
    }
    
    return {
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
    return this.transformToDto(separated);
  }

  /**
   * Handles sync result from backend
   * 
   * - For successful syncs: Update cache with server entities, remove from queue
   * - For conflicts: Keep in queue, increment retry count
   * - For failed syncs: Keep in queue, increment retry count
   */
  private async handleSyncResult(
    queue: QueuedWrite[],
    result: SyncResult
  ): Promise<void> {
    const syncedIds = new Set<string>();
    const conflictIds = new Set<string>();

    // Track conflicts
    for (const conflict of result.conflicts) {
      conflictIds.add(conflict.id);
    }

    // Process each queued write
    for (const item of queue) {
      // Check for conflicts using both serverId and localId
      // Backend may return conflicts with either ID format
      const entityId = item.target.serverId || item.target.localId;
      const hasConflict = 
        conflictIds.has(entityId) ||
        conflictIds.has(item.target.localId) ||
        (item.target.serverId && conflictIds.has(item.target.serverId));

      if (hasConflict) {
        // Conflict: keep in queue, increment retry
        if (item.attemptCount < MAX_RETRY_ATTEMPTS) {
          await syncQueueStorage.incrementRetry(item.id);
          await syncQueueStorage.updateStatus(item.id, 'RETRYING');
          console.warn(
            `Sync conflict for ${item.entityType}:${item.target.localId}, ` +
            `retry ${item.attemptCount + 1}/${MAX_RETRY_ATTEMPTS}`
          );
        } else {
          // Max retries reached, mark as permanently failed
          console.error(
            `Sync conflict for ${item.entityType}:${item.target.localId} exceeded max retries, ` +
            `marking as permanently failed`
          );
          await syncQueueStorage.markAsFailedPermanent(
            item.id,
            `Sync conflict: max retries exceeded`
          );
        }
      } else {
        // Success: remove from queue
        syncedIds.add(item.id);
        await syncQueueStorage.remove(item.id);
      }
    }

    // Update cache after successful sync
    // Since backend doesn't return synced entities, we invalidate cache
    // to force refresh on next read, which will get server-assigned IDs
    const syncedTypes = new Set<SyncEntityType>();
    for (const item of queue) {
      if (syncedIds.has(item.id)) {
        syncedTypes.add(item.entityType);
      }
    }

    // Invalidate cache for synced entity types to force refresh
    // This ensures cache gets updated with server-assigned IDs on next read
    for (const entityType of syncedTypes) {
      try {
        await invalidateCache(entityType);
        // Emit cache change event to trigger UI refresh
        cacheEvents.emitCacheChange(entityType);
      } catch (error) {
        console.error(`Failed to invalidate cache for ${entityType} after sync:`, error);
        // Still emit event even if invalidation fails
        cacheEvents.emitCacheChange(entityType);
      }
    }

    console.log(
      `Sync queue processed: ${syncedIds.size} synced, ${result.conflicts.length} conflicts`
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
