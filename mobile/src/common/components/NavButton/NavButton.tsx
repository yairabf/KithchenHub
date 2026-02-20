import React from 'react';
import { Pressable, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme';
import { styles } from './styles';
import { NavButtonProps } from './types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Pre-compute colors as simple strings for worklet safety
// Note: withOpacity removed to avoid worklet serialization issues
const COLORS = {
  primary: colors.primary,
  primaryLight: 'rgba(35, 76, 106, 0.1)',
  textLight: colors.textLight,
  buttonInactive: colors.buttonInactive,
} as const;

export function NavButton({
  icon,
  iconActive,
  label,
  isActive,
  isPhone = false,
  onPress,
}: NavButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  // Responsive sizes - larger on tablet/desktop, slightly smaller on phone
  const iconSize = isPhone ? 23 : 28;
  const fontSize = isPhone ? 9.5 : 12;

  return (
    <AnimatedPressable
      style={[
        styles.button,
        isPhone && styles.buttonPhone,
        animatedStyle,
        isActive && styles.buttonActive,
        isActive && { backgroundColor: COLORS.primary },
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityLabel={label}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
    >
      <Ionicons
        name={isActive ? iconActive : icon}
        size={iconSize}
        color={isActive ? COLORS.textLight : COLORS.buttonInactive}
        style={styles.icon}
      />
      <Text
        style={[
          styles.label,
          { color: isActive ? COLORS.textLight : COLORS.buttonInactive, fontSize },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}
