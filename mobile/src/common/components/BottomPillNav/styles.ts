import { StyleSheet } from 'react-native';
import { spacing } from '../../../theme';
import { boxShadow } from '../../../theme/shadows';

export const styles = StyleSheet.create({
  // Default (tablet/desktop) styles
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  // Phone-specific container
  containerPhone: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.lg,
  },
  // Default (tablet/desktop) pill
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 40,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    ...boxShadow(8, 24, 'rgba(0, 0, 0, 0.15)'),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    gap: spacing.sm,
  },
  // Phone-specific pill
  pillPhone: {
    borderRadius: 32,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    justifyContent: 'space-evenly',
    gap: spacing.xs,
  },
});
