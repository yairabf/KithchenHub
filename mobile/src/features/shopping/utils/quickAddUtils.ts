import type { Dispatch, SetStateAction } from 'react';
import type { GroceryItem } from '../components/GrocerySearchBar';
import type { ShoppingItem, ShoppingList } from '../../../mocks/shopping';
import { createShoppingItem } from './shoppingFactory';
import { DEFAULT_CATEGORY, normalizeShoppingCategory } from '../constants/categories';

/**
 * Type for shopping item creation that includes catalogItemId for API requests.
 * This type extends the base ShoppingItem with optional catalog fields
 * while making standard fields optional for creation (id, timestamps, etc).
 */
export type ShoppingItemCreateInput = {
  name: string;
  listId: string;
  quantity: number;
  category: string;
  image?: string;
  unit?: string;
  isChecked?: boolean;
  catalogItemId?: string;
  masterItemId?: string;
};

/**
 * Dependencies required for quick add functionality
 */
export interface QuickAddDependencies {
  /**
   * Current list of all shopping items
   */
  allItems: ShoppingItem[];
  /**
   * State setter for updating all items
   */
  setAllItems: Dispatch<SetStateAction<ShoppingItem[]>>;
  /**
   * Function to create a new shopping item via service
   */
  createItem: (item: ShoppingItemCreateInput) => Promise<ShoppingItem>;
  /**
   * Function to update an existing shopping item via service
   */
  updateItem: (itemId: string, updates: Partial<ShoppingItem>) => Promise<ShoppingItem>;
  /**
   * Helper function for optimistic updates with error handling
   */
  executeWithOptimisticUpdate: <T>(
    operation: () => Promise<T>,
    optimisticUpdate: () => void,
    revertUpdate: () => void,
    errorMessage: string
  ) => Promise<T | null>;
  /**
   * Error logging function
   */
  logError: (message: string, error: unknown) => void;
}

/**
 * Adds a grocery item to the selected shopping list with quantity 1.
 * If the item already exists in the list, increments its quantity.
 * Uses optimistic updates for responsive UI.
 * 
 * @param groceryItem - The grocery item to add
 * @param selectedList - The shopping list to add the item to
 * @param dependencies - Required dependencies for the operation
 * 
 * @example
 * ```typescript
 * await quickAddItem(
 *   groceryItem,
 *   activeList,
 *   {
 *     allItems,
 *     setAllItems,
 *     createItem,
 *     updateItem,
 *     executeWithOptimisticUpdate,
 *     logError,
 *   }
 * );
 * ```
 */
export async function quickAddItem(
  groceryItem: GroceryItem,
  selectedList: ShoppingList,
  dependencies: QuickAddDependencies
): Promise<void> {
  const {
    allItems,
    setAllItems,
    createItem,
    updateItem,
    executeWithOptimisticUpdate,
    logError,
  } = dependencies;

  const quantity = 1;
  const isCustomItem =
    typeof groceryItem.id === 'string' && groceryItem.id.startsWith('custom-');
  const safeCategory =
    typeof groceryItem.category === 'string' && groceryItem.category.trim().length > 0
      ? normalizeShoppingCategory(groceryItem.category)
      : normalizeShoppingCategory(DEFAULT_CATEGORY.toLowerCase());
  
  // Use default category for custom items in quick add (user can select category in modal)
  const categoryToUse = isCustomItem
    ? normalizeShoppingCategory(DEFAULT_CATEGORY.toLowerCase())
    : safeCategory;

  // Check if item already exists in the selected list
  const existingItem = allItems.find(
    item => item.name === groceryItem.name && item.listId === selectedList.id
  );

  if (existingItem) {
    // Update existing item quantity - use functional update to read latest state (handles rapid clicks)
    const itemId = existingItem.id;
    const itemLocalId = existingItem.localId;
    const baseQuantity = existingItem.quantity;
    
    // nextQuantity computed from the snapshot at call-time; reused in both
    // the optimistic update and the API call to avoid stale closure reads.
    const nextQuantity = baseQuantity + quantity;

    await executeWithOptimisticUpdate(
      () => updateItem(itemId, { quantity: nextQuantity }),
      () => {
        setAllItems((prev: ShoppingItem[]) => prev.map((item) => {
          if (item.id === itemId || item.localId === itemLocalId) {
            return { ...item, quantity: nextQuantity };
          }
          return item;
        }));
      },
      () => {
        setAllItems((prev: ShoppingItem[]) => prev.map((item) => {
          if (item.id === itemId || item.localId === itemLocalId) {
            return { ...item, quantity: baseQuantity };
          }
          return item;
        }));
      },
      'Failed to update shopping item quantity:',
    );
  } else {
    // Create new item with optimistic UI update (all modes)
    const tempItem = createShoppingItem(groceryItem, selectedList.id, quantity);
    setAllItems((prev: ShoppingItem[]) => [...prev, tempItem]);

    try {
      const newItem = await createItem({
        name: groceryItem.name,
        listId: selectedList.id,
        quantity,
        category: categoryToUse,
        image: groceryItem.image,
        catalogItemId: !isCustomItem && groceryItem.id ? groceryItem.id : undefined,
      });
      
      // Replace temp item with real item from service
      setAllItems((prev: ShoppingItem[]) => prev.map((item) =>
        item.localId === tempItem.localId ? newItem : item
      ));
    } catch (error) {
      // Remove temp item on error
      setAllItems((prev: ShoppingItem[]) => prev.filter((item) => item.localId !== tempItem.localId));
      logError('Failed to create shopping item:', error);
    }
  }

  // Keep dropdown open and search query intact for rapid multi-item addition
}
