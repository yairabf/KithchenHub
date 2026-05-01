import { StyleSheet } from 'react-native';
import {
  borderRadius,
  colors,
  shadows,
  spacing,
  typography,
} from '../../../../theme';

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  titleBlock: {
    flex: 1,
  },
  titleBlockRtl: {
    alignItems: 'stretch',
    width: '100%',
  },
  title: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  titleRtl: {
    writingDirection: 'rtl',
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  subtitleRtl: {
    writingDirection: 'rtl',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderRadius: borderRadius.xxl,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderDashed,
    backgroundColor: colors.pastel.cyan,
    gap: spacing.sm,
  },
  emptyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pastel.cyan,
  },
  emptyTitle: {
    ...typography.labelBold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyTitleRtl: {
    writingDirection: 'rtl',
  },
  emptySubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptySubtitleRtl: {
    writingDirection: 'rtl',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  itemTile: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.md,
  },
  itemTileTablet: {
    width: '18.5%',
  },
  itemTilePhone: {
    width: '30.5%',
  },
  itemPressable: {
    flex: 1,
  },
  itemImageContainer: {
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.pastel.cyan,
  },
  itemImageBadge: {
    width: 54,
    height: 54,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  itemImage: {
    width: 34,
    height: 34,
  },
  itemFeedbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
  },
  itemFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
    minHeight: 42,
  },
  itemName: {
    ...typography.labelBold,
    color: colors.textPrimary,
    textAlign: 'center',
    minHeight: 34,
  },
  itemNameRtl: {
    writingDirection: 'rtl',
  },
});
