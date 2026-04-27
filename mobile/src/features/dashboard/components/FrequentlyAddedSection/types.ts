import type { GroceryItem } from '../../../shopping/components/GrocerySearchBar';

export interface FrequentlyAddedSectionProps {
  isTablet: boolean;
  isRtl: boolean;
  items: GroceryItem[];
  onItemPress: (item: GroceryItem) => void;
}
