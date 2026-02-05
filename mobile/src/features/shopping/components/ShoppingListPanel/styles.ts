import { StyleSheet } from 'react-native';
import { colors, shadows, spacing } from '../../../../theme';

/** Minimum height for shopping list item cards so every card has uniform dimensions */
const SHOPPING_ITEM_CARD_MIN_HEIGHT = 82;

/** 12px - used for list header margin, drawer gap, list card padding/gap, search bar margin */
const SPACING_12 = spacing.sm + spacing.xs;

export const styles = StyleSheet.create({
  leftColumn: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING_12,
  },
  listLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  listHeaderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listsDrawer: {
    marginBottom: 16,
  },
  listsDrawerContent: {
    gap: SPACING_12,
    paddingVertical: spacing.xs,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: SPACING_12,
    padding: SPACING_12,
    gap: SPACING_12,
    minWidth: 180,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.lg,
  },
  listCardActive: {
    borderColor: colors.chores,
    backgroundColor: '#FAFAFA',
  },
  listIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listCardContent: {
    flex: 1,
  },
  listCardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  mainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.recipes + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  mainBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.recipes,
  },
  listCardNameActive: {
    color: colors.chores,
  },
  listCardCount: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  listCardIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    position: 'absolute',
    right: 0,
  },
  addListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: SPACING_12,
    padding: SPACING_12,
    gap: spacing.sm,
    minWidth: 140,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addListText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  searchBarContainer: {
    marginBottom: SPACING_12,
  },
  itemsList: {
    gap: spacing.md, // 16px spacing between items for better visual separation
  },
  /** Ensures every shopping item card has the same width and height for a uniform list */
  shoppingItemCard: {
    width: '100%',
    minHeight: SHOPPING_ITEM_CARD_MIN_HEIGHT,
  },
  checkedCard: {
    opacity: 0.65,
  },
  checkedTitle: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
});
