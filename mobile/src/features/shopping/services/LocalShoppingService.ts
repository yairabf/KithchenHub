import {
  type ShoppingItem,
  type ShoppingList,
  type Category,
  mockShoppingLists,
  mockItems,
} from '../../../mocks/shopping';
import type { GroceryItem } from '../components/GrocerySearchBar';
import { colors } from '../../../theme';
import { guestStorage } from '../../../common/utils/guestStorage';
import { withUpdatedAt, markDeleted, withCreatedAt } from '../../../common/utils/timestamps';
import { findEntityIndex, updateEntityInStorage } from '../../../common/utils/entityOperations';
import { createShoppingList, createShoppingItem } from '../utils/shoppingFactory';
import { isEntityActive } from '../../../common/types/entityMetadata';
import type { ShoppingData, IShoppingService } from './shoppingService';
import { catalogService } from '../../../common/services/catalogService';
import { isDevMode } from '../../../common/utils/devMode';
import { config } from '../../../config';

const DEFAULT_LIST_ICON: ShoppingList['icon'] = 'cart-outline';
const DEFAULT_LIST_COLOR = colors.shopping;

export class LocalShoppingService implements IShoppingService {
  /**
   * Seeds mock shopping lists and items into storage when empty (dev-only).
   * 
   * This method checks if the app is in development mode and if storage is truly empty
   * (no records at all, including soft-deleted). If both conditions are met, it seeds
   * mock shopping lists and items with proper timestamps and saves them to storage.
   * 
   * Note: guestStorage.getShoppingLists() returns ALL lists including soft-deleted ones.
   * So lists.length === 0 means storage is truly empty (no records at all).
   * 
   * @param existingLists - Current shopping lists from storage
   * @param existingItems - Current shopping items from storage
   * @returns Object with seeded lists and items if seeding occurred, null otherwise
   * @throws {Error} If seeding fails with a descriptive error message
   * @private
   */
  private async seedShoppingDataIfEmpty(
    existingLists: ShoppingList[],
    existingItems: ShoppingItem[]
  ): Promise<{ lists: ShoppingList[]; items: ShoppingItem[] } | null> {
    // Only seed in dev mode or when mock data is enabled, and when storage is truly empty
    const shouldSeed = (isDevMode() || config.mockData.enabled) && existingLists.length === 0 && existingItems.length === 0;
    if (!shouldSeed) {
      return null;
    }

    try {
      // Ensure all mock lists and items have createdAt timestamps
      // withCreatedAt() is safe - it won't overwrite existing timestamps
      const seededLists = mockShoppingLists.map(list => withCreatedAt(list));
      const seededItems = mockItems.map(item => withCreatedAt(item));
      
      // Save seeded data to storage
      await guestStorage.saveShoppingLists(seededLists);
      await guestStorage.saveShoppingItems(seededItems);
      
      return { lists: seededLists, items: seededItems };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to seed mock shopping data in dev mode: ${errorMessage}`);
    }
  }

  async getShoppingData(): Promise<ShoppingData> {
    // Read from real guest storage, return empty arrays if no data exists
    const guestLists = await guestStorage.getShoppingLists();
    const guestItems = await guestStorage.getShoppingItems();

    // Seed mock data if storage is empty (dev mode only)
    const seededData = await this.seedShoppingDataIfEmpty(guestLists, guestItems);
    const listsToUse = seededData?.lists ?? guestLists;
    const itemsToUse = seededData?.items ?? guestItems;

    // Filter out deleted items (soft-delete tombstone pattern)
    const activeLists = listsToUse.filter(isEntityActive);
    const activeItems = itemsToUse.filter(isEntityActive);

    // Fetch catalog data from API (with fallback to cache and mock)
    const catalogData = await catalogService.getCatalogData();

    return {
      shoppingLists: activeLists,
      shoppingItems: activeItems,
      // Catalog data from API (with fallback)
      categories: catalogData.categories,
      groceryItems: catalogData.groceryItems,
      frequentlyAddedItems: catalogData.frequentlyAddedItems,
    };
  }

  async createList(list: Partial<ShoppingList>): Promise<ShoppingList> {
    const newList = createShoppingList(
      list.name || 'New List',
      list.icon || DEFAULT_LIST_ICON,
      list.color || DEFAULT_LIST_COLOR
    );
    
    const existingLists = await guestStorage.getShoppingLists();
    await guestStorage.saveShoppingLists([...existingLists, newList]);
    return newList;
  }

  async updateList(listId: string, updates: Partial<ShoppingList>): Promise<ShoppingList> {
    const existingLists = await guestStorage.getShoppingLists();
    const listIndex = findEntityIndex(existingLists, listId, 'Shopping list');
    
    return updateEntityInStorage(
      existingLists,
      listIndex,
      (list) => withUpdatedAt({ ...list, ...updates }),
      guestStorage.saveShoppingLists
    );
  }

  async deleteList(listId: string): Promise<void> {
    const existingLists = await guestStorage.getShoppingLists();
    const listIndex = findEntityIndex(existingLists, listId, 'Shopping list');
    
    await updateEntityInStorage(
      existingLists,
      listIndex,
      (list) => withUpdatedAt(markDeleted(list)),
      guestStorage.saveShoppingLists
    );
  }

  async createItem(item: Partial<ShoppingItem>): Promise<ShoppingItem> {
    if (!item.listId) {
      throw new Error('Shopping item must have a listId');
    }
    
    const newItem = createShoppingItem(
      item as GroceryItem,
      item.listId,
      item.quantity || 1
    );
    
    const existingItems = await guestStorage.getShoppingItems();
    await guestStorage.saveShoppingItems([...existingItems, newItem]);
    return newItem;
  }

  async updateItem(itemId: string, updates: Partial<ShoppingItem>): Promise<ShoppingItem> {
    const existingItems = await guestStorage.getShoppingItems();
    const itemIndex = findEntityIndex(existingItems, itemId, 'Shopping item');
    
    return updateEntityInStorage(
      existingItems,
      itemIndex,
      (item) => withUpdatedAt({ ...item, ...updates }),
      guestStorage.saveShoppingItems
    );
  }

  async deleteItem(itemId: string): Promise<void> {
    const existingItems = await guestStorage.getShoppingItems();
    const itemIndex = findEntityIndex(existingItems, itemId, 'Shopping item');
    
    await updateEntityInStorage(
      existingItems,
      itemIndex,
      (item) => withUpdatedAt(markDeleted(item)),
      guestStorage.saveShoppingItems
    );
  }

  async toggleItem(itemId: string): Promise<ShoppingItem> {
    const existingItems = await guestStorage.getShoppingItems();
    const itemIndex = findEntityIndex(existingItems, itemId, 'Shopping item');
    
    return updateEntityInStorage(
      existingItems,
      itemIndex,
      (item) => withUpdatedAt({ ...item, isChecked: !item.isChecked }),
      guestStorage.saveShoppingItems
    );
  }
}
