import { StyleSheet } from 'react-native';
import { colors } from '../../../../theme/colors';
import { spacing, borderRadius } from '../../../../theme/spacing';
import { shadows } from '../../../../theme/shadows';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.xxl,
    borderWidth: 2,
    borderColor: 'transparent',
    flexDirection: 'row',
    gap: spacing.lg,
    ...shadows.sm,
  },
  cardActive: {
    borderColor: colors.textPrimary,
  },
  cardCompleted: {
    opacity: 0.6,
    backgroundColor: colors.background,
  },
  stepNumberContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberContainerActive: {
    backgroundColor: colors.background,
  },
  stepNumberContainerCompleted: {
    backgroundColor: colors.border,
  },
  stepNumber: {
    fontSize: 18,
    fontWeight: '900',
  },
  stepNumberActive: {
    color: colors.textPrimary,
  },
  stepNumberCompleted: {
    color: colors.textMuted,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    color: colors.textPrimary,
  },
  stepTextCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  markAsFinished: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.recipes,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing.sm,
  },
  checkContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  checkboxCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
