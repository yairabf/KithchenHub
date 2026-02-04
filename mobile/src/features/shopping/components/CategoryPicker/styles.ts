import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../../../theme';

export const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
    minHeight: 40,
  },
  categoryChipSelected: {
    backgroundColor: colors.shopping + '15',
    borderColor: colors.shopping,
    borderWidth: 2,
  },
  categoryIcon: {
    width: 24,
    height: 24,
  },
  categoryIconPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.quantityBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  categoryTextSelected: {
    color: colors.shopping,
    fontWeight: '600',
  },
});
