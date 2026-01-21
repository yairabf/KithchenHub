import React, { useMemo } from 'react';
import { Text } from 'react-native';
import { styles } from './styles';
import type { IngredientInfoProps } from './types';

/**
 * Displays formatted quantity + unit for recipe ingredients
 * Used in recipe context
 */
export function IngredientInfo({ quantity, unit }: IngredientInfoProps) {
  // Memoize quantity formatting to avoid re-computation on every render
  const formattedQty = useMemo(() => {
    const displayQty = parseFloat(quantity);
    return Number.isInteger(displayQty)
      ? displayQty.toString()
      : displayQty.toFixed(1);
  }, [quantity]);

  return (
    <Text style={styles.ingredientInfo}>
      {formattedQty} {unit}
    </Text>
  );
}
