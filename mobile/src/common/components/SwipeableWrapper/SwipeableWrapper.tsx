import React, { useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius } from '../../../theme';
import { styles, DELETE_THRESHOLD } from './styles';
import { SwipeableWrapperProps } from './types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DELETE_VELOCITY_THRESHOLD = 1000; // Increased for more deliberate swipes

/**
 * Generic swipe-to-delete wrapper component
 * Can wrap any content to add swipe-to-delete functionality
 */
export function SwipeableWrapper({
  children,
  onSwipeDelete,
  disabled = false,
  borderRadius: customBorderRadius,
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

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onStart(() => {
      // Reset direction at start of new gesture
      swipeDirection.value = 0;
    })
    .onUpdate((event) => {
      // Lock direction on first significant movement
      if (swipeDirection.value === 0 && Math.abs(event.translationX) > 5) {
        swipeDirection.value = event.translationX > 0 ? 1 : -1;
      }

      // Only allow movement in the locked direction
      if (swipeDirection.value !== 0) {
        const isSameDirection =
          (swipeDirection.value > 0 && event.translationX > 0) ||
          (swipeDirection.value < 0 && event.translationX < 0);

        if (isSameDirection) {
          // Continue in same direction
          translateX.value = event.translationX;
        } else if (event.translationX * swipeDirection.value < 0) {
          // Opposite direction - snap back to cancel
          translateX.value = withSpring(0, {
            damping: 20,
            stiffness: 300,
          });
          swipeDirection.value = 0;
        }
      }
    })
    .onEnd((event) => {
      const absTranslateX = Math.abs(translateX.value);
      const absVelocityX = Math.abs(event.velocityX);

      // Check if crossed 30% threshold or very fast swipe
      if (
        absTranslateX > DELETE_THRESHOLD ||
        absVelocityX > DELETE_VELOCITY_THRESHOLD
      ) {
        // Automatically continue sliding off screen and delete
        const direction = translateX.value > 0 ? 1 : -1;
        translateX.value = withTiming(
          direction * SCREEN_WIDTH,
          { duration: 300 },
          (finished) => {
            if (finished) {
              runOnJS(handleDelete)();
            }
          }
        );
      } else {
        // Snap back - didn't reach 30% threshold
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
      }

      // Reset direction
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
      [0, DELETE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      translateX.value,
      [0, DELETE_THRESHOLD],
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
      [-DELETE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      translateX.value,
      [-DELETE_THRESHOLD, 0],
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

  return (
    <View style={styles.container}>
      {/* Left delete background (swipe right) */}
      <Animated.View style={[
        styles.deleteBackground,
        styles.leftBackground,
        borderRadiusStyle,
        leftBackgroundStyle
      ]}>
        <Ionicons name="trash-outline" size={24} color={colors.textLight} />
      </Animated.View>

      {/* Right delete background (swipe left) */}
      <Animated.View style={[
        styles.deleteBackground,
        styles.rightBackground,
        borderRadiusStyle,
        rightBackgroundStyle
      ]}>
        <Ionicons name="trash-outline" size={24} color={colors.textLight} />
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
