import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme';
import { styles } from './styles';
import { FloatingActionButtonProps } from './types';

export function FloatingActionButton({
  label,
  onPress,
  iconName = 'add',
  iconColor = colors.textLight,
  bottomOffset = 100,
}: FloatingActionButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.container, { bottom: bottomOffset }]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
        <Ionicons name={iconName} size={24} color={iconColor} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}
