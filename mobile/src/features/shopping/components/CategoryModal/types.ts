export interface GroceryItem {
  id: string;
  name: string;
  image: string;
  category: string;
  defaultQuantity: number;
}

export interface CategoryModalProps {
  visible: boolean;
  categoryName: string;
  items: GroceryItem[];
  isLoading?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSelectItem: (item: GroceryItem) => void;
}
