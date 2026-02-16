import { StyleSheet } from 'react-native';
import {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  componentSize,
} from '../../../../theme';

export const styles = StyleSheet.create({
  choreCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  choreCardLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  choreCardIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  choreCardIcon: {
    marginRight: spacing.sm,
  },
  choreCardIconText: {
    fontSize: 26,
  },
  choreCardEditButton: {
    width: componentSize.button.sm,
    height: componentSize.button.sm,
    borderRadius: componentSize.button.sm / 2,
    backgroundColor: colors.transparent.white70,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  choreCardContent: {
    flex: 1,
  },
  choreCardName: {
    ...typography.labelBold,
    marginBottom: spacing.xs,
  },
  choreCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  choreCardTime: {
    ...typography.tinyMuted,
    flexShrink: 1,
  },
  choreCardCheck: {
    width: componentSize.checkbox + spacing.xxs,
    height: componentSize.checkbox + spacing.xxs,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxs,
  },
  checkmark: {
    width: componentSize.checkbox,
    height: componentSize.checkbox,
    borderRadius: componentSize.checkbox / 2,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  uncheckmark: {
    width: componentSize.checkbox,
    height: componentSize.checkbox,
    borderRadius: componentSize.checkbox / 2,
    backgroundColor: colors.transparent.white50,
    borderWidth: 2,
    borderColor: colors.transparent.white80,
  },
  choreCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  choreCardAssignee: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
    // Removed maxWidth/minWidth constraints to allow natural sizing based on content
    // Text will wrap to next line if needed via choreCardMeta flexWrap
  },
  choreCardAssigneeText: {
    ...typography.tiny,
    color: colors.textPrimary,
    fontWeight: '600',
    // Removed textAlign: 'center' as assignee badge now aligns left with meta row
    // This provides better visual consistency with the date/time text
  },
});
