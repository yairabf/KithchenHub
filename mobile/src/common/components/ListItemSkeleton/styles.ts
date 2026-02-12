import { StyleSheet } from 'react-native';
import { spacing, borderRadius, colors } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
});
