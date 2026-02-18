import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../../../theme';

export const styles = StyleSheet.create({
  addFormContainer: {
    marginBottom: spacing.md,
    position: 'relative',
    zIndex: 1000,
  },
  addForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingEnd: spacing.xl,
    fontSize: 16,
    color: colors.textPrimary,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 14,
    padding: spacing.xs,
  },
  dueDateSection: {
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
  assigneeChipManage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconSelectionSection: {
    marginBottom: spacing.md,
  },
  iconList: {
    paddingVertical: 4,
    gap: 12,
  },
  iconOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconOptionSelected: {
    backgroundColor: colors.surface,
    borderColor: colors.chores,
    borderWidth: 2,
  },
  iconOptionText: {
    fontSize: 24,
  },
  recurrenceSection: {
    marginBottom: spacing.md,
  },
  recurrenceOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  recurrenceOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurrenceOptionSelected: {
    backgroundColor: colors.chores,
    borderColor: colors.chores,
  },
  recurrenceOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  recurrenceOptionTextSelected: {
    color: colors.textLight,
  },
});
