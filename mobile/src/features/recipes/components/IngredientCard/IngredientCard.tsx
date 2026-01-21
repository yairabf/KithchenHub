import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { colors } from '../../../../theme/colors';
import type { IngredientCardProps } from './types';

export function IngredientCard({
  ingredient,
  backgroundColor,
  onAddToList,
}: IngredientCardProps) {
  const displayQty = parseFloat(ingredient.quantity);
  const formattedQty = Number.isInteger(displayQty)
    ? displayQty.toString()
    : displayQty.toFixed(1);

  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={styles.content}>
        <Text style={styles.quantityText}>
          {formattedQty} {ingredient.unit}
        </Text>
        <Text style={styles.nameText}>{ingredient.name}</Text>
      </View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={onAddToList}
        activeOpacity={0.7}
      >
        <Ionicons name="cart-outline" size={20} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}
