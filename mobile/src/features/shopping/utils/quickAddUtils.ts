import type { Dispatch, SetStateAction } from 'react';
import type { GroceryItem } from '../components/GrocerySearchBar';
import type { ShoppingItem, ShoppingList } from '../../../mocks/shopping';
import { createShoppingItem } from './shoppingFactory';
import { DEFAULT_CATEGORY, normalizeShoppingCategory } from '../constants/categories';

/**
 * Type for shopping item creation that includes catalogItemId for API requests
 */
type ShoppingItemWithCatalog = Partial<ShoppingItem> & {
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
  createItem: (item: ShoppingItemWithCatalog) => Promise<ShoppingItem>;
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
  logShoppingError: (message: string, error: unknown) => void;
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
 *     logShoppingError,
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
    logShoppingError,
  } = dependencies;

  const quantity = 1;
  
  // Use default category for custom items in quick add (user can select category in modal)
  const categoryToUse = groceryItem.id.startsWith('custom-') 
    ? normalizeShoppingCategory(DEFAULT_CATEGORY.toLowerCase())
    : groceryItem.category;

  // Check if item already exists in the selected list
  const existingItem = allItems.find(
    item => item.name === groceryItem.name && item.listId === selectedList.id
  );

  if (existingItem) {
    // Update existing item quantity - use functional update to read latest state (handles rapid clicks)
    const itemId = existingItem.id;
    const itemLocalId = existingItem.localId;
    const baseQuantity = existingItem.quantity;
    
    await executeWithOptimisticUpdate(
      async () => {
        // Read current state to get latest quantity (handles rapid clicks)
        const currentItems = allItems;
        const currentItem = currentItems.find(
          item => item.id === itemId || item.localId === itemLocalId
        );
        const currentQuantity = currentItem?.quantity ?? baseQuantity;
        const nextQuantity = currentQuantity + quantity;
        
        return await updateItem(itemId, { quantity: nextQuantity });
      },
      () => {
        // Optimistic update for all modes - read latest state using functional update
        setAllItems((prev: ShoppingItem[]) => prev.map((item) => {
          if (item.id === itemId || item.localId === itemLocalId) {
            const currentQuantity = item.quantity;
            return { ...item, quantity: currentQuantity + quantity };
          }
          return item;
        }));
      },
      () => {
        // Revert - restore previous quantity
        setAllItems((prev: ShoppingItem[]) => prev.map((item) => {
          if (item.id === itemId || item.localId === itemLocalId) {
            return { ...item, quantity: baseQuantity };
          }
          return item;
        }));
      },
      'Failed to update shopping item quantity:'
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
        catalogItemId: groceryItem.id.startsWith('custom-') ? undefined : groceryItem.id,
      } as any); // Type assertion needed because ShoppingItem doesn't have catalogItemId
      
      // Replace temp item with real item from service
      setAllItems((prev: ShoppingItem[]) => prev.map((item) =>
        item.localId === tempItem.localId ? newItem : item
      ));
    } catch (error) {
      // Remove temp item on error
      setAllItems((prev: ShoppingItem[]) => prev.filter((item) => item.localId !== tempItem.localId));
      logShoppingError('Failed to create shopping item:', error);
    }
  }

  // Keep dropdown open and search query intact for rapid multi-item addition
}
