import { GroceryItem } from '../GrocerySearchBar';

export interface FrequentlyAddedGridProps {
  items: GroceryItem[];
  onItemPress: (item: GroceryItem) => void;
}
