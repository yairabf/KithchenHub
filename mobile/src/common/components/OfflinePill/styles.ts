/**
 * Offline Pill Component Styles
 */

import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows, zIndex } from '../../../theme';
import type { OfflinePillPosition } from './types';

/**
 * Height of bottom navigation bar in pixels.
 * Used to position the pill above the navigation.
 */
const BOTTOM_NAVIGATION_HEIGHT = 80;

export const createStyles = (position: OfflinePillPosition) => {
  const positionStyles: Record<OfflinePillPosition, { top?: number; bottom?: number; left?: number; right?: number }> = {
    'top-right': { top: spacing.md, right: spacing.md },
    'bottom-right': { bottom: spacing.md + BOTTOM_NAVIGATION_HEIGHT },
    'top-left': { top: spacing.md, left: spacing.md },
    'bottom-left': { bottom: spacing.md + BOTTOM_NAVIGATION_HEIGHT, left: spacing.md },
  };

  return StyleSheet.create({
    container: {
      position: 'absolute',
      ...positionStyles[position],
      backgroundColor: colors.transparent.white80,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.pill,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      ...shadows.md,
      zIndex: zIndex.overlay,
      minWidth: 80,
    },
    iconContainer: {
      width: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: '600',
    },
    dismissButton: {
      marginStart: spacing.xs,
      padding: spacing.xs,
    },
  });
};
