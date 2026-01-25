import { api } from '../../../services/api';
import { colors } from '../../../theme';
import { withUpdatedAt, markDeleted, withCreatedAt, toSupabaseTimestamps } from '../../../common/utils/timestamps';
import type { ShoppingItem, ShoppingList, Category } from '../../../mocks/shopping';
import type { GroceryItem } from '../components/GrocerySearchBar';
import type { ShoppingData, IShoppingService } from './shoppingService';
import { buildCategoriesFromGroceries, buildFrequentlyAddedItems } from '../../../common/utils/catalogUtils';
import { catalogService } from '../../../common/services/catalogService';

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

// Note: Category building utilities moved to common/utils/catalogUtils.ts
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
 * Remote shopping service for signed-in users.
 * 
 * This service should only be instantiated for signed-in users.
 * Service factory (createShoppingService) prevents guest mode from creating this service.
 * 
 * Defense-in-depth: All methods make API calls which require authentication.
 * Guest users cannot provide valid JWT tokens, so API calls will fail at the backend.
 */
export class RemoteShoppingService implements IShoppingService {
  async getShoppingData(): Promise<ShoppingData> {
    const groceryItems = await this.getGroceryItems();
    const shoppingLists = await this.getShoppingLists();
    const shoppingItems = await this.getShoppingItems(shoppingLists, groceryItems);

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

  async createList(list: Partial<ShoppingList>): Promise<ShoppingList> {
    // Apply timestamp for optimistic UI and offline queue
    const withTimestamps = withCreatedAt(list as ShoppingList);
    const payload = toSupabaseTimestamps(withTimestamps);
    const response = await api.post<ShoppingListSummaryDto>('/shopping-lists', payload);
    const mapped = mapShoppingListSummary(response);
    // Server is authority: overwrite with server timestamps (if available in response)
    return mapped;
  }

  async updateList(listId: string, updates: Partial<ShoppingList>): Promise<ShoppingList> {
    // Get existing list first
    const existing = await this.getShoppingLists().then(lists => 
      lists.find(l => l.id === listId)
    );
    if (!existing) {
      throw new Error(`Shopping list not found: ${listId}`);
    }
    
    // Apply timestamp for optimistic UI and offline queue
    const updated = { ...existing, ...updates };
    const withTimestamps = withUpdatedAt(updated);
    const payload = toSupabaseTimestamps(withTimestamps);
    const response = await api.put<ShoppingListSummaryDto>(`/shopping-lists/${listId}`, payload);
    const mapped = mapShoppingListSummary(response);
    // Server is authority: overwrite with server timestamps
    return mapped;
  }

  async deleteList(listId: string): Promise<void> {
    // Get existing list
    const existing = await this.getShoppingLists().then(lists => 
      lists.find(l => l.id === listId)
    );
    if (!existing) {
      throw new Error(`Shopping list not found: ${listId}`);
    }
    
    // Apply timestamp for optimistic UI and offline queue
    const deleted = markDeleted(existing);
    const withTimestamps = withUpdatedAt(deleted);
    const payload = toSupabaseTimestamps(withTimestamps);
    
    // Use PATCH instead of DELETE with body (more compatible)
    await api.patch(`/shopping-lists/${listId}`, { deleted_at: payload.deleted_at });
  }

  async createItem(item: Partial<ShoppingItem>): Promise<ShoppingItem> {
    if (!item.listId) {
      throw new Error('Shopping item must have a listId');
    }
    
    // Apply timestamp for optimistic UI and offline queue
    const withTimestamps = withCreatedAt(item as ShoppingItem);
    const payload = toSupabaseTimestamps(withTimestamps);
    const response = await api.post<ShoppingListDetailDto['items'][0]>(`/shopping-lists/${item.listId}/items`, payload);
    // Map response to ShoppingItem format
    const mapped: ShoppingItem = {
      id: response.id,
      localId: response.id,
      name: response.name,
      quantity: response.quantity ?? 1,
      unit: response.unit ?? undefined,
      isChecked: response.isChecked ?? false,
      category: response.category ?? 'Other',
      listId: item.listId,
      image: '',
    };
    // Server is authority: overwrite with server timestamps (if available in response)
    return mapped;
  }

  async updateItem(itemId: string, updates: Partial<ShoppingItem>): Promise<ShoppingItem> {
    // Get existing item first
    const allItems = await this.getShoppingItems(
      await this.getShoppingLists(),
      await this.getGroceryItems()
    );
    const existing = allItems.find(i => i.id === itemId || i.localId === itemId);
    if (!existing) {
      throw new Error(`Shopping item not found: ${itemId}`);
    }
    
    // Apply timestamp for optimistic UI and offline queue
    const updated = { ...existing, ...updates };
    const withTimestamps = withUpdatedAt(updated);
    const payload = toSupabaseTimestamps(withTimestamps);
    const response = await api.patch<ShoppingListDetailDto['items'][0]>(`/shopping-items/${itemId}`, payload);
    // Map response to ShoppingItem format
    const mapped: ShoppingItem = {
      id: response.id,
      localId: response.id,
      name: response.name,
      quantity: response.quantity ?? 1,
      unit: response.unit ?? undefined,
      isChecked: response.isChecked ?? false,
      category: response.category ?? 'Other',
      listId: existing.listId,
      image: existing.image,
    };
    // Server is authority: overwrite with server timestamps
    return mapped;
  }

  async deleteItem(itemId: string): Promise<void> {
    // Get existing item first
    const allItems = await this.getShoppingItems(
      await this.getShoppingLists(),
      await this.getGroceryItems()
    );
    const existing = allItems.find(i => i.id === itemId || i.localId === itemId);
    if (!existing) {
      throw new Error(`Shopping item not found: ${itemId}`);
    }
    
    // Apply timestamp for optimistic UI and offline queue
    const deleted = markDeleted(existing);
    const withTimestamps = withUpdatedAt(deleted);
    const payload = toSupabaseTimestamps(withTimestamps);
    
    // Use PATCH instead of DELETE with body (more compatible)
    await api.patch(`/shopping-items/${itemId}`, { deleted_at: payload.deleted_at });
  }

  async toggleItem(itemId: string): Promise<ShoppingItem> {
    // Get existing item first
    const allItems = await this.getShoppingItems(
      await this.getShoppingLists(),
      await this.getGroceryItems()
    );
    const existing = allItems.find(i => i.id === itemId || i.localId === itemId);
    if (!existing) {
      throw new Error(`Shopping item not found: ${itemId}`);
    }
    
    // Apply timestamp for optimistic UI and offline queue
    const updated = { 
      ...existing, 
      isChecked: !existing.isChecked 
    };
    const withTimestamps = withUpdatedAt(updated);
    const payload = toSupabaseTimestamps(withTimestamps);
    const response = await api.patch<ShoppingListDetailDto['items'][0]>(`/shopping-items/${itemId}`, { 
      is_checked: !existing.isChecked,
      updated_at: payload.updated_at 
    });
    // Map response to ShoppingItem format
    const mapped: ShoppingItem = {
      id: response.id,
      localId: response.id,
      name: response.name,
      quantity: response.quantity ?? 1,
      unit: response.unit ?? undefined,
      isChecked: response.isChecked ?? false,
      category: response.category ?? 'Other',
      listId: existing.listId,
      image: existing.image,
    };
    // Server is authority: overwrite with server timestamps
    return mapped;
  }

  /**
   * Fetches grocery items using CatalogService with fallback strategy.
   * 
   * Delegates to CatalogService which implements: API → Cache → Mock fallback.
   * This ensures consistent behavior across all services and always returns data
   * (never throws on network errors - always has mock fallback).
   * 
   * @returns Array of grocery items (never empty - always has mock fallback)
   */
  private async getGroceryItems(): Promise<GroceryItem[]> {
    return catalogService.getGroceryItems();
  }

  private async getShoppingLists(): Promise<ShoppingList[]> {
    const lists = await api.get<ShoppingListSummaryDto[]>('/shopping-lists');
    return lists.map(mapShoppingListSummary);
  }

  private async getShoppingItems(
    shoppingLists: ShoppingList[],
    groceryItems: GroceryItem[],
  ): Promise<ShoppingItem[]> {
    const listDetails = await Promise.all(
      shoppingLists.map((list) =>
        api.get<ShoppingListDetailDto>(`/shopping-lists/${list.id}`)
      )
    );

    return listDetails.flatMap((listDetail) =>
      buildShoppingItemsFromDetails(listDetail.id, listDetail.items, groceryItems)
    );
  }
}
