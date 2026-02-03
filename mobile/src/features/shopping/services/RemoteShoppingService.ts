import { api } from '../../../services/api';
import { colors } from '../../../theme';
import { withUpdatedAt, markDeleted, withCreatedAtAndUpdatedAt, toSupabaseTimestamps, normalizeTimestampsFromApi } from '../../../common/utils/timestamps';
import type { ShoppingItem, ShoppingList, Category } from '../../../mocks/shopping';
import type { GroceryItem } from '../components/GrocerySearchBar';
import type { ShoppingData, IShoppingService } from './shoppingService';
import { buildCategoriesFromGroceries, buildFrequentlyAddedItems } from '../../../common/utils/catalogUtils';
import { catalogService } from '../../../common/services/catalogService';
import { addEntityToCache, updateEntityInCache } from '../../../common/repositories/cacheAwareRepository';

/**
 * Extended ShoppingItem type that includes catalog identifiers for API requests.
 * 
 * Used when creating items from grocery catalog - the catalogItemId/masterItemId
 * are passed but not part of the base ShoppingItem type.
 */
interface ShoppingItemWithCatalog extends Partial<ShoppingItem> {
  catalogItemId?: string;
  masterItemId?: string;
}

/**
 * Backend ShoppingItemInputDto type matching the API contract.
 */
interface ShoppingItemInputDto {
  catalogItemId?: string;
  masterItemId?: string;
  name?: string;
  quantity?: number;
  unit?: string;
  category?: string;
  image?: string;
  isChecked?: boolean;
}

type ShoppingListSummaryDto = {
  id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  itemCount?: number | null;
};

type ShoppingListDetailDto = {
  id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  items: {
    id: string;
    name: string;
    quantity?: number | null;
    unit?: string | null;
    isChecked?: boolean | null;
    category?: string | null;
    image?: string | null;
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
  icon: (list.icon as ShoppingList['icon']) ?? DEFAULT_LIST_ICON,
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
      image: item.image ?? matchingGrocery?.image ?? '',
      quantity: item.quantity ?? 1,
      unit: item.unit ?? undefined,
      isChecked: item.isChecked ?? false,
      category: item.category ?? matchingGrocery?.category ?? 'Other',
      listId,
    };
  });
};

/**
 * Maps API response item to ShoppingItem format.
 * 
 * Centralizes the mapping logic used in createItem, updateItem, and toggleItem
 * to ensure consistency and reduce duplication.
 * 
 * @param response - API response item from ShoppingListDetailDto
 * @param listId - The shopping list ID this item belongs to
 * @param existingImage - Optional existing image URL to preserve
 * @returns Mapped ShoppingItem
 */
const mapItemResponseToShoppingItem = (
  response: ShoppingListDetailDto['items'][0],
  listId: string,
  existingImage?: string
): ShoppingItem => {
  return {
    id: response.id,
    localId: response.id,
    name: response.name,
    quantity: response.quantity ?? 1,
    unit: response.unit ?? undefined,
    isChecked: response.isChecked ?? false,
    category: response.category ?? 'Other',
    listId,
    image: response.image ?? existingImage ?? '',
  };
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

  /**
   * Maps frontend ShoppingList to backend CreateListDto format
   */
  private mapListToCreateDto(list: Partial<ShoppingList>): { name: string; color?: string; icon?: string } {
    return {
      name: list.name || 'New List',
      color: list.color,
      icon: list.icon,
    };
  }

  /**
   * Maps frontend ShoppingItem to backend ShoppingItemInputDto
   * 
   * The API expects AddItemsDto with items array containing ShoppingItemInputDto.
   * ShoppingItemInputDto has:
   * - catalogItemId?: string (if item comes from catalog)
   * - masterItemId?: string (if item comes from master catalog)
   * - name?: string (only if no catalogItemId/masterItemId)
   * - quantity?: number
   * - unit?: string
   * - category?: string
   * - image?: string
   * - isChecked?: boolean
   * 
   * Note: Timestamps, id, listId are not sent - backend generates these.
   * 
   * @param item - Shopping item with optional catalog identifiers
   * @returns ShoppingItemInputDto matching backend API contract
   * @throws Error if name is required but missing or invalid
   */
  private mapItemToInputDto(item: ShoppingItemWithCatalog): ShoppingItemInputDto {
    const catalogItemId = item.catalogItemId;
    const masterItemId = item.masterItemId;
    
    const itemInputDto: ShoppingItemInputDto = {
      quantity: item.quantity ?? 1,
      unit: item.unit,
      category: item.category,
      image: item.image,
      isChecked: item.isChecked ?? false,
    };

    // Validate quantity is non-negative
    if (itemInputDto.quantity !== undefined && itemInputDto.quantity < 0) {
      throw new Error('Item quantity cannot be negative');
    }

    // Only include name if no catalog identifiers
    if (catalogItemId) {
      itemInputDto.catalogItemId = catalogItemId;
    } else if (masterItemId) {
      itemInputDto.masterItemId = masterItemId;
    } else {
      // No catalog identifier - name is required
      const itemName = item.name?.trim();
      if (!itemName || itemName.length === 0) {
        throw new Error('Item name is required when catalogItemId/masterItemId is not provided');
      }
      itemInputDto.name = itemName;
    }

    return itemInputDto;
  }

  async createList(list: Partial<ShoppingList>): Promise<ShoppingList> {
    console.log('[RemoteShoppingService] createList() called with list:', JSON.stringify(list, null, 2));
    
    // Map frontend ShoppingList format to backend CreateListDto format
    const dto = this.mapListToCreateDto(list);
    console.log('[RemoteShoppingService] Mapped to CreateListDto:', JSON.stringify(dto, null, 2));
    
    console.log('[RemoteShoppingService] Making POST request to /shopping-lists...');
    const response = await api.post<ShoppingListSummaryDto>('/shopping-lists', dto);
    console.log('[RemoteShoppingService] API response received:', JSON.stringify(response, null, 2));
    
    const mapped = mapShoppingListSummary(response);
    console.log('[RemoteShoppingService] Mapped response to ShoppingList:', JSON.stringify(mapped, null, 2));
    
    // Server is authority: overwrite with server timestamps (if available in response)
    // If API response includes timestamp fields, normalize them; otherwise use optimistic timestamps
    const hasServerTimestamps = 'created_at' in response || 'updated_at' in response || 
                                 'createdAt' in response || 'updatedAt' in response;
    const created = hasServerTimestamps
      ? normalizeTimestampsFromApi<ShoppingList>({ ...mapped, ...response })
      : { ...mapped, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    
    console.log('[RemoteShoppingService] Final created list:', JSON.stringify(created, null, 2));
    
    // Write-through cache update: add new entity to cache
    // Note: Cache updates are best-effort; failures are logged but don't throw
    await addEntityToCache('shoppingLists', created, (l) => l.id);
    console.log('[RemoteShoppingService] Added to cache');
    
    return created;
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
    // Server is authority: overwrite with server timestamps (if available in response)
    // If API response includes timestamp fields, normalize them; otherwise use optimistic timestamps
    const hasServerTimestamps = 'created_at' in response || 'updated_at' in response || 
                                 'createdAt' in response || 'updatedAt' in response;
    const updatedList = hasServerTimestamps
      ? normalizeTimestampsFromApi<ShoppingList>({ ...mapped, ...response })
      : { ...mapped, createdAt: existing.createdAt, updatedAt: withTimestamps.updatedAt };
    
    // Write-through cache update: update entity in cache
    // Note: Cache updates are best-effort; failures are logged but don't throw
    await updateEntityInCache('shoppingLists', updatedList, (l) => l.id, (l) => l.id === listId);
    
    return updatedList;
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
    
    // Write-through cache update: update entity in cache with deleted timestamp
    // Note: Cache updates are best-effort; failures are logged but don't throw
    await updateEntityInCache('shoppingLists', withTimestamps, (l) => l.id, (l) => l.id === listId);
  }

  async createItem(item: ShoppingItemWithCatalog): Promise<ShoppingItem> {
    if (!item.listId) {
      throw new Error('Shopping item must have a listId');
    }
    
    // Map to backend DTO format: { items: [ShoppingItemInputDto] }
    const itemInputDto = this.mapItemToInputDto(item);
    const payload = { items: [itemInputDto] };
    
    console.log('[RemoteShoppingService] createItem() payload:', JSON.stringify(payload, null, 2));
    
    // API returns { addedItems: [...] }, we take the first item
    type AddItemsResponse = {
      addedItems: Array<{
        id: string;
        catalogItemId?: string;
        name: string;
        quantity: number;
        unit?: string;
        isChecked: boolean;
        category?: string;
      }>;
    };
    const response = await api.post<AddItemsResponse>(`/shopping-lists/${item.listId}/items`, payload);
    
    // Validate response structure
    if (!response.addedItems || response.addedItems.length === 0) {
      console.error('[RemoteShoppingService] API returned empty addedItems array:', response);
      throw new Error(`API did not return created item. Response: ${JSON.stringify(response)}`);
    }
    
    const createdItem = response.addedItems[0];
    if (!createdItem || !createdItem.id) {
      console.error('[RemoteShoppingService] Invalid item in response:', createdItem);
      throw new Error('API returned invalid item structure');
    }
    
    // Map response to ShoppingItem format (createdItem matches ShoppingListDetailDto['items'][0] structure)
    const mapped = mapItemResponseToShoppingItem(createdItem as ShoppingListDetailDto['items'][0], item.listId, item.image);
    // Server is authority: overwrite with server timestamps (if available in response)
    // If API response includes timestamp fields, normalize them; otherwise use optimistic timestamps
    const hasServerTimestamps = 'created_at' in createdItem || 'updated_at' in createdItem || 
                                 'createdAt' in createdItem || 'updatedAt' in createdItem;
    const withTimestamps = withCreatedAtAndUpdatedAt(item as ShoppingItem);
    const created = hasServerTimestamps
      ? normalizeTimestampsFromApi<ShoppingItem>({ ...mapped, ...createdItem })
      : { ...mapped, createdAt: withTimestamps.createdAt, updatedAt: withTimestamps.updatedAt };
    
    // Write-through cache update: add new entity to cache
    // Note: Cache updates are best-effort; failures are logged but don't throw
    await addEntityToCache('shoppingItems', created, (i) => i.id);
    
    return created;
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
    const mapped = mapItemResponseToShoppingItem(response, existing.listId, existing.image);
    // Server is authority: overwrite with server timestamps (if available in response)
    // If API response includes timestamp fields, normalize them; otherwise use optimistic timestamps
    const hasServerTimestamps = 'created_at' in response || 'updated_at' in response || 
                                 'createdAt' in response || 'updatedAt' in response;
    const updatedItem = hasServerTimestamps
      ? normalizeTimestampsFromApi<ShoppingItem>({ ...mapped, ...response })
      : { ...mapped, createdAt: existing.createdAt, updatedAt: withTimestamps.updatedAt };
    
    // Write-through cache update: update entity in cache
    // Note: Cache updates are best-effort; failures are logged but don't throw
    await updateEntityInCache('shoppingItems', updatedItem, (i) => i.id, (i) => i.id === itemId);
    
    return updatedItem;
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
    
    // Write-through cache update: update entity in cache with deleted timestamp
    // Note: Cache updates are best-effort; failures are logged but don't throw
    await updateEntityInCache('shoppingItems', withTimestamps, (i) => i.id, (i) => i.id === itemId);
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
    const mapped = mapItemResponseToShoppingItem(response, existing.listId, existing.image);
    // Server is authority: overwrite with server timestamps (if available in response)
    // If API response includes timestamp fields, normalize them; otherwise use optimistic timestamps
    const hasServerTimestamps = 'created_at' in response || 'updated_at' in response || 
                                 'createdAt' in response || 'updatedAt' in response;
    const toggledItem = hasServerTimestamps
      ? normalizeTimestampsFromApi<ShoppingItem>({ ...mapped, ...response })
      : { ...mapped, createdAt: existing.createdAt, updatedAt: withTimestamps.updatedAt };
    
    // Write-through cache update: update entity in cache
    // Note: Cache updates are best-effort; failures are logged but don't throw
    await updateEntityInCache('shoppingItems', toggledItem, (i) => i.id, (i) => i.id === itemId);
    
    return toggledItem;
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
    const raw = await api.get<ShoppingListSummaryDto[] | undefined>('/shopping-lists');
    const lists = Array.isArray(raw) ? raw : [];
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

    return listDetails.flatMap((detail) => {
      const listDetail = detail && typeof detail === 'object' && 'id' in detail && 'items' in detail
        ? detail
        : { id: '', items: [] as ShoppingListDetailDto['items'] };
      const items = Array.isArray(listDetail.items) ? listDetail.items : [];
      return buildShoppingItemsFromDetails(listDetail.id, items, groceryItems);
    });
  }
}
