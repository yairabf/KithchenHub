import type { ShoppingItem, ShoppingList } from '../../../../mocks/shopping';
import type { GroceryItem } from '../GrocerySearchBar';

/**
 * Props for the ShoppingItemCard sub-component.
 * Renders a single shopping list item with swipe-to-delete and quantity controls.
 */
export interface ShoppingItemCardProps {
  /** The shopping item to display */
  item: ShoppingItem;
  
  /** Index in the list (for potential styling variations) */
  index: number;
  
  /** Callback fired when user swipes to delete the item */
  onDeleteItem: (id: string) => void;
  
  /** Callback fired when user changes item quantity (+1 or -1) */
  onQuantityChange: (id: string, delta: number) => void;
  
  /** Callback fired when user toggles item checked state */
  onToggleItemChecked: (id: string) => void;
}

/**
 * Props for ShoppingListPanel component.
 * Main panel displaying shopping lists, items, and search functionality.
 */
export interface ShoppingListPanelProps {
  /** Array of all available shopping lists */
  shoppingLists: ShoppingList[];
  
  /** Currently selected/active shopping list */
  selectedList: ShoppingList;
  
  /** Filtered items belonging to the selected list */
  filteredItems: ShoppingItem[];
  
  /** Available grocery items for search/add operations */
  groceryItems: GroceryItem[];
  
  /** Callback fired when user selects a different list */
  onSelectList: (list: ShoppingList) => void;
  
  /** Callback fired when user wants to create a new list */
  onCreateList: () => void;
  
  /** Callback fired when user selects a grocery item from search */
  onSelectGroceryItem: (item: GroceryItem) => void;
  
  /** Callback fired when user quick-adds a grocery item */
  onQuickAddItem: (item: GroceryItem) => void;
  
  /** Callback fired when user changes an item's quantity */
  onQuantityChange: (itemId: string, delta: number) => void;
  
  /** Callback fired when user deletes an item */
  onDeleteItem: (itemId: string) => void;
  
  /** Callback fired when user toggles an item's checked state */
  onToggleItemChecked: (itemId: string) => void;
  
  /** Current search query string */
  searchQuery?: string;
  
  /** Callback fired when search query changes */
  onSearchChange?: (text: string) => void;
  
  /** Search mode: 'local' for client-side filtering, 'remote' for server-side search */
  searchMode?: 'local' | 'remote';
  
  /** Whether to hide the panel header (for embedded views) */
  hideHeader?: boolean;
}

export type { ShoppingItem, ShoppingList, GroceryItem };
