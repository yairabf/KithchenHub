import { StyleSheet } from 'react-native';
import { colors, shadows, spacing, borderRadius, typography } from '../../../../theme';

/**
 * Opacity value for category overlay background.
 * Provides semi-transparent overlay to show icon/image behind text while maintaining readability.
 */
const CATEGORY_OVERLAY_OPACITY = 0.6;

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
  seeAll: {
    fontSize: 13,
    color: colors.textMuted,
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
    justifyContent: 'flex-end',
  },
  categoryBgImage: {
    borderRadius: 16,
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 10,
    borderRadius: 16,
  },
  categoryOverlayBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: CATEGORY_OVERLAY_OPACITY,
    borderRadius: 16,
  },
  categoryOverlayContent: {
    zIndex: 1,
  },
  categoryCount: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
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
