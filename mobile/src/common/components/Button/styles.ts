import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../../theme';

export const styles = StyleSheet.create({
  // Base button styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    minHeight: 44, // Minimum touch target size
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  buttonText: {
    ...typography.button,
    fontWeight: '600',
  },
  icon: {
    marginRight: spacing.xs,
  },
  spinner: {
    marginRight: spacing.xs,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },

  // Variant styles
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.textLight,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  outlineButtonText: {
    color: colors.primary,
  },
  dangerButton: {
    backgroundColor: colors.error,
  },
  dangerButtonText: {
    color: colors.textLight,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  ghostButtonText: {
    color: colors.textPrimary,
  },

  // Size styles
  smallButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 32,
  },
  smallButtonText: {
    fontSize: 13,
  },
  mediumButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  mediumButtonText: {
    fontSize: 15,
  },
  largeButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  largeButtonText: {
    fontSize: 17,
  },
});
