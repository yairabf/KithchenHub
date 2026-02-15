import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../../../theme';
import { boxShadow } from '../../../../theme/shadows';

/** Font size for legal modal action buttons; matches typography.body. */
const LEGAL_BUTTON_FONT_SIZE = 16;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.backdrop,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    width: '85%',
    maxWidth: 400,
    ...boxShadow(4, 12, 'rgba(0, 0, 0, 0.15)'),
  },
  message: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  buttonRow: {
    gap: spacing.sm,
  },
  linkButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  linkButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
    fontSize: LEGAL_BUTTON_FONT_SIZE,
  },
  acceptButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    backgroundColor: colors.primary,
    marginTop: spacing.xs,
  },
  acceptButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textLight,
    fontSize: LEGAL_BUTTON_FONT_SIZE,
  },
});
