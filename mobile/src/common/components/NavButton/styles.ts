import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../../theme';
import { boxShadow } from '../../../theme/shadows';

export const styles = StyleSheet.create({
  // Default (tablet/desktop) styles
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 32,
    minWidth: 80,
  },
  // Phone-specific overrides
  buttonPhone: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 26,
    minWidth: 56,
  },
  buttonActive: {
    ...boxShadow(4, 8, 'rgba(96, 108, 56, 0.3)'),
  },
  icon: {
    marginBottom: 2,
  },
  label: {
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
});
