import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../../../theme';

export const styles = StyleSheet.create({
  contentContainer: {
    maxHeight: 400,
  },
  membersList: {
    maxHeight: 280,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  memberColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginEnd: spacing.sm,
  },
  memberTextColumn: {
    flex: 1,
    gap: 2,
  },
  memberHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  memberName: {
    flexShrink: 1,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  memberEmail: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  memberRole: {
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  badge: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  deleteButton: {
    padding: spacing.sm,
  },
  deleteButtonDisabled: {
    opacity: 0.3,
  },
  footer: {
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  stateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  inviteSection: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  inviteCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    minHeight: 48,
    marginTop: spacing.sm,
  },
  inviteCodeText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  iconButton: {
    padding: spacing.sm,
  },
});
