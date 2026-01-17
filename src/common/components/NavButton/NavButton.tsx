import React from 'react';
import { Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, withOpacity } from '../../../theme';
import { styles } from './styles';
import { NavButtonProps } from './types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
        ['transparent', isActive ? colors.primary : withOpacity(colors.primary, 0.1)]
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
