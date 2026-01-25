import {
  mockCategories,
  mockFrequentlyAddedItems,
  type ShoppingItem,
  type ShoppingList,
  type Category,
} from '../../../mocks/shopping';
import type { GroceryItem } from '../components/GrocerySearchBar';
import { mockGroceriesDB } from '../../../data/groceryDatabase';
import { colors } from '../../../theme';
import { guestStorage } from '../../../common/utils/guestStorage';
import { withUpdatedAt, markDeleted } from '../../../common/utils/timestamps';
import { findEntityIndex, updateEntityInStorage } from '../../../common/utils/entityOperations';
import { createShoppingList, createShoppingItem } from '../utils/shoppingFactory';
import { isEntityActive } from '../../../common/types/entityMetadata';
import type { ShoppingData, IShoppingService } from './shoppingService';

const DEFAULT_LIST_ICON: ShoppingList['icon'] = 'cart-outline';
const DEFAULT_LIST_COLOR = colors.shopping;

export class LocalShoppingService implements IShoppingService {
  async getShoppingData(): Promise<ShoppingData> {
    // Read from real guest storage, return empty arrays if no data exists
    const guestLists = await guestStorage.getShoppingLists();
    const guestItems = await guestStorage.getShoppingItems();

    // Filter out deleted items (soft-delete tombstone pattern)
    const activeLists = guestLists.filter(isEntityActive);
    const activeItems = guestItems.filter(isEntityActive);

    return {
      shoppingLists: activeLists,
      shoppingItems: activeItems,
      // Categories and grocery items are still from mocks (they're reference data, not user data)
      categories: [...mockCategories],
      groceryItems: [...mockGroceriesDB],
      frequentlyAddedItems: [...mockFrequentlyAddedItems],
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
