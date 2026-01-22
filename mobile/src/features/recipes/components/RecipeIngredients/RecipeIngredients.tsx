import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { colors, pastelColors } from '../../../../theme/colors';
import { GroceryCard, GroceryCardContent, IngredientInfo } from '../../../../common/components/GroceryCard';
import type { RecipeIngredientsProps } from './types';

/**
 * RecipeIngredients component displays the ingredients list for a recipe.
 * Provides functionality to add individual ingredients or all ingredients
 * to the shopping list.
 *
 * @param recipe - The recipe object containing ingredients to display
 * @param onAddIngredient - Callback function when an individual ingredient is added
 * @param onAddAllIngredients - Callback function when all ingredients are added
 *
 * @example
 * ```tsx
 * <RecipeIngredients
 *   recipe={recipe}
 *   onAddIngredient={handleAddIngredient}
 *   onAddAllIngredients={handleAddAllIngredients}
 * />
 * ```
 */
export function RecipeIngredients({
  recipe,
  onAddIngredient,
  onAddAllIngredients,
}: RecipeIngredientsProps) {
  return (
    <View style={styles.container}>
      {/* Ingredients Section */}
      {onAddIngredient && (
        <View style={styles.ingredientsSection}>
          <View style={styles.ingredientsSectionHeader}>
            {onAddAllIngredients && (
              <TouchableOpacity
                style={styles.addAllButton}
                onPress={onAddAllIngredients}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Add all ingredients to shopping list"
              >
                <Ionicons name="add-circle" size={14} color={colors.recipes} />
                <Text style={styles.addAllButtonText}>Add All</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.ingredientsList}>
            {recipe.ingredients.map((ingredient, index) => (
              <View key={ingredient.id} style={styles.ingredientCardWrapper}>
                <GroceryCard
                  backgroundColor={pastelColors[index % pastelColors.length]}
                >
                  <GroceryCardContent
                    image={ingredient.image}
                    title={ingredient.name}
                    subtitle={
                      <IngredientInfo
                        quantity={ingredient.quantity}
                        unit={ingredient.unit}
                      />
                    }
                    rightElement={
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => onAddIngredient(ingredient)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Add ${ingredient.name} to shopping list`}
                      >
                        <Ionicons
                          name="cart-outline"
                          size={18}
                          color={colors.textMuted}
                        />
                      </TouchableOpacity>
                    }
                    imagePosition={ingredient.image ? 'left' : 'none'}
                  />
                </GroceryCard>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
