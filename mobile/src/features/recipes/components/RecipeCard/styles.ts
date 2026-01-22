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
  },
  recipeImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
