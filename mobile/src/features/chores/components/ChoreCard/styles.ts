import { StyleSheet } from 'react-native';
import {
  colors,
  spacing,
  borderRadius,
  typography,
} from '../../../../theme';

export const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: borderRadius.xxxl,
    paddingVertical: spacing.sm,
  },
  cardBackgroundDefault: {
    backgroundColor: '#EEF3F7',
  },
  cardBackgroundCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.07)',
  },
  choreCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  choreCardRtl: {
    flexDirection: 'row-reverse',
  },
  choreCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 0,
  },
  choreCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.iconBg.amber,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  choreCardIconText: {
    fontSize: 22,
  },
  choreCardContent: {
    flex: 1,
    minWidth: 0,
  },
  choreCardNameRowLtr: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignSelf: 'stretch',
    direction: 'ltr',
    width: '100%',
  },
  choreCardNameRowRtl: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignSelf: 'stretch',
    direction: 'rtl',
    width: '100%',
  },
  choreCardName: {
    ...typography.body,
    fontWeight: '700',
    marginBottom: spacing.xxs,
    color: colors.textPrimary,
    maxWidth: '100%',
  },
  choreCardNameLtr: {
    writingDirection: 'ltr',
  },
  choreCardNameRtl: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  choreCardTextRtl: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  choreCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    minWidth: 0,
  },
  choreMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
    alignSelf: 'center',
  },
  choreCardMetaRtl: {
    flexDirection: 'row-reverse',
  },
  choreTag: {
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  choreTagPrimary: {
    backgroundColor: colors.pastel.yellow,
  },
  choreTagSecondary: {
    backgroundColor: colors.divider,
  },
  choreTagText: {
    ...typography.tiny,
    color: colors.textSecondary,
    fontSize: 9,
    lineHeight: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  choreCardRight: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    marginStart: spacing.sm,
  },
  choreCardTime: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 11,
  },
  choreCardEditButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  choreCardCheck: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckmark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  choreCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
});
