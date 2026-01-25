/**
 * Sync Queue Processor
 * 
 * Background processor that syncs queued writes when online using batch-state sync strategy.
 * The queue stores "dirty entities" (latest state per localId). The processor sends current
 * local state for all dirty entities to `/auth/sync`, which resolves conflicts via timestamps.
 */

import { api } from '../../services/api';
import { NetworkError } from '../../services/api';
import { syncQueueStorage, type QueuedWrite } from './syncQueueStorage';
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
 * Sync Queue Processor Interface
 */
export interface SyncQueueProcessor {
  start(): void;
  stop(): void;
  processQueue(): Promise<void>;
  isProcessing(): boolean;
}

/**
 * Sync Queue Processor Implementation
 */
class SyncQueueProcessorImpl implements SyncQueueProcessor {
  private processing = false;
  private processingPromise: Promise<void> | null = null;

  /**
   * Start the processor (no-op for now, processing happens on-demand)
   */
  start(): void {
    // Processor runs on-demand when network comes back online
    // No background polling needed
  }

  /**
   * Stop the processor (no-op for now)
   */
  stop(): void {
    // No background processing to stop
  }

  /**
   * Check if queue is currently being processed
   */
  isProcessing(): boolean {
    return this.processing;
  }

  /**
   * Process the sync queue
   * 
   * Implements batch-state sync:
   * 1. Read all queued writes
   * 2. Group by entity type and get latest state per localId
   * 3. Build SyncDataDto payload
   * 4. Call POST /auth/sync endpoint
   * 5. Handle sync response (success/partial/failed)
   * 6. Update cache with server-resolved entities
   * 7. Remove successfully synced writes from queue
   * 8. Handle conflicts and retries
   */
  async processQueue(): Promise<void> {
    // Prevent concurrent processing
    if (this.processing) {
      if (this.processingPromise) {
        return this.processingPromise;
      }
    }

    this.processing = true;
    this.processingPromise = this.doProcessQueue()
      .finally(() => {
        this.processing = false;
        this.processingPromise = null;
      });

    return this.processingPromise;
  }

  private async doProcessQueue(): Promise<void> {
    // Check if online
    if (!getIsOnline()) {
      console.log('Sync queue processing skipped: device is offline');
      return;
    }

    // Read queue
    const queue = await syncQueueStorage.getAll();
    
    if (queue.length === 0) {
      // Nothing to sync
      return;
    }

    console.log(`Processing sync queue: ${queue.length} items`);

    try {
      // Build sync payload (batch-state sync)
      const syncPayload = await this.buildSyncPayload(queue);
      
      // Check if payload is empty (all items were compacted away)
      const hasData = 
        (syncPayload.recipes && syncPayload.recipes.length > 0) ||
        (syncPayload.lists && syncPayload.lists.length > 0) ||
        (syncPayload.chores && syncPayload.chores.length > 0);
      
      if (!hasData) {
        // All items were compacted (e.g., create + delete), clear queue
        await syncQueueStorage.clear();
        console.log('Sync queue cleared: all items were compacted');
        return;
      }

      // Call sync endpoint
      const result = await api.post<SyncResult>('/auth/sync', syncPayload);

      // Handle sync result
      await this.handleSyncResult(queue, result);

    } catch (error) {
      if (error instanceof NetworkError) {
        console.log('Sync queue processing failed: network error, will retry on next network change');
        // Don't increment retries - network errors are transient
        return;
      }

      // Other errors (API errors, etc.)
      console.error('Sync queue processing failed:', error);
      
      // Increment retry count for all items
      for (const item of queue) {
        if (item.attemptCount < MAX_RETRY_ATTEMPTS) {
          await syncQueueStorage.incrementRetry(item.id);
        } else {
          // Max retries reached, remove from queue and log
          console.warn(
            `Sync queue item ${item.id} exceeded max retries, removing from queue. ` +
            `Entity: ${item.entityType}:${item.target.localId}, Operation: ${item.op}`
          );
          await syncQueueStorage.remove(item.id);
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
          console.warn(
            `Sync conflict for ${item.entityType}:${item.target.localId}, ` +
            `retry ${item.attemptCount + 1}/${MAX_RETRY_ATTEMPTS}`
          );
        } else {
          // Max retries reached, remove from queue
          console.error(
            `Sync conflict for ${item.entityType}:${item.target.localId} exceeded max retries, ` +
            `removing from queue`
          );
          await syncQueueStorage.remove(item.id);
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
