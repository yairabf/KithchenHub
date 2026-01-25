import type { ShoppingItem, ShoppingList, Category } from '../../../mocks/shopping';
import type { GroceryItem } from '../components/GrocerySearchBar';
import { validateServiceCompatibility } from '../../../common/validation/dataModeValidation';
import { LocalShoppingService } from './LocalShoppingService';
import { RemoteShoppingService } from './RemoteShoppingService';

// Re-export classes for convenience
export { LocalShoppingService, RemoteShoppingService };

/**
 * Provides shopping data sources (mock vs remote) for the shopping feature.
 */
export interface ShoppingData {
  shoppingLists: ShoppingList[];
  shoppingItems: ShoppingItem[];
  categories: Category[];
  groceryItems: GroceryItem[];
  frequentlyAddedItems: GroceryItem[];
}

export interface IShoppingService {
  getShoppingData(): Promise<ShoppingData>;
  // CRUD methods
  createList(list: Partial<ShoppingList>): Promise<ShoppingList>;
  updateList(listId: string, updates: Partial<ShoppingList>): Promise<ShoppingList>;
  deleteList(listId: string): Promise<void>;
  createItem(item: Partial<ShoppingItem>): Promise<ShoppingItem>;
  updateItem(itemId: string, updates: Partial<ShoppingItem>): Promise<ShoppingItem>;
  deleteItem(itemId: string): Promise<void>;
  toggleItem(itemId: string): Promise<ShoppingItem>;
}


/**
 * Creates a shopping service based on the data mode
 * 
 * @param mode - The data mode ('guest' | 'signed-in' | 'public-catalog')
 * @param entityType - The type of entity being accessed (for validation)
 * @returns The appropriate shopping service implementation
 * @throws Error if the mode and service type are incompatible
 */
export const createShoppingService = (
  mode: 'guest' | 'signed-in',
  entityType: 'shopping-lists' | 'shopping-items' = 'shopping-lists'
): IShoppingService => {
  // Validate service compatibility
  const serviceType = mode === 'guest' ? 'local' : 'remote';
  validateServiceCompatibility(serviceType, mode);
  
  return mode === 'guest' ? new LocalShoppingService() : new RemoteShoppingService();
};

/**
 * Legacy factory function for backward compatibility
 * @deprecated Use createShoppingService with mode parameter instead
 */
export const createShoppingServiceLegacy = (isMockEnabled: boolean): IShoppingService => {
  const mode = isMockEnabled ? 'guest' : 'signed-in';
  return createShoppingService(mode);
};
