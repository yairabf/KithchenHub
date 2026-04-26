import React, { useEffect, useMemo } from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
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
  allowedSwipeDirection = 'both',
  deleteOnSwipeOpen = false,
}: SwipeableWrapperProps) {
  const translateX = useSharedValue(0);
  const swipeDirection = useSharedValue<number>(0); // 1 for right, -1 for left, 0 for none
  const isAutoDeleting = useSharedValue(false);
  const containerWidth = useSharedValue(0);

  useEffect(() => {
    if (!disabled) {
      return;
    }

    isAutoDeleting.value = false;
    translateX.value = withTiming(0, { duration: 180 });
  }, [disabled, isAutoDeleting, translateX]);

  const closeSwipe = () => {
    isAutoDeleting.value = false;
    translateX.value = withTiming(0, { duration: 180 });
  };

  const finalizeDelete = () => {
    isAutoDeleting.value = false;

    try {
      onSwipeDelete();
    } catch (error) {
      console.error('SwipeableWrapper: Failed to delete item:', error);
    }
  };

  const handleDelete = () => {
    closeSwipe();
    finalizeDelete();
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
      if (isAutoDeleting.value) {
        return;
      }

      swipeDirection.value = 0;
    })
    .onUpdate((event) => {
      'worklet';
      if (isAutoDeleting.value) {
        return;
      }
      if (swipeDirection.value === 0 && Math.abs(event.translationX) > 5) {
        swipeDirection.value = event.translationX > 0 ? 1 : -1;
      }

      if (swipeDirection.value !== 0) {
        const isDirectionAllowed =
          allowedSwipeDirection === 'both' ||
          (allowedSwipeDirection === 'left' && swipeDirection.value < 0) ||
          (allowedSwipeDirection === 'right' && swipeDirection.value > 0);

        if (!isDirectionAllowed) {
          translateX.value = 0;
          return;
        }

        const isSameDirection =
          (swipeDirection.value > 0 && event.translationX > 0) ||
          (swipeDirection.value < 0 && event.translationX < 0);

        if (isSameDirection) {
          const raw = event.translationX;
          const clamped = Math.max(-actionWidth, Math.min(actionWidth, raw));
          translateX.value = clamped;
        } else if (event.translationX * swipeDirection.value < 0) {
          translateX.value = 0;
          swipeDirection.value = 0;
        }
      }
    })
    .onEnd((event) => {
      'worklet';
      if (isAutoDeleting.value) {
        return;
      }

      const absTranslateX = Math.abs(translateX.value);
      const absVelocityX = Math.abs(event.velocityX);
      const resolvedDirection =
        translateX.value === 0 ? (event.velocityX === 0 ? 0 : event.velocityX > 0 ? 1 : -1) : translateX.value > 0 ? 1 : -1;
      const isDirectionAllowed =
        resolvedDirection === 0 ||
        allowedSwipeDirection === 'both' ||
        (allowedSwipeDirection === 'left' && resolvedDirection < 0) ||
        (allowedSwipeDirection === 'right' && resolvedDirection > 0);

      if (!isDirectionAllowed || resolvedDirection === 0) {
        translateX.value = withTiming(0, { duration: 180 });
        swipeDirection.value = 0;
        return;
      }

      const openThreshold = deleteOnSwipeOpen
        ? Math.min(actionWidth * 0.35, 32)
        : actionWidth * 0.55;
      const velocityThreshold = deleteOnSwipeOpen
        ? config.deleteVelocityThreshold * 0.5
        : config.deleteVelocityThreshold;
      const shouldOpen = absTranslateX >= openThreshold || absVelocityX > velocityThreshold;

      if (shouldOpen) {
        if (deleteOnSwipeOpen) {
          const swipeOutDistance = Math.max(containerWidth.value + 32, actionWidth * 2);
          isAutoDeleting.value = true;
          translateX.value = withTiming(resolvedDirection * swipeOutDistance, { duration: 180 }, (finished) => {
            'worklet';
            if (!finished) {
              isAutoDeleting.value = false;
              return;
            }

            runOnJS(finalizeDelete)();
          });
          swipeDirection.value = 0;
          return;
        }

        translateX.value = withTiming(resolvedDirection * actionWidth, { duration: 180 });
      } else {
        translateX.value = withTiming(0, { duration: 140 });
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

    return {
      opacity,
    };
  });

  const rightBackgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [-actionWidth, 0],
      [1, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
    };
  });

  const effectiveBorderRadius = customBorderRadius ?? borderRadius.lg;

  // Memoize style objects to prevent recreation on every render/animation frame
  const borderRadiusStyle = useMemo(
    () => ({ borderRadius: effectiveBorderRadius }),
    [effectiveBorderRadius]
  );
  const actionWidthStyle = useMemo(
    () => ({ width: actionWidth }),
    [actionWidth],
  );

  return (
    <View
      style={[styles.container, borderRadiusStyle]}
      onLayout={(event) => {
        containerWidth.value = event.nativeEvent.layout.width;
      }}
    >
      {!deleteOnSwipeOpen ? (
        <>
          {/* Left delete background (swipe right) */}
          <Animated.View style={[
            styles.deleteBackground,
            styles.leftBackground,
            borderRadiusStyle,
            actionWidthStyle,
            leftBackgroundStyle
          ]}>
            <TouchableOpacity onPress={handleDelete} accessibilityRole="button" accessibilityLabel="Delete" style={styles.deleteActionButton}>
              <Ionicons name="trash-outline" size={24} color={colors.textLight} />
            </TouchableOpacity>
          </Animated.View>

          {/* Right delete background (swipe left) */}
          <Animated.View style={[
            styles.deleteBackground,
            styles.rightBackground,
            borderRadiusStyle,
            actionWidthStyle,
            rightBackgroundStyle
          ]}>
            <TouchableOpacity onPress={handleDelete} accessibilityRole="button" accessibilityLabel="Delete" style={styles.deleteActionButton}>
              <Ionicons name="trash-outline" size={24} color={colors.textLight} />
            </TouchableOpacity>
          </Animated.View>
        </>
      ) : null}

      {/* Swipeable card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[
          styles.card,
          borderRadiusStyle,
          cardAnimatedStyle
        ]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
