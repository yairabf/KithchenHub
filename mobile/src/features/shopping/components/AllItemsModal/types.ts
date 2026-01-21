export interface GroceryItem {
  id: string;
  name: string;
  image: string;
  category: string;
  defaultQuantity: number;
}

export interface AllItemsModalProps {
  visible: boolean;
  items: GroceryItem[];
  onClose: () => void;
  onSelectItem: (item: GroceryItem) => void;
  onQuickAddItem?: (item: GroceryItem) => void;
}
