import { StyleSheet } from 'react-native';
import { colors, spacing, shadows } from '../../../../theme';

export const styles = StyleSheet.create({
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: 40,
    padding: spacing.xl + spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    ...shadows.lg,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  progressRowPhone: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.md,
    maxHeight: 280,
  },
  progressRingWrap: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  progressRingText: {
    position: 'absolute',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginTop: 2,
  },
  progressDetails: {
    flex: 1,
  },
  progressDetailsPhone: {
    alignItems: 'center',
    maxWidth: '100%',
    paddingHorizontal: spacing.sm,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  progressBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  progressBodyPhone: {
    textAlign: 'center',
    marginBottom: 0,
  },
});
