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
    alignItems: 'center',
  },
  choreCardIcon: {
    marginRight: spacing.sm,
    position: 'relative',
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
    marginRight: spacing.sm,
    ...shadows.sm,
  },
  choreCardContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  choreCardName: {
    ...typography.labelBold,
    marginBottom: spacing.xxs,
  },
  choreCardTime: {
    ...typography.tinyMuted,
  },
  choreCardCheck: {
    width: componentSize.checkbox + spacing.xxs,
    height: componentSize.checkbox + spacing.xxs,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginRight: spacing.sm,
    maxWidth: 80,
    minWidth: 60,
    borderWidth: 1,
    borderColor: colors.border,
    flexShrink: 0,
  },
  choreCardAssigneeText: {
    ...typography.tiny,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
