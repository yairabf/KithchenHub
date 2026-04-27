import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '../../../theme';

export const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: colors.backdrop,
  },
  keyboardView: {
    flex: 1,
  },
  fullScreenShell: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  sheetShell: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetPanel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '92%',
    minHeight: '72%',
    overflow: 'hidden',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.border,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
    gap: spacing.md,
  },
  headerSide: {
    minWidth: 72,
  },
  headerSideEnd: {
    alignItems: 'flex-end',
  },
  closeButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    alignSelf: 'flex-start',
  },
  closeButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  submitButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  footerButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  cancelFooterButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelFooterText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  submitFooterButton: {
    backgroundColor: colors.primary,
  },
  submitFooterButtonDisabled: {
    opacity: 0.45,
  },
  submitFooterText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
});
