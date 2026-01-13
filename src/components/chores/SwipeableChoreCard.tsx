import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
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
import { colors, borderRadius } from '../../theme';

const SWIPE_THRESHOLD = 80;
const SCREEN_WIDTH = Dimensions.get('window').width;
const DELETE_VELOCITY_THRESHOLD = 500;

interface SwipeableChoreCardProps {
  children: React.ReactNode;
  onDelete: () => void;
  backgroundColor: string;
}

export function SwipeableChoreCard({
  children,
  onDelete,
  backgroundColor,
}: SwipeableChoreCardProps) {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(0);

  const handleDelete = () => {
    onDelete();
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      const absTranslateX = Math.abs(translateX.value);
      const absVelocityX = Math.abs(event.velocityX);

      // Check if should delete (threshold exceeded or fast swipe)
      if (
        absTranslateX > SWIPE_THRESHOLD ||
        absVelocityX > DELETE_VELOCITY_THRESHOLD
      ) {
        // Animate off screen
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
        // Snap back
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const leftBackgroundStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
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
      [-SWIPE_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      translateX.value,
      [-SWIPE_THRESHOLD, 0],
      [1, 0.5],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <View
      style={styles.container}
      onLayout={(event) => {
        itemHeight.value = event.nativeEvent.layout.height;
      }}
    >
      {/* Left delete background (swipe right) */}
      <Animated.View style={[styles.deleteBackground, styles.leftBackground, leftBackgroundStyle]}>
        <Ionicons name="trash-outline" size={24} color={colors.textLight} />
      </Animated.View>

      {/* Right delete background (swipe left) */}
      <Animated.View style={[styles.deleteBackground, styles.rightBackground, rightBackgroundStyle]}>
        <Ionicons name="trash-outline" size={24} color={colors.textLight} />
      </Animated.View>

      {/* Swipeable card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, { backgroundColor }, cardAnimatedStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 8,
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: borderRadius.lg,
    width: 80,
  },
  leftBackground: {
    left: 0,
  },
  rightBackground: {
    right: 0,
  },
  card: {
    borderRadius: borderRadius.lg,
  },
});
