import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../../../theme';

export const styles = StyleSheet.create({
  listSwitcher: {
    maxHeight: 50,
    marginBottom: spacing.md,
  },
  listSwitcherContent: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  listBubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    marginEnd: spacing.sm,
  },
  listBubbleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
