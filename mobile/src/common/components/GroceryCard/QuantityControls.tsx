import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { DEFAULT_MIN_QUANTITY } from './constants';
import { styles } from './styles';
import type { QuantityControlsProps } from './types';

/**
 * Standalone +/- quantity controls for shopping items
 * Used in shopping list context
 */
export function QuantityControls({
  quantity,
  onIncrement,
  onDecrement,
  minQuantity = DEFAULT_MIN_QUANTITY,
}: QuantityControlsProps) {
  const canDecrement = quantity > minQuantity;

  return (
    <View style={styles.quantityControls}>
      <TouchableOpacity
        style={[styles.quantityBtn, !canDecrement && styles.quantityBtnDisabled]}
        onPress={onDecrement}
        disabled={!canDecrement}
      >
        <Text style={styles.quantityBtnText}>-</Text>
      </TouchableOpacity>
      <Text style={styles.quantity}>{Math.ceil(quantity)}</Text>
      <TouchableOpacity style={styles.quantityBtn} onPress={onIncrement}>
        <Text style={styles.quantityBtnText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}
