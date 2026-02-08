import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../../../theme';

export const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
  },
  filterChipSelected: {
    backgroundColor: colors.recipes,
    borderColor: colors.recipes,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterChipTextSelected: {
    color: colors.textLight,
  },
  unitList: {
    maxHeight: 280,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  unitRowSelected: {
    backgroundColor: colors.recipes + '20',
  },
  unitRowText: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  unitRowTextSelected: {
    fontWeight: '600',
    color: colors.recipes,
  },
  noneRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.xs,
    paddingTop: spacing.sm,
  },
});
