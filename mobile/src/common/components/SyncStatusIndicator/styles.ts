/**
 * Sync Status Indicator Component Styles
 */

import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '../../../theme';
import type { IndicatorSize } from './types';

const sizeConfig: Record<IndicatorSize, { icon: number; container: number; fontSize: number }> = {
  small: {
    icon: 12,
    container: 16,
    fontSize: 10,
  },
  medium: {
    icon: 16,
    container: 20,
    fontSize: 12,
  },
};

export const createStyles = (size: IndicatorSize) => {
  const config = sizeConfig[size];

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    iconContainer: {
      width: config.container,
      height: config.container,
      borderRadius: borderRadius.full,
      backgroundColor: colors.transparent.black10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontSize: config.fontSize,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    pendingIcon: {
      color: colors.textMuted,
    },
    confirmedIcon: {
      color: colors.success,
    },
    failedIcon: {
      color: colors.error,
    },
    pendingLabel: {
      color: colors.textMuted,
    },
    failedLabel: {
      color: colors.error,
    },
  });
};
