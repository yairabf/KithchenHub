import { StyleSheet } from 'react-native';
import { spacing, typography, colors } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leftIconButton: {
    padding: spacing.xs,
    marginEnd: spacing.md,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  titleIcon: {
    marginEnd: spacing.xs,
  },
  title: {
    ...typography.h3,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginStart: spacing.md,
  },
});
