import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../../theme';

export const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.sm,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  optionButton: {
    width: 100,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
  },
  optionIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  previewSection: {
    marginTop: spacing.sm,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    maxHeight: 120,
  },
  previewText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  feedbackText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
    marginTop: spacing.md,
  },
});
