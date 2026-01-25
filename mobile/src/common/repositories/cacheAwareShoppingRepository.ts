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
  updateEntityInCache
} from './cacheAwareRepository';
import { getIsOnline } from '../utils/networkStatus';
import { api } from '../../services/api';
import { pastelColors, colors } from '../../theme';
import { v5 as uuidv5 } from 'uuid';
import { markDeleted } from '../utils/timestamps';

/**
 * DTO types for API responses (matches RemoteShoppingService)
 */
type GrocerySearchItemDto = {
  id: string;
  name: string;
  category: string;
  imageUrl?: string | null;
  defaultQuantity?: number | null;
};

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
const FREQUENTLY_ADDED_ITEMS_LIMIT = 8;
const CATEGORY_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

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
}

/**
 * Helper functions (duplicated from RemoteShoppingService for now)
 */
const mapGroceryItem = (item: GrocerySearchItemDto): GroceryItem => ({
  id: item.id,
  name: item.name,
  image: item.imageUrl ?? '',
  category: item.category,
  defaultQuantity: item.defaultQuantity ?? 1,
});

const buildCategoriesFromGroceries = (items: GroceryItem[]): Category[] => {
  const categoryMap = items.reduce<Record<string, GroceryItem[]>>((acc, item) => {
    const key = item.category || 'Other';
    const existing = acc[key] ?? [];
    return { ...acc, [key]: [...existing, item] };
  }, {});

  return Object.entries(categoryMap).map(([categoryName, categoryItems], index) => {
    const fallbackImage = categoryItems.find(item => item.image)?.image ?? '';
    const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-');
    const localId = uuidv5(categoryName, CATEGORY_NAMESPACE);
    
    return {
      id: categoryId,
      localId,
      name: categoryName,
      itemCount: categoryItems.length,
      image: fallbackImage,
      backgroundColor: pastelColors[index % pastelColors.length],
    };
  });
};

const buildFrequentlyAddedItems = (items: GroceryItem[]): GroceryItem[] => {
  return items.slice(0, FREQUENTLY_ADDED_ITEMS_LIMIT);
};

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
    const lists = await api.get<ShoppingListSummaryDto[]>('/shopping-lists');
    return lists.map(mapShoppingListSummary);
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
   * Fetches grocery items from API (not cached, always fresh)
   */
  private async getGroceryItems(): Promise<GroceryItem[]> {
    const results = await api.get<GrocerySearchItemDto[]>('/groceries/search?q=');
    return results.map(mapGroceryItem);
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
    return lists.find(l => l.id === id || l.localId === id) ?? null;
  }
  
  /**
   * Creates a shopping list with write-through caching
   * 
   * Implements write-through caching:
   * 1. Creates list on server via service
   * 2. Reads current cache
   * 3. Adds created list to cache
   * 4. Emits cache change event to trigger UI updates
   * 
   * If cache update fails, the error is logged but the operation
   * still succeeds (server write completed). Cache is invalidated
   * to force refresh on next read.
   * 
   * @param list - Partial shopping list data to create
   * @returns The created shopping list with server timestamps
   * @throws {Error} If service call fails
   */
  async createList(list: Partial<ShoppingList>): Promise<ShoppingList> {
    const created = await this.service.createList(list);
    
    // Update cache (with error handling)
    await addEntityToCache(
      'shoppingLists',
      created,
      (l) => this.getListId(l)
    );
    
    return created;
  }
  
  /**
   * Updates a shopping list with write-through caching
   * 
   * Implements write-through caching:
   * 1. Updates list on server via service
   * 2. Reads current cache
   * 3. Updates list in cache
   * 4. Emits cache change event to trigger UI updates
   * 
   * If cache update fails, the error is logged but the operation
   * still succeeds (server write completed). Cache is invalidated
   * to force refresh on next read.
   * 
   * @param id - Shopping list ID to update
   * @param updates - Partial shopping list data to update
   * @returns The updated shopping list with server timestamps
   * @throws {Error} If service call fails
   */
  async updateList(id: string, updates: Partial<ShoppingList>): Promise<ShoppingList> {
    const updated = await this.service.updateList(id, updates);
    
    // Update cache (with error handling)
    await updateEntityInCache(
      'shoppingLists',
      updated,
      (l) => this.getListId(l),
      (l) => l.id === id || l.localId === id
    );
    
    return updated;
  }
  
  /**
   * Deletes a shopping list (soft-delete) with write-through caching
   * 
   * Implements write-through caching:
   * 1. Deletes list on server via service (soft-delete)
   * 2. Reads current cache
   * 3. Marks list as deleted in cache
   * 4. Emits cache change event to trigger UI updates
   * 
   * If cache update fails, the error is logged but the operation
   * still succeeds (server write completed). Cache is invalidated
   * to force refresh on next read.
   * 
   * @param id - Shopping list ID to delete
   * @throws {Error} If service call fails
   */
  async deleteList(id: string): Promise<void> {
    await this.service.deleteList(id);
    
    // Update cache (soft-delete) with error handling
    try {
      const current = await readCachedEntitiesForUpdate<ShoppingList>('shoppingLists');
      const list = current.find(l => l.id === id || l.localId === id);
      if (list) {
        const deleted = markDeleted(list);
        await updateEntityInCache(
          'shoppingLists',
          deleted,
          (l) => this.getListId(l),
          (l) => l.id === id || l.localId === id
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to update cache after delete for shoppingLists:`, errorMessage);
      // Don't throw - server operation succeeded
      try {
        await invalidateCache('shoppingLists');
      } catch (invalidateError) {
        // Ignore invalidation errors
        console.error(`Failed to invalidate cache after delete error:`, invalidateError);
      }
    }
  }
  
  // Items operations
  
  async findAllItems(): Promise<ShoppingItem[]> {
    return getCached<ShoppingItem>(
      'shoppingItems',
      () => this.fetchItemsFromApi(),
      (item) => this.getItemId(item),
      getIsOnline()
    );
  }
  
  async findItemsByListId(listId: string): Promise<ShoppingItem[]> {
    const items = await this.findAllItems();
    return items.filter(item => item.listId === listId);
  }
  
  /**
   * Creates a shopping item with write-through caching
   * 
   * Implements write-through caching:
   * 1. Creates item on server via service
   * 2. Reads current cache
   * 3. Adds created item to cache
   * 4. Emits cache change event to trigger UI updates
   * 
   * If cache update fails, the error is logged but the operation
   * still succeeds (server write completed). Cache is invalidated
   * to force refresh on next read.
   * 
   * @param item - Partial shopping item data to create
   * @returns The created shopping item with server timestamps
   * @throws {Error} If service call fails
   */
  async createItem(item: Partial<ShoppingItem>): Promise<ShoppingItem> {
    const created = await this.service.createItem(item);
    
    // Update cache (with error handling)
    await addEntityToCache(
      'shoppingItems',
      created,
      (i) => this.getItemId(i)
    );
    
    return created;
  }
  
  /**
   * Updates a shopping item with write-through caching
   * 
   * Implements write-through caching:
   * 1. Updates item on server via service
   * 2. Reads current cache
   * 3. Updates item in cache
   * 4. Emits cache change event to trigger UI updates
   * 
   * If cache update fails, the error is logged but the operation
   * still succeeds (server write completed). Cache is invalidated
   * to force refresh on next read.
   * 
   * @param id - Shopping item ID to update
   * @param updates - Partial shopping item data to update
   * @returns The updated shopping item with server timestamps
   * @throws {Error} If service call fails
   */
  async updateItem(id: string, updates: Partial<ShoppingItem>): Promise<ShoppingItem> {
    const updated = await this.service.updateItem(id, updates);
    
    // Update cache (with error handling)
    await updateEntityInCache(
      'shoppingItems',
      updated,
      (i) => this.getItemId(i),
      (i) => i.id === id || i.localId === id
    );
    
    return updated;
  }
  
  /**
   * Deletes a shopping item (soft-delete) with write-through caching
   * 
   * Implements write-through caching:
   * 1. Deletes item on server via service (soft-delete)
   * 2. Reads current cache
   * 3. Marks item as deleted in cache
   * 4. Emits cache change event to trigger UI updates
   * 
   * If cache update fails, the error is logged but the operation
   * still succeeds (server write completed). Cache is invalidated
   * to force refresh on next read.
   * 
   * @param id - Shopping item ID to delete
   * @throws {Error} If service call fails
   */
  async deleteItem(id: string): Promise<void> {
    await this.service.deleteItem(id);
    
    // Update cache (soft-delete) with error handling
    try {
      const current = await readCachedEntitiesForUpdate<ShoppingItem>('shoppingItems');
      const item = current.find(i => i.id === id || i.localId === id);
      if (item) {
        const deleted = markDeleted(item);
        await updateEntityInCache(
          'shoppingItems',
          deleted,
          (i) => this.getItemId(i),
          (i) => i.id === id || i.localId === id
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to update cache after delete for shoppingItems:`, errorMessage);
      // Don't throw - server operation succeeded
      try {
        await invalidateCache('shoppingItems');
      } catch (invalidateError) {
        // Ignore invalidation errors
        console.error(`Failed to invalidate cache after delete error:`, invalidateError);
      }
    }
  }
  
  /**
   * Toggles shopping item checked state with write-through caching
   * 
   * Implements write-through caching:
   * 1. Toggles item on server via service
   * 2. Reads current cache
   * 3. Updates item in cache
   * 4. Emits cache change event to trigger UI updates
   * 
   * If cache update fails, the error is logged but the operation
   * still succeeds (server write completed). Cache is invalidated
   * to force refresh on next read.
   * 
   * @param id - Shopping item ID to toggle
   * @returns The updated shopping item with server timestamps
   * @throws {Error} If service call fails
   */
  async toggleItem(id: string): Promise<ShoppingItem> {
    const updated = await this.service.toggleItem(id);
    
    // Update cache (with error handling)
    await updateEntityInCache(
      'shoppingItems',
      updated,
      (i) => this.getItemId(i),
      (i) => i.id === id || i.localId === id
    );
    
    return updated;
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
}
