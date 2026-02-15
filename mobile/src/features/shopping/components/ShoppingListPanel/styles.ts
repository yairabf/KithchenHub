import { StyleSheet } from 'react-native';
import { colors, shadows, spacing } from '../../../../theme';

/** Minimum height for shopping list item cards so every card has uniform dimensions */
const SHOPPING_ITEM_CARD_MIN_HEIGHT = 82;

/** 12px - used for list header margin, drawer gap, list card padding/gap, search bar margin */
const SPACING_12 = spacing.sm + spacing.xs;

/**
 * Spacing constants for list drawer shadow clearance and scroll padding.
 * These values ensure shadows are not clipped by overflow containers.
 */
const DRAWER_SHADOW_CLEARANCE = 28; // Vertical space for shadows.lg (offsetY 10 + blurRadius 40, rounded up)
const HORIZONTAL_SCROLL_PADDING = 20; // Horizontal padding to prevent shadow clipping on left/right edges

export const styles = StyleSheet.create({
  leftColumn: {
    flex: 1,
  },
  panelContainer: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACING_12,
  },
  sectionIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
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
    marginBottom: DRAWER_SHADOW_CLEARANCE,
    overflow: 'visible' as const,
  },
  listsDrawerContent: {
    gap: SPACING_12,
    paddingTop: spacing.xs,
    paddingBottom: DRAWER_SHADOW_CLEARANCE,
    paddingLeft: HORIZONTAL_SCROLL_PADDING,
    paddingRight: HORIZONTAL_SCROLL_PADDING,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: SPACING_12,
    gap: SPACING_12,
    minWidth: 180,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
  },
  listCardActive: {
    borderColor: colors.primary + '40',
    backgroundColor: colors.primaryLight,
  },
  listCardDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
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
    fontSize: 15,
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
    color: colors.primary,
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
    opacity: 0.7,
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
    borderColor: colors.borderDashed,
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
