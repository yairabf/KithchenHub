import { colors } from '../../theme';

export interface QuickActionShoppingList {
  id: string;
  name: string;
  color: string;
}

export const mockQuickActionLists: QuickActionShoppingList[] = [
  { id: '1', name: 'Weekly Groceries', color: colors.primary },
  { id: '2', name: 'Party Supplies', color: colors.shopping },
  { id: '3', name: 'Costco Run', color: colors.recipes },
];
