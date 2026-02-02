/**
 * Cache-Aware Shopping Repository
 * 
 * Wraps RemoteShoppingService with cache-first read strategies and write-through caching.
 * Uses a dedicated interface to handle shopping lists and items separately.
 */

import type { ShoppingItem, ShoppingList, Category } from '../../mocks/shopping';
import type { GroceryItem } from '../../features/shopping/components/GrocerySearchBar';
import type { ShoppingData, IShoppingService } from '../../features/shopping/services/shoppingService';
import { EntityTimestamps } from '../types/entityMetadata';
import { 
  getCached, 
  invalidateCache,
  readCachedEntitiesForUpdate,
  addEntityToCache,
  updateEntityInCache,
  setCached
} from './cacheAwareRepository';
import { getIsOnline } from '../utils/networkStatus';
import { api } from '../../services/api';
import { colors } from '../../theme';
import { markDeleted, withCreatedAt, withUpdatedAt } from '../utils/timestamps';
import { cacheEvents } from '../utils/cacheEvents';
import { NetworkError } from '../../services/api';
import { syncQueueStorage, type SyncOp, type QueueTargetId } from '../utils/syncQueueStorage';
import * as Crypto from 'expo-crypto';
import { buildCategoriesFromGroceries, buildFrequentlyAddedItems } from '../utils/catalogUtils';
import { catalogService } from '../services/catalogService';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { applyShoppingListChange, applyShoppingItemChange } from '../../features/shopping/utils/shoppingRealtime';

type ShoppingListSummaryDto = {
  id: string;
  name: string;
  color?: string | null;
  itemCount?: number | null;
};

type ShoppingListDetailDto = {
  id: string;
  name: string;
  color?: string | null;
  items: {
    id: string;
    name: string;
    quantity?: number | null;
    unit?: string | null;
    isChecked?: boolean | null;
    category?: string | null;
  }[];
};

const DEFAULT_LIST_ICON: ShoppingList['icon'] = 'cart-outline';
const DEFAULT_LIST_COLOR = colors.shopping;

/**
 * Dedicated interface for cache-aware shopping repository
 * 
 * Handles lists and items separately, plus aggregated ShoppingData.
 */
export interface ICacheAwareShoppingRepository {
  // Lists operations
  findAllLists(): Promise<ShoppingList[]>;
  findListById(id: string): Promise<ShoppingList | null>;
  createList(list: Partial<ShoppingList>): Promise<ShoppingList>;
  updateList(id: string, updates: Partial<ShoppingList>): Promise<ShoppingList>;
  deleteList(id: string): Promise<void>;
  
  // Items operations
  findAllItems(): Promise<ShoppingItem[]>;
  findItemsByListId(listId: string): Promise<ShoppingItem[]>;
  createItem(item: Partial<ShoppingItem>): Promise<ShoppingItem>;
  updateItem(id: string, updates: Partial<ShoppingItem>): Promise<ShoppingItem>;
  deleteItem(id: string): Promise<void>;
  toggleItem(id: string): Promise<ShoppingItem>;
  
  // Aggregated data (convenience method)
  getShoppingData(): Promise<ShoppingData>;
  
  // Cache management
  invalidateListsCache(): Promise<void>;
  invalidateItemsCache(): Promise<void>;
  invalidateAllCache(): Promise<void>;
  
  // Refresh methods (force fetch from API)
  refreshLists(): Promise<ShoppingList[]>;
  refreshItems(): Promise<ShoppingItem[]>;
  
  // Realtime update methods
  applyRealtimeListChange(payload: RealtimePostgresChangesPayload<{
    id: string;
    name?: string | null;
    color?: string | null;
    household_id?: string | null;
  }>): Promise<void>;
  applyRealtimeItemChange(payload: RealtimePostgresChangesPayload<{
    id: string;
    list_id?: string | null;
    name?: string | null;
    quantity?: number | null;
    category?: string | null;
    is_checked?: boolean | null;
  }>, groceryItems: GroceryItem[]): Promise<void>;
}

// Note: Category building utilities are imported from common/utils/catalogUtils.ts
// Catalog data fetching is handled by catalogService

const mapShoppingListSummary = (list: ShoppingListSummaryDto): ShoppingList => ({
  id: list.id,
  localId: list.id,
  name: list.name,
  itemCount: list.itemCount ?? 0,
  icon: DEFAULT_LIST_ICON,
  color: list.color ?? DEFAULT_LIST_COLOR,
});

const buildShoppingItemsFromDetails = (
  listId: string,
  items: ShoppingListDetailDto['items'],
  groceries: GroceryItem[],
): ShoppingItem[] => {
  return items.map((item) => {
    const matchingGrocery = groceries.find(
      (grocery) => grocery.name.toLowerCase() === item.name.toLowerCase()
    );

    return {
      id: item.id,
      localId: item.id,
      name: item.name,
      image: matchingGrocery?.image ?? '',
      quantity: item.quantity ?? 1,
      unit: item.unit ?? undefined,
      isChecked: item.isChecked ?? false,
      category: item.category ?? matchingGrocery?.category ?? 'Other',
      listId,
    };
  });
};

/**
 * Cache-aware repository for shopping
 * 
 * Implements cache-first read strategy with background refresh and write-through caching.
 */
export class CacheAwareShoppingRepository implements ICacheAwareShoppingRepository {
  constructor(private readonly service: IShoppingService) {}
  
  /**
   * Gets the ID from a shopping list entity
   */
  private getListId(list: ShoppingList): string {
    return list.id;
  }
  
  /**
   * Gets the ID from a shopping item entity
   */
  private getItemId(item: ShoppingItem): string {
    return item.id;
  }
  
  /**
   * Fetches shopping lists from API (used by cache layer)
   */
  private async fetchListsFromApi(): Promise<ShoppingList[]> {
    console.log('[fetchListsFromApi] Fetching shopping lists from API...');
    const lists = await api.get<ShoppingListSummaryDto[]>('/shopping-lists');
    console.log('[fetchListsFromApi] API response:', JSON.stringify(lists, null, 2));
    console.log('[fetchListsFromApi] Response type:', typeof lists, 'isArray:', Array.isArray(lists), 'length:', Array.isArray(lists) ? lists.length : 'N/A');
    const mapped = lists.map(mapShoppingListSummary);
    console.log('[fetchListsFromApi] Mapped shopping lists:', mapped.length);
    return mapped;
  }
  
  /**
   * Fetches shopping items from API (used by cache layer)
   */
  private async fetchItemsFromApi(): Promise<ShoppingItem[]> {
    // Get lists first
    const lists = await this.findAllLists();
    
    // Get grocery items for mapping
    const groceryItems = await this.getGroceryItems();
    
    // Fetch details for each list
    const listDetails = await Promise.all(
      lists.map((list) =>
        api.get<ShoppingListDetailDto>(`/shopping-lists/${list.id}`)
      )
    );

    return listDetails.flatMap((listDetail) =>
      buildShoppingItemsFromDetails(listDetail.id, listDetail.items, groceryItems)
    );
  }
  
  /**
   * Fetches grocery items using CatalogService with fallback strategy.
   * 
   * Delegates to CatalogService which implements: API → Cache → Mock fallback.
   * This ensures consistent behavior across all services and always returns data
   * (never empty - always has mock fallback).
   * 
   * @returns Array of grocery items (never empty - always has mock fallback)
   */
  private async getGroceryItems(): Promise<GroceryItem[]> {
    return catalogService.getGroceryItems();
  }

  /**
   * Creates an optimistic shopping list entity with localId for offline operations
   */
  private createOptimisticList(data: Partial<ShoppingList>): ShoppingList {
    const localId = Crypto.randomUUID();
    const now = new Date().toISOString();
    
    return withCreatedAt({
      id: localId,
      localId: localId,
      name: data.name ?? '',
      itemCount: data.itemCount ?? 0,
      icon: data.icon ?? DEFAULT_LIST_ICON,
      color: data.color ?? DEFAULT_LIST_COLOR,
      createdAt: now,
      updatedAt: now,
    } as ShoppingList);
  }

  /**
   * Creates an optimistic shopping item entity with localId for offline operations
   */
  private createOptimisticItem(data: Partial<ShoppingItem>): ShoppingItem {
    const localId = Crypto.randomUUID();
    const now = new Date().toISOString();
    
    return withCreatedAt({
      id: localId,
      localId: localId,
      name: data.name ?? '',
      image: data.image ?? '',
      quantity: data.quantity ?? 1,
      unit: data.unit,
      isChecked: data.isChecked ?? false,
      category: data.category ?? 'Other',
      listId: data.listId ?? '',
      createdAt: now,
      updatedAt: now,
    } as ShoppingItem);
  }

  /**
   * Ensures localId exists on entity (for updates of existing entities)
   */
  private ensureLocalId<T extends { id: string; localId?: string }>(entity: T): T {
    if (!entity.localId) {
      return { ...entity, localId: entity.id };
    }
    return entity;
  }

  /**
   * Helper method for enqueueing writes to the sync queue.
   * 
   * Extracts localId and serverId from the entity and enqueues the write
   * operation for later sync when network is available.
   * 
   * @param entityType - Type of entity (shoppingLists or shoppingItems)
   * @param op - Sync operation type (create, update, delete)
   * @param entity - Entity to enqueue
   */
  private async enqueueWrite(
    entityType: 'shoppingLists' | 'shoppingItems',
    op: SyncOp,
    entity: ShoppingList | ShoppingItem
  ): Promise<void> {
    const localId = entity.localId ?? entity.id;
    const serverId = entity.id !== localId ? entity.id : undefined;
    
    await syncQueueStorage.enqueue(
      entityType,
      op,
      { localId, serverId },
      entity // Full entity payload
    );
  }

  /**
   * Updates the item count for a shopping list based on current items in cache
   * 
   * This ensures the list's itemCount stays in sync with actual items.
   * Called after createItem, deleteItem operations.
   * 
   * @param listId - The shopping list ID to update
   */
  private async updateListItemCount(listId: string): Promise<void> {
    try {
      // Read current items and lists from cache
      const items = await readCachedEntitiesForUpdate<ShoppingItem>('shoppingItems');
      const lists = await readCachedEntitiesForUpdate<ShoppingList>('shoppingLists');
      
      // Find the list using helper method
      const list = lists.find(l => this.matchesAnyId(l, listId));
      if (!list) {
        console.warn(`[CacheAwareShoppingRepository] List ${listId} not found, skipping item count update`);
        return;
      }
      
      // Count active items for this list
      // Items don't have localId, so we match against listId directly
      const activeItems = items.filter(item => {
        const itemListId = item.listId;
        return (itemListId === listId || itemListId === list.id || itemListId === list.localId) &&
               !item.deletedAt;
      });
      const newItemCount = activeItems.length;
      
      // Only update if count changed
      if (list.itemCount !== newItemCount) {
        const isOnline = getIsOnline();
        if (isOnline) {
          // Update via API
          try {
            const updated = await this.service.updateList(listId, { itemCount: newItemCount });
            await updateEntityInCache(
              'shoppingLists',
              updated,
              (l) => this.getListId(l),
              (l) => this.matchesAnyId(l, listId)
            );
            cacheEvents.emitCacheChange('shoppingLists');
          } catch (error) {
            // If API update fails, still update cache optimistically
            console.error(`[CacheAwareShoppingRepository] Failed to update list item count via API:`, error);
            await updateEntityInCache(
              'shoppingLists',
              { ...list, itemCount: newItemCount } as ShoppingList,
              (l) => this.getListId(l),
              (l) => this.matchesAnyId(l, listId)
            );
            cacheEvents.emitCacheChange('shoppingLists');
          }
        } else {
          // Offline: update cache optimistically
          await updateEntityInCache(
            'shoppingLists',
            { ...list, itemCount: newItemCount } as ShoppingList,
            (l) => this.getListId(l),
            (l) => this.matchesAnyId(l, listId)
          );
          cacheEvents.emitCacheChange('shoppingLists');
        }
      }
    } catch (error) {
      // Don't throw - item count update is best-effort
      console.error(`[CacheAwareShoppingRepository] Failed to update list item count:`, error);
    }
  }
  
  // Lists operations
  
  async findAllLists(): Promise<ShoppingList[]> {
    return getCached<ShoppingList>(
      'shoppingLists',
      () => this.fetchListsFromApi(),
      (list) => this.getListId(list),
      getIsOnline()
    );
  }
  
  /**
   * Find single shopping list by ID (reads directly from cache, no network fetch)
   * 
   * Optimized to read directly from cache without triggering findAllLists(),
   * which may cause unnecessary network requests.
   * 
   * @param id - Shopping list ID to find
   * @returns Shopping list if found, null otherwise
   */
  async findListById(id: string): Promise<ShoppingList | null> {
    const lists = await readCachedEntitiesForUpdate<ShoppingList>('shoppingLists');
    return lists.find(l => this.matchesAnyId(l, id)) ?? null;
  }
  
  /**
   * Creates a shopping list with write-through caching and offline queueing
   * 
   * Critical Write Ordering Rule (Non-negotiable):
   * UI action → Update cache immediately → Emit cache event → Handle sync (enqueue if offline, call service if online)
   */
  async createList(list: Partial<ShoppingList>): Promise<ShoppingList> {
    // Step 1: Create optimistic entity
    const optimisticEntity = this.createOptimisticList(list);
    
    // Step 2: Update cache immediately (write-through) - ALWAYS FIRST
    await addEntityToCache(
      'shoppingLists',
      optimisticEntity,
      (l) => this.getListId(l)
    );
    
    // Step 3: Emit cache event (UI updates instantly) - ALWAYS SECOND
    cacheEvents.emitCacheChange('shoppingLists');
    
    // Step 4: Handle sync (online vs offline) - AFTER cache update
    const isOnline = getIsOnline();
    
    if (isOnline) {
      try {
        const created = await this.service.createList(list);
        await addEntityToCache(
          'shoppingLists',
          created,
          (l) => this.getListId(l)
        );
        cacheEvents.emitCacheChange('shoppingLists');
        return created;
      } catch (error) {
        if (error instanceof NetworkError) {
          await this.enqueueWrite('shoppingLists', 'create', optimisticEntity);
        }
        throw error;
      }
    } else {
      await this.enqueueWrite('shoppingLists', 'create', optimisticEntity);
      return optimisticEntity;
    }
  }
  
  /**
   * Updates a shopping list with write-through caching and offline queueing
   */
  async updateList(id: string, updates: Partial<ShoppingList>): Promise<ShoppingList> {
    // Step 1: Read current cache
    const current = await readCachedEntitiesForUpdate<ShoppingList>('shoppingLists');
    const existing = current.find(l => this.matchesAnyId(l, id));
    
    if (!existing) {
      throw new Error(`Shopping list with id ${id} not found in cache`);
    }
    
    // Step 2: Create optimistic updated entity
    const optimisticEntity = this.ensureLocalId(withUpdatedAt({
      ...existing,
      ...updates,
    } as ShoppingList));
    
    // Step 3: Update cache immediately (write-through) - ALWAYS FIRST
    await updateEntityInCache(
      'shoppingLists',
      optimisticEntity,
      (l) => this.getListId(l),
      (l) => this.matchesAnyId(l, id)
    );
    
    // Step 4: Emit cache event (UI updates instantly) - ALWAYS SECOND
    cacheEvents.emitCacheChange('shoppingLists');
    
    // Step 5: Handle sync (online vs offline) - AFTER cache update
    const isOnline = getIsOnline();
    
    if (isOnline) {
      try {
        const updated = await this.service.updateList(id, updates);
        await updateEntityInCache(
          'shoppingLists',
          updated,
          (l) => this.getListId(l),
          (l) => this.matchesAnyId(l, id)
        );
        cacheEvents.emitCacheChange('shoppingLists');
        return updated;
      } catch (error) {
        if (error instanceof NetworkError) {
          await this.enqueueWrite('shoppingLists', 'update', optimisticEntity);
        }
        throw error;
      }
    } else {
      await this.enqueueWrite('shoppingLists', 'update', optimisticEntity);
      return optimisticEntity;
    }
  }
  
  /**
   * Deletes a shopping list (soft-delete) with write-through caching and offline queueing
   */
  async deleteList(id: string): Promise<void> {
    // Step 1: Read current cache
    const current = await readCachedEntitiesForUpdate<ShoppingList>('shoppingLists');
    const existing = current.find(l => this.matchesAnyId(l, id));
    
    if (!existing) {
      return;
    }
    
    // Step 2: Create optimistic deleted entity
    const optimisticEntity = this.ensureLocalId(markDeleted(existing));
    
    // Step 3: Update cache immediately (write-through) - ALWAYS FIRST
    await updateEntityInCache(
      'shoppingLists',
      optimisticEntity,
      (l) => this.getListId(l),
      (l) => this.matchesAnyId(l, id)
    );
    
    // Step 4: Emit cache event (UI updates instantly) - ALWAYS SECOND
    cacheEvents.emitCacheChange('shoppingLists');
    
    // Step 5: Handle sync (online vs offline) - AFTER cache update
    const isOnline = getIsOnline();
    
    if (isOnline) {
      try {
        await this.service.deleteList(id);
      } catch (error) {
        if (error instanceof NetworkError) {
          await this.enqueueWrite('shoppingLists', 'delete', optimisticEntity);
        }
        throw error;
      }
    } else {
      await this.enqueueWrite('shoppingLists', 'delete', optimisticEntity);
    }
  }
  
  // Items operations
  
  async findAllItems(): Promise<ShoppingItem[]> {
    return getCached<ShoppingItem>(
      'shoppingItems',
      () => this.fetchItemsFromApi(),
      (item) => this.getItemId(item),
      getIsOnline(),
      false // Don't force refresh on normal findAllItems
    );
  }
  
  /**
   * Force refresh items from API (bypasses cache)
   */
  async refreshItems(): Promise<ShoppingItem[]> {
    return getCached<ShoppingItem>(
      'shoppingItems',
      () => this.fetchItemsFromApi(),
      (item) => this.getItemId(item),
      getIsOnline(),
      true // Force refresh
    );
  }
  
  async findItemsByListId(listId: string): Promise<ShoppingItem[]> {
    const items = await this.findAllItems();
    return items.filter(item => item.listId === listId);
  }
  
  /**
   * Creates a shopping item with write-through caching and offline queueing
   * 
   * Accepts ShoppingItemWithCatalog to support catalogItemId/masterItemId for API requests.
   */
  async createItem(item: Partial<ShoppingItem> & { catalogItemId?: string; masterItemId?: string }): Promise<ShoppingItem> {
    if (!item.listId) {
      throw new Error('Shopping item must have a listId');
    }

    // Step 1: Create optimistic entity
    const optimisticEntity = this.createOptimisticItem(item);
    
    // Step 2: Update cache immediately (write-through) - ALWAYS FIRST
    await addEntityToCache(
      'shoppingItems',
      optimisticEntity,
      (i) => this.getItemId(i)
    );
    
    // Step 3: Emit cache events (UI updates instantly) - ALWAYS SECOND
    cacheEvents.emitCacheChange('shoppingItems');
    
    // Step 4: Handle sync (online vs offline) - AFTER cache update
    const isOnline = getIsOnline();
    
    if (isOnline) {
      try {
        const created = await this.service.createItem(item);
        await addEntityToCache(
          'shoppingItems',
          created,
          (i) => this.getItemId(i)
        );
        // Update list item count ONLY after successful API call (recalculates from fresh cache)
        await this.updateListItemCount(item.listId);
        cacheEvents.emitCacheChange('shoppingItems');
        cacheEvents.emitCacheChange('shoppingLists');
        return created;
      } catch (error) {
        // On error, update count optimistically to keep UI in sync
        await this.updateListItemCount(item.listId);
        cacheEvents.emitCacheChange('shoppingLists');
        if (error instanceof NetworkError) {
          await this.enqueueWrite('shoppingItems', 'create', optimisticEntity);
        }
        throw error;
      }
    } else {
      // Offline: update count optimistically
      await this.updateListItemCount(item.listId);
      cacheEvents.emitCacheChange('shoppingLists');
      await this.enqueueWrite('shoppingItems', 'create', optimisticEntity);
      return optimisticEntity;
    }
  }
  
  /**
   * Updates a shopping item with write-through caching and offline queueing
   */
  async updateItem(id: string, updates: Partial<ShoppingItem>): Promise<ShoppingItem> {
    // Step 1: Read current cache
    const current = await readCachedEntitiesForUpdate<ShoppingItem>('shoppingItems');
    const existing = current.find(i => this.matchesAnyId(i, id));
    
    if (!existing) {
      throw new Error(`Shopping item with id ${id} not found in cache`);
    }
    
    // Step 2: Create optimistic updated entity
    const optimisticEntity = this.ensureLocalId(withUpdatedAt({
      ...existing,
      ...updates,
    } as ShoppingItem));
    
    // Step 3: Update cache immediately (write-through) - ALWAYS FIRST
    await updateEntityInCache(
      'shoppingItems',
      optimisticEntity,
      (i) => this.getItemId(i),
      (i) => this.matchesAnyId(i, id)
    );
    
    // Step 4: Emit cache event (UI updates instantly) - ALWAYS SECOND
    cacheEvents.emitCacheChange('shoppingItems');
    
    // Step 5: Handle sync (online vs offline) - AFTER cache update
    const isOnline = getIsOnline();
    
    if (isOnline) {
      try {
        const updated = await this.service.updateItem(id, updates);
        await updateEntityInCache(
          'shoppingItems',
          updated,
          (i) => this.getItemId(i),
          (i) => this.matchesAnyId(i, id)
        );
        cacheEvents.emitCacheChange('shoppingItems');
        return updated;
      } catch (error) {
        if (error instanceof NetworkError) {
          await this.enqueueWrite('shoppingItems', 'update', optimisticEntity);
        }
        throw error;
      }
    } else {
      await this.enqueueWrite('shoppingItems', 'update', optimisticEntity);
      return optimisticEntity;
    }
  }
  
  /**
   * Deletes a shopping item (soft-delete) with write-through caching and offline queueing
   */
  async deleteItem(id: string): Promise<void> {
    // Step 1: Read current cache
    const current = await readCachedEntitiesForUpdate<ShoppingItem>('shoppingItems');
    const existing = current.find(i => this.matchesAnyId(i, id));
    
    if (!existing) {
      return;
    }
    
    const listId = existing.listId;
    
    // Step 2: Create optimistic deleted entity
    const optimisticEntity = this.ensureLocalId(markDeleted(existing));
    
    // Step 3: Update cache immediately (write-through) - ALWAYS FIRST
    await updateEntityInCache(
      'shoppingItems',
      optimisticEntity,
      (i) => this.getItemId(i),
      (i) => this.matchesAnyId(i, id)
    );
    
    // Step 4: Emit cache event (UI updates instantly) - ALWAYS SECOND
    cacheEvents.emitCacheChange('shoppingItems');
    
    // Step 5: Handle sync (online vs offline) - AFTER cache update
    const isOnline = getIsOnline();
    
    if (isOnline) {
      try {
        await this.service.deleteItem(id);
        // Update list item count ONLY after successful API call (recalculates from fresh cache)
        if (listId) {
          await this.updateListItemCount(listId);
          cacheEvents.emitCacheChange('shoppingLists');
        }
      } catch (error) {
        // On error, update count optimistically to keep UI in sync
        if (listId) {
          await this.updateListItemCount(listId);
          cacheEvents.emitCacheChange('shoppingLists');
        }
        if (error instanceof NetworkError) {
          await this.enqueueWrite('shoppingItems', 'delete', optimisticEntity);
        }
        throw error;
      }
    } else {
      // Offline: update count optimistically
      if (listId) {
        await this.updateListItemCount(listId);
        cacheEvents.emitCacheChange('shoppingLists');
      }
      await this.enqueueWrite('shoppingItems', 'delete', optimisticEntity);
    }
  }
  
  /**
   * Toggles shopping item checked state with write-through caching and offline queueing
   */
  async toggleItem(id: string): Promise<ShoppingItem> {
    // Step 1: Read current cache
    const current = await readCachedEntitiesForUpdate<ShoppingItem>('shoppingItems');
    const existing = current.find(i => this.matchesAnyId(i, id));
    
    if (!existing) {
      throw new Error(`Shopping item with id ${id} not found in cache`);
    }
    
    // Step 2: Create optimistic toggled entity
    const optimisticEntity = this.ensureLocalId(withUpdatedAt({
      ...existing,
      isChecked: !existing.isChecked,
    } as ShoppingItem));
    
    // Step 3: Update cache immediately (write-through) - ALWAYS FIRST
    await updateEntityInCache(
      'shoppingItems',
      optimisticEntity,
      (i) => this.getItemId(i),
      (i) => this.matchesAnyId(i, id)
    );
    
    // Step 4: Emit cache event (UI updates instantly) - ALWAYS SECOND
    cacheEvents.emitCacheChange('shoppingItems');
    
    // Step 5: Handle sync (online vs offline) - AFTER cache update
    const isOnline = getIsOnline();
    
    if (isOnline) {
      try {
        const updated = await this.service.toggleItem(id);
        await updateEntityInCache(
          'shoppingItems',
          updated,
          (i) => this.getItemId(i),
          (i) => this.matchesAnyId(i, id)
        );
        cacheEvents.emitCacheChange('shoppingItems');
        return updated;
      } catch (error) {
        if (error instanceof NetworkError) {
          await this.enqueueWrite('shoppingItems', 'update', optimisticEntity);
        }
        throw error;
      }
    } else {
      await this.enqueueWrite('shoppingItems', 'update', optimisticEntity);
      return optimisticEntity;
    }
  }
  
  // Aggregated data
  
  async getShoppingData(): Promise<ShoppingData> {
    // Get cached lists and items
    const shoppingLists = await this.findAllLists();
    const shoppingItems = await this.findAllItems();
    
    // Get fresh grocery items (not cached)
    const groceryItems = await this.getGroceryItems();
    
    const categories = buildCategoriesFromGroceries(groceryItems);
    const frequentlyAddedItems = buildFrequentlyAddedItems(groceryItems);
    
    return {
      shoppingLists,
      shoppingItems,
      categories,
      groceryItems,
      frequentlyAddedItems,
    };
  }
  
  // Cache management
  
  async invalidateListsCache(): Promise<void> {
    await invalidateCache('shoppingLists');
  }
  
  async invalidateItemsCache(): Promise<void> {
    await invalidateCache('shoppingItems');
  }
  
  async invalidateAllCache(): Promise<void> {
    await Promise.all([
      this.invalidateListsCache(),
      this.invalidateItemsCache(),
    ]);
  }

  // Realtime update methods

  /**
   * Applies a realtime list change to cache
   * 
   * Used when realtime events arrive from Supabase. Updates the cache with the change
   * and emits a cache event to trigger UI updates via useCachedEntities.
   * 
   * Handles errors gracefully (logs but doesn't throw) since realtime updates are best-effort.
   * 
   * @param payload - The realtime postgres changes payload for a shopping list
   * @throws Never throws - errors are logged but not propagated
   */
  async applyRealtimeListChange(
    payload: RealtimePostgresChangesPayload<{
      id: string;
      name?: string | null;
      color?: string | null;
      household_id?: string | null;
    }>
  ): Promise<void> {
    try {
      // Read current cache
      const current = await readCachedEntitiesForUpdate<ShoppingList>('shoppingLists');
      
      // Apply change using existing utility
      // Type assertion needed: utility expects ShoppingListRow (name?: string) but payload has name?: string | null
      // This is safe because the utility handles null/undefined via normalizeListName
      const updated = applyShoppingListChange(current, payload as RealtimePostgresChangesPayload<{
        id: string;
        name?: string;
        color?: string | null;
        household_id?: string | null;
      }>);
      
      // Write back to cache
      await setCached('shoppingLists', updated, (l) => this.getListId(l));
      
      // Emit cache event to trigger UI update
      cacheEvents.emitCacheChange('shoppingLists');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to apply realtime list change to cache:', errorMessage, error);
      // Don't throw - realtime updates are best-effort
    }
  }

  /**
   * Applies a realtime item change to cache
   * 
   * Used when realtime events arrive from Supabase. Updates the cache with the change
   * and emits a cache event to trigger UI updates via useCachedEntities.
   * 
   * Handles errors gracefully (logs but doesn't throw) since realtime updates are best-effort.
   * 
   * @param payload - The realtime postgres changes payload for a shopping item
   * @param groceryItems - Grocery items for matching item metadata (images, categories)
   * @throws Never throws - errors are logged but not propagated
   */
  async applyRealtimeItemChange(
    payload: RealtimePostgresChangesPayload<{
      id: string;
      list_id?: string | null;
      name?: string | null;
      quantity?: number | null;
      category?: string | null;
      is_checked?: boolean | null;
    }>,
    groceryItems: GroceryItem[]
  ): Promise<void> {
    try {
      // Read current cache
      const current = await readCachedEntitiesForUpdate<ShoppingItem>('shoppingItems');
      
      // Apply change using existing utility
      const updated = applyShoppingItemChange(current, payload, groceryItems);
      
      // Write back to cache
      await setCached('shoppingItems', updated, (i) => this.getItemId(i));
      
      // Emit cache event to trigger UI update
      cacheEvents.emitCacheChange('shoppingItems');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to apply realtime item change to cache:', errorMessage, error);
      // Don't throw - realtime updates are best-effort
    }
  }
}
