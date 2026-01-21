import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Animated as RNAnimated, Easing as RNEasing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../../../theme';
import { styles } from './styles';
import { ProgressRingProps } from './types';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ProgressRing({
  progress,
  size = 140,
  strokeWidth = 12,
  progressColor: _progressColor = colors.success,
  backgroundColor = '#F0F0F0',
  showPercentage = true,
  showEmoji = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Helper to calculate color based on progress
  const getColorForProgress = (prog: number): string => {
    if (prog <= 25) {
      return '#9CA3AF'; // Gray
    } else if (prog <= 75) {
      // Interpolate between gray and yellow
      const factor = (prog - 25) / 50;
      return interpolateColorManual('#9CA3AF', '#F59E0B', factor);
    } else {
      // Interpolate between yellow and green
      const factor = (prog - 75) / 25;
      return interpolateColorManual('#F59E0B', '#10B981', factor);
    }
  };

  const interpolateColorManual = (color1: string, color2: string, factor: number): string => {
    const c1 = parseInt(color1.slice(1), 16);
    const c2 = parseInt(color2.slice(1), 16);

    const r1 = (c1 >> 16) & 0xff;
    const g1 = (c1 >> 8) & 0xff;
    const b1 = c1 & 0xff;

    const r2 = (c2 >> 16) & 0xff;
    const g2 = (c2 >> 8) & 0xff;
    const b2 = c2 & 0xff;

    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);

    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  // Animated progress value for the arc
  const animatedProgress = useSharedValue(0);

  // State for current color (will transition via interpolation)
  const [currentColor, setCurrentColor] = useState(getColorForProgress(progress));
  const colorAnimValue = useRef(new RNAnimated.Value(0)).current;
  const prevProgress = useRef(progress);

  // #region agent log
  console.log('[ProgressRing] Render', { progress, currentColor });
  // #endregion

  useEffect(() => {
    // #region agent log
    console.log('[ProgressRing] useEffect - animating to:', progress);
    // #endregion

    // Animate the arc
    animatedProgress.value = withTiming(progress, {
      duration: 1000,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });

    // Animate color transition
    const startColor = getColorForProgress(prevProgress.current);
    const endColor = getColorForProgress(progress);

    colorAnimValue.setValue(0);
    RNAnimated.timing(colorAnimValue, {
      toValue: 1,
      duration: 1000,
      easing: RNEasing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();

    // Interpolate colors during animation
    const listener = colorAnimValue.addListener(({ value }) => {
      const interpolated = interpolateColorManual(startColor, endColor, value);
      setCurrentColor(interpolated);
    });

    prevProgress.current = progress;

    return () => {
      colorAnimValue.removeListener(listener);
    };
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    'worklet';
    const progressOffset = circumference - (animatedProgress.value / 100) * circumference;

    return {
      strokeDashoffset: progressOffset,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Animated progress circle with smooth color transition */}
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={currentColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeLinecap="round"
          rotation="-90"
          origin={`${center}, ${center}`}
          animatedProps={animatedProps}
        />
      </Svg>

      {/* Center content */}
      <View style={styles.centerContent}>
        {showPercentage && (
          <Text style={styles.percentage}>{Math.round(progress)}%</Text>
        )}
        {showEmoji && progress >= 75 && (
          <Text style={styles.emoji}>👍</Text>
        )}
      </View>
    </View>
  );
}
