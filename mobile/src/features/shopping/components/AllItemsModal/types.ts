export type { GroceryItem } from '../../types/groceryItem';
import type { GroceryItem } from '../../types/groceryItem';

export interface AllItemsModalProps {
  visible: boolean;
  items: GroceryItem[];
  onClose: () => void;
  onSelectItem: (item: GroceryItem) => void;
  onQuickAddItem?: (item: GroceryItem) => void;
}
