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
  iconContainer: {
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconSelectionSection: {
    marginTop: 16,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
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
  iconOptionTextSelected: {
    // Add if needed
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
    paddingVertical: spacing.md,
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
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  recurrenceOptionTextSelected: {
    color: colors.textLight,
  },
});
