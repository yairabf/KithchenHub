import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { colors } from '../../../theme';
import type { SkeletonLoaderProps } from './types';

export function SkeletonLoader({
  width,
  height,
  borderRadius = 8,
  style,
}: SkeletonLoaderProps) {
  const shimmerTranslate = useSharedValue(0);

  useEffect(() => {
    shimmerTranslate.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerTranslate.value,
      [0, 1],
      [-width, width]
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            width: '100%',
            height: '100%',
            backgroundColor: colors.transparent.white80,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}
