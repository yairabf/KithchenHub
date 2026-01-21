import { StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing, borderRadius, zIndex } from '../../../theme/spacing';
import { shadows } from '../../../theme/shadows';

export const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
    zIndex: zIndex.tooltip,
    pointerEvents: 'none',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
    ...shadows.xl,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerError: {
    backgroundColor: colors.error,
  },
  iconContainerInfo: {
    backgroundColor: colors.primaryLight,
  },
  message: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
