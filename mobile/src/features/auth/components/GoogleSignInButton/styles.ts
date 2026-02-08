import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../../../theme';
import { boxShadow } from '../../../../theme/shadows';

export const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...boxShadow(2, 4, 'rgba(0, 0, 0, 0.1)'),
  },
  iconContainer: {
    marginRight: spacing.md,
  },
  text: {
    ...typography.button,
    color: colors.textPrimary,
  },
});
