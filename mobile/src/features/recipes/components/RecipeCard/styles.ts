import { StyleSheet } from 'react-native';
import { colors, spacing, shadows } from '../../../../theme';

export const styles = StyleSheet.create({
  recipeCard: {
    borderRadius: 28,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...shadows.md,
  },
  recipeImageContainer: {
    height: 190,
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
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.success,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  timeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md + spacing.xs,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  recipeNameRtl: {
    textAlign: 'right',
  },
  recipeDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  recipeDescriptionRtl: {
    textAlign: 'right',
  },
  rtlTextRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignSelf: 'stretch',
    width: '100%',
  },
});
