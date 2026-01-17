import type { ShoppingItem, ShoppingList } from '../../../../mocks/shopping';
import type { GroceryItem } from '../GrocerySearchBar';

export interface ShoppingListPanelProps {
  shoppingLists: ShoppingList[];
  selectedList: ShoppingList;
  filteredItems: ShoppingItem[];
  onSelectList: (list: ShoppingList) => void;
  onCreateList: () => void;
  onSelectGroceryItem: (item: GroceryItem) => void;
  onQuickAddItem: (item: GroceryItem) => void;
  onQuantityChange: (itemId: string, delta: number) => void;
  onDeleteItem: (itemId: string) => void;
}

export type { ShoppingItem, ShoppingList, GroceryItem };
