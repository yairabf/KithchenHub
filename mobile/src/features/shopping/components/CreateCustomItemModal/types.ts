import type { GroceryItem } from '../GrocerySearchBar';

export interface CreateCustomItemModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  listName: string;
  confirmColor: string;
  selectedGroceryItem: GroceryItem | null;
  selectedItemCategory: string;
  onSelectCategory: (category: string) => void;
  availableCategories: string[];
  quantityInput: string;
  onChangeQuantity: (value: string) => void;
  onDecreaseQuantity: () => void;
  onIncreaseQuantity: () => void;
}
