import type { ShoppingItem, ShoppingList } from '../../../../mocks/shopping';
import type { GroceryItem } from '../GrocerySearchBar';

/** Props for the ShoppingItemCard sub-component (single list item with swipe and quantity) */
export interface ShoppingItemCardProps {
  item: ShoppingItem;
  index: number;
  bgColor: string;
  onDeleteItem: (id: string) => void;
  onQuantityChange: (id: string, delta: number) => void;
  onToggleItemChecked: (id: string) => void;
}

export interface ShoppingListPanelProps {
  shoppingLists: ShoppingList[];
  selectedList: ShoppingList;
  filteredItems: ShoppingItem[];
  groceryItems: GroceryItem[];
  onSelectList: (list: ShoppingList) => void;
  onCreateList: () => void;
  onSelectGroceryItem: (item: GroceryItem) => void;
  onQuickAddItem: (item: GroceryItem) => void;
  onQuantityChange: (itemId: string, delta: number) => void;
  onDeleteItem: (itemId: string) => void;
  onToggleItemChecked: (itemId: string) => void;
  // Search props
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  searchMode?: 'local' | 'remote';
  // Loading state
  isLoading?: boolean;
}

export type { ShoppingItem, ShoppingList, GroceryItem };
