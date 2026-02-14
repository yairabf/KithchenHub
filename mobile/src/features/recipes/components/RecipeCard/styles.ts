import { StyleSheet } from 'react-native';
import { colors, spacing, shadows } from '../../../../theme';

export const styles = StyleSheet.create({
  recipeCard: {
    borderRadius: 24,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...shadows.lg,
  },
  recipeImageContainer: {
    height: 140,
    backgroundColor: colors.iconBg.teal,
    position: 'relative',
  },
  recipeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(20, 184, 166, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textLight,
    textTransform: 'uppercase',
  },
  recipeImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncStatusContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
  },
  recipeInfo: {
    padding: 16,
  },
  recipeNameTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: 4,
  },
  recipeName: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  recipeDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  recipeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  recipeMetaText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
