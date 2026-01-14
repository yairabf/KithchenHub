import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../theme';

interface FloatingActionButtonProps {
  label: string;
  onPress?: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  bottomOffset?: number;
}

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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -100 }], // Center the 200px wide button
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minWidth: 200,
    ...shadows.float,
    gap: spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
