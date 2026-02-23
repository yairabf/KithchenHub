import { StyleSheet } from 'react-native';
import { colors, shadows, spacing, borderRadius, typography } from '../../../../theme';

/**
 * Category icon dimensions and positioning constants.
 * These values control the size and placement of category icons/images in the tile layout.
 */
const CATEGORY_ICON_SIZE = 80; // Width and height for category icons in pixels
const ICON_CORNER_OFFSET = 8;  // Distance from top-right corner for icon positioning

/**
 * Reserved height for the category name at the bottom of the tile.
 * Image is constrained to stay above this zone so it never overlaps the name.
 */
export const NAME_ZONE_MIN_HEIGHT = 35;

export const styles = StyleSheet.create({
  categoriesSection: {
    flex: 1,
    paddingVertical: 11,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryTile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.md,
  },
  categoryBg: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  categoryNameContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    minHeight: NAME_ZONE_MIN_HEIGHT,
    paddingHorizontal: 10,
    paddingVertical: 8,
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.2,
    /** Single line only; overflow hidden via numberOfLines + ellipsizeMode in component */
  },
  categoryIcon: {
    position: 'absolute',
    top: ICON_CORNER_OFFSET,
    right: ICON_CORNER_OFFSET,
    width: CATEGORY_ICON_SIZE,
    height: CATEGORY_ICON_SIZE,
    opacity: 0.9,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignSelf: 'center',
    backgroundColor: colors.background,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  showMoreText: {
    ...typography.labelBold,
    color: colors.textSecondary,
  },
});
