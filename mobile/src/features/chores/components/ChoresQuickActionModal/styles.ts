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
    paddingRight: spacing.xl,
    fontSize: 16,
    color: colors.textPrimary,
  },
  clearButton: {
    position: 'absolute',
    right: 60,
    top: 14,
    padding: spacing.xs,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
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
  choreAssigneeScroll: {
    marginTop: spacing.xs,
    maxHeight: 30,
  },
  choreAssigneeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
    marginRight: spacing.xs,
  },
  choreAssigneeChipSelected: {
    backgroundColor: colors.chores,
    borderColor: colors.chores,
  },
  choreAssigneeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  choreAssigneeChipTextSelected: {
    color: colors.textLight,
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
    backgroundColor: colors.surface, // Fallback if choresLight is missing
    borderColor: colors.chores,
    borderWidth: 2,
  },
  iconOptionText: {
    fontSize: 24,
  },
});
