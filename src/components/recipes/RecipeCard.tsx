import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../../theme';

interface Recipe {
  id: string;
  name: string;
  cookTime: string;
  category: string;
  imageUrl?: string;
}

interface RecipeCardProps {
  recipe: Recipe;
  backgroundColor: string;
  onPress: () => void;
  width: number;
}

export function RecipeCard({ recipe, backgroundColor, onPress, width }: RecipeCardProps) {
  return (
    <TouchableOpacity 
      style={[styles.recipeCard, { backgroundColor, width }]} 
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

const styles = StyleSheet.create({
  recipeCard: {
    borderRadius: 16,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  recipeImageContainer: {
    height: 100,
    backgroundColor: colors.transparent.white50,
  },
  recipeImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeInfo: {
    padding: spacing.sm,
  },
  recipeName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  recipeMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
});
