import React, { useMemo } from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius } from '../../../theme';
import { styles } from './styles';
import { SwipeableWrapperProps } from './types';

const DEFAULT_ACTION_WIDTH = 84;

// Platform-specific gesture configuration
const GESTURE_CONFIG = {
  web: {
    activeOffsetX: [-3, 3] as [number, number],
    failOffsetY: [-20, 20] as [number, number],
    deleteVelocityThreshold: 500,
  },
  native: {
    activeOffsetX: [-5, 5] as [number, number],
    failOffsetY: [-15, 15] as [number, number],
    deleteVelocityThreshold: 1000,
  },
} as const;

/**
 * Generic swipe-to-delete wrapper component
 * Can wrap any content to add swipe-to-delete functionality
 */
export function SwipeableWrapper({
  children,
  onSwipeDelete,
  disabled = false,
  borderRadius: customBorderRadius,
  actionWidth = DEFAULT_ACTION_WIDTH,
}: SwipeableWrapperProps) {
  const translateX = useSharedValue(0);
  const swipeDirection = useSharedValue<number>(0); // 1 for right, -1 for left, 0 for none

  const handleDelete = () => {
    try {
      onSwipeDelete();
    } catch (error) {
      console.error('SwipeableWrapper: Failed to delete item:', error);
    }
  };

  // Select platform-specific configuration
  const config = GESTURE_CONFIG[Platform.OS === 'web' ? 'web' : 'native'];

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .minPointers(1)
    .maxPointers(1)
    .activeOffsetX(config.activeOffsetX)
    .failOffsetY(config.failOffsetY)
    .shouldCancelWhenOutside(false)
    .enableTrackpadTwoFingerGesture(false)
    .onStart(() => {
      'worklet';
      swipeDirection.value = 0;
    })
    .onUpdate((event) => {
      'worklet';
      if (swipeDirection.value === 0 && Math.abs(event.translationX) > 5) {
        swipeDirection.value = event.translationX > 0 ? 1 : -1;
      }

      if (swipeDirection.value !== 0) {
        const isSameDirection =
          (swipeDirection.value > 0 && event.translationX > 0) ||
          (swipeDirection.value < 0 && event.translationX < 0);

        if (isSameDirection) {
          const raw = event.translationX;
          const clamped = Math.max(-actionWidth, Math.min(actionWidth, raw));
          translateX.value = clamped;
        } else if (event.translationX * swipeDirection.value < 0) {
          translateX.value = withSpring(0, {
            damping: 20,
            stiffness: 300,
          });
          swipeDirection.value = 0;
        }
      }
    })
    .onEnd((event) => {
      'worklet';
      const absTranslateX = Math.abs(translateX.value);
      const absVelocityX = Math.abs(event.velocityX);

      const openThreshold = actionWidth * 0.4;
      const shouldOpen = absTranslateX >= openThreshold || absVelocityX > config.deleteVelocityThreshold;

      if (shouldOpen) {
        const direction = translateX.value >= 0 ? 1 : -1;
        translateX.value = withSpring(direction * actionWidth, {
          damping: 20,
          stiffness: 300,
        });
      } else {
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
      }

      swipeDirection.value = 0;
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const leftBackgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, actionWidth],
      [0, 1],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      translateX.value,
      [0, actionWidth],
      [0.5, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const rightBackgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-actionWidth, 0],
      [1, 0],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      translateX.value,
      [-actionWidth, 0],
      [1, 0.5],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const effectiveBorderRadius = customBorderRadius ?? borderRadius.lg;

  // Memoize style objects to prevent recreation on every render/animation frame
  const borderRadiusStyle = useMemo(
    () => ({ borderRadius: effectiveBorderRadius }),
    [effectiveBorderRadius]
  );

  // Width must exactly match actionWidth so the red background never bleeds
  // outside the card bounds when the panel is revealed during a swipe.
  const actionWidthStyle = useMemo(
    () => ({ width: actionWidth }),
    [actionWidth]
  );

  return (
    <View style={styles.container}>
      {/* Left delete background (swipe right) */}
      <Animated.View style={[
        styles.deleteBackground,
        styles.leftBackground,
        actionWidthStyle,
        borderRadiusStyle,
        leftBackgroundStyle
      ]}>
        <TouchableOpacity onPress={handleDelete} accessibilityRole="button" accessibilityLabel="Delete">
          <Ionicons name="trash-outline" size={24} color={colors.textLight} />
        </TouchableOpacity>
      </Animated.View>

      {/* Right delete background (swipe left) */}
      <Animated.View style={[
        styles.deleteBackground,
        styles.rightBackground,
        actionWidthStyle,
        borderRadiusStyle,
        rightBackgroundStyle
      ]}>
        <TouchableOpacity onPress={handleDelete} accessibilityRole="button" accessibilityLabel="Delete">
          <Ionicons name="trash-outline" size={24} color={colors.textLight} />
        </TouchableOpacity>
      </Animated.View>

      {/* Swipeable card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[
          styles.card,
          // Apply border radius to the animated view to match content
          borderRadiusStyle,
          cardAnimatedStyle
        ]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
