import { ViewStyle } from 'react-native';

export type { GroceryItem } from '../../types/groceryItem';
import type { GroceryItem } from '../../types/groceryItem';

export interface GrocerySearchBarProps {
  // Required Props
  items: GroceryItem[];
  onSelectItem: (item: GroceryItem) => void;
  onQuickAddItem: (item: GroceryItem) => void;

  // Optional UI Customization
  placeholder?: string;
  isRtl?: boolean;
  variant?: 'surface' | 'background';  // white vs cream background
  showShadow?: boolean;
  maxResults?: number;                 // default: 8
  allowCustomItems?: boolean;          // default: false - allow adding items not in database
  searchMode?: 'local' | 'remote';     // default: 'local' - 'remote' disables client-side filtering

  // Optional Controlled State (for advanced use cases)
  value?: string;
  onChangeText?: (text: string) => void;

  // Optional Styling Overrides
  containerStyle?: ViewStyle;
  dropdownStyle?: ViewStyle;
}
