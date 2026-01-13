import React from 'react';
import { StyleSheet, Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Indigo background color for active state (matching reference)
const ACTIVE_BG_COLOR = '#6366F1';

interface NavButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label: string;
  isActive: boolean;
  onPress: () => void;
}

export function NavButton({
  icon,
  iconActive,
  label,
  isActive,
  onPress,
}: NavButtonProps) {
  const scale = useSharedValue(1);
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      backgroundColor: interpolateColor(
        isActive ? 1 : pressed.value,
        [0, 1],
        ['transparent', isActive ? ACTIVE_BG_COLOR : 'rgba(99, 102, 241, 0.1)']
      ),
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
    pressed.value = withSpring(1);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
    pressed.value = withSpring(0);
  };

  return (
    <AnimatedPressable
      style={[
        styles.button,
        animatedStyle,
        isActive && styles.buttonActive,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Ionicons
        name={isActive ? iconActive : icon}
        size={22}
        color={isActive ? colors.textLight : colors.buttonInactive}
        style={styles.icon}
      />
      <Text
        style={[
          styles.label,
          { color: isActive ? colors.textLight : colors.buttonInactive },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 35,
    minWidth: 60,
  },
  buttonActive: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    marginBottom: 4,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
