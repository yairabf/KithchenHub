import React, { useMemo } from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../../theme';
import { styles, DEFAULT_FAB_SIZE } from './styles';
import { FloatingActionButtonProps } from './types';

// Default offsets using theme spacing for consistency
const DEFAULT_TOP_OFFSET = spacing.xl + spacing.lg; // 56px - accounts for SafeArea
const DEFAULT_RIGHT_OFFSET = spacing.md; // 16px - standard edge margin
const DEFAULT_BOTTOM_OFFSET = 100; // Above bottom nav

export function FloatingActionButton({
  onPress,
  iconName = 'add',
  iconColor = colors.textLight,
  backgroundColor = colors.primary,
  position = 'inline',
  topOffset = DEFAULT_TOP_OFFSET,
  rightOffset = DEFAULT_RIGHT_OFFSET,
  bottomOffset = DEFAULT_BOTTOM_OFFSET,
  size = DEFAULT_FAB_SIZE,
  accessibilityLabel = 'Add new item',
}: FloatingActionButtonProps) {
  const isInline = position === 'inline';

  const positionStyle = useMemo((): ViewStyle => {
    switch (position) {
      case 'inline':
        return {};
      case 'absolute-right':
        return {
          top: topOffset,
          right: rightOffset,
        };
      case 'bottom-center':
      default:
        return {
          bottom: bottomOffset,
          left: '50%',
          transform: [{ translateX: -size / 2 }],
        };
    }
  }, [position, topOffset, rightOffset, bottomOffset, size]);

  const containerStyle = useMemo((): ViewStyle => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor,
    position: isInline ? undefined : 'absolute',
  }), [size, backgroundColor, isInline]);

  return (
    <TouchableOpacity
      style={[styles.container, containerStyle, positionStyle]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !onPress }}
    >
      <Ionicons name={iconName} size={24} color={iconColor} />
    </TouchableOpacity>
  );
}
