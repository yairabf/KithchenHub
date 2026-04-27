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
    width: '23%',
  },
  itemTilePhone: {
    width: '48%',
  },
  itemImageContainer: {
    aspectRatio: 1,
    backgroundColor: colors.pastel.cyan,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 54,
  },
  itemFooterRtl: {
    flexDirection: 'row-reverse',
  },
  itemName: {
    ...typography.labelBold,
    color: colors.textPrimary,
    flex: 1,
  },
  itemNameRtl: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
