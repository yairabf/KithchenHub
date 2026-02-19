import React from 'react';
import { View } from 'react-native';
import { styles } from './styles';
import type { GroceryCardProps } from './types';

/**
 * Base card component that provides consistent visual styling
 * Used in both recipe and shopping contexts
 */
export function GroceryCard({
  backgroundColor,
  children,
  style,
  testID,
}: GroceryCardProps) {
  return (
    <View
      style={[styles.card, backgroundColor && { backgroundColor }, style]}
      testID={testID}
    >
      {children}
    </View>
  );
}
