import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../../../theme';

export const styles = StyleSheet.create({
  choreNameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  choreIcon: {
    fontSize: 32,
  },
  choreNameInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateTimeSection: {
    marginBottom: spacing.md,
  },
  assigneeSection: {
    marginBottom: spacing.md,
  },
  assigneeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  assigneeScroll: {
    maxHeight: 40,
  },
  assigneeScrollContent: {
    gap: spacing.sm,
  },
  assigneeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.divider,
  },
  assigneeChipSelected: {
    backgroundColor: colors.chores,
    borderColor: colors.chores,
  },
  assigneeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  assigneeChipTextSelected: {
    color: colors.textLight,
  },
});
