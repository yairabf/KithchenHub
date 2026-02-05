import { StyleSheet } from 'react-native';
import { colors, withOpacity } from '../../../../theme/colors';
import { spacing, borderRadius } from '../../../../theme/spacing';

export const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  ingredientsSection: {
    gap: spacing.md,
  },
  ingredientsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.xs,
  },
  ingredientsList: {
    gap: spacing.md,
    paddingHorizontal: spacing.sm, // Prevents shadow clipping (8px breathing room)
    paddingVertical: spacing.xs,   // Prevents shadow clipping top/bottom
  },
  ingredientCardWrapper: {
    width: '100%',
  },
  addAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: withOpacity(colors.recipes, 0.1),
    borderRadius: borderRadius.full,
  },
  addAllButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.recipes,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
