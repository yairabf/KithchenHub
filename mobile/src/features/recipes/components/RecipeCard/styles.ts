import { StyleSheet } from 'react-native';
import { colors, spacing, shadows } from '../../../../theme';

export const styles = StyleSheet.create({
  recipeCard: {
    borderRadius: 16,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.deep,
  },
  recipeImageContainer: {
    height: 100,
    backgroundColor: colors.transparent.white50,
    position: 'relative',
  },
  recipeImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncStatusContainer: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.transparent.white80,
    borderRadius: 12,
    padding: spacing.xs,
  },
  recipeInfo: {
    padding: spacing.sm,
  },
  recipeName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  recipeMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
});
