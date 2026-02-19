import type { GroceryItem } from '../../../shopping/components/GrocerySearchBar';

export type { GroceryItem };

export interface QuickAddCardProps {
  isTablet: boolean;
  isRtl: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchResults: GroceryItem[];
  onSelectItem: (item: GroceryItem) => void;
  onQuickAddItem: (item: GroceryItem) => void;
  showSuggestedItems: boolean;
  onToggleSuggestedItems: () => void;
  suggestedItems: GroceryItem[];
  onSuggestionPress: (item: GroceryItem) => void;
}
