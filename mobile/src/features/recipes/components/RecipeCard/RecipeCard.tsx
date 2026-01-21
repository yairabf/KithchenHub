import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme';
import { styles } from './styles';
import { RecipeCardProps } from './types';

export function RecipeCard({ recipe, backgroundColor, onPress, width, style }: RecipeCardProps) {
  return (
    <TouchableOpacity
      style={[styles.recipeCard, { backgroundColor, width }, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.recipeImageContainer}>
        <View style={styles.recipeImagePlaceholder}>
          <Ionicons name="restaurant-outline" size={40} color={colors.textSecondary} />
        </View>
      </View>
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeName} numberOfLines={1}>{recipe.name}</Text>
        <View style={styles.recipeMetaRow}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.recipeMeta}>{recipe.cookTime}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
