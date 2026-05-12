import { StyleSheet } from 'react-native';
import { borderRadius, colors, spacing } from '../../../../theme';

export const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.32)',
    justifyContent: 'flex-end',
  },
  safeAreaSheet: {
    width: '100%',
  },
  sheet: {
    maxHeight: '88%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerRtl: {
    flexDirection: 'row-reverse',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchRowRtl: {
    flexDirection: 'row-reverse',
  },
  searchInput: {
    flex: 1,
    minHeight: 46,
    fontSize: 15,
    color: colors.textPrimary,
  },
  textRtl: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  helperText: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  gridContent: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  resultRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  resultTile: {
    width: '48%',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.border,
  },
  resultMeta: {
    padding: spacing.sm,
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sourceText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  centerState: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  stateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  stateText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
