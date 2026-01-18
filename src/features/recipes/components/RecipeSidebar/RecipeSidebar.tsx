import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { colors, pastelColors } from '../../../../theme/colors';
import { GroceryCard, GroceryCardContent, IngredientInfo } from '../../../../common/components/GroceryCard';
import type { RecipeSidebarProps } from './types';

export function RecipeSidebar({
  recipe,
  onAddIngredient,
  onAddAllIngredients,
}: RecipeSidebarProps) {
  return (
    <View style={styles.container}>
      {/* Category badges */}
      <View style={styles.badgesRow}>
        <View style={[styles.badge, styles.categoryBadge]}>
          <Text style={[styles.badgeText, styles.categoryBadgeText]}>
            {recipe.category}
          </Text>
        </View>
        {recipe.calories && recipe.calories > 300 && (
          <View style={[styles.badge, styles.popularBadge]}>
            <Text style={[styles.badgeText, styles.popularBadgeText]}>
              Popular
            </Text>
          </View>
        )}
      </View>

      {/* Title */}
      <Text style={styles.title}>{recipe.name}</Text>

      {/* Description */}
      {recipe.description && (
        <Text style={styles.description}>{recipe.description}</Text>
      )}

      {/* Quick stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Time</Text>
          <View style={styles.statValue}>
            <Ionicons name="time-outline" size={18} color={colors.recipes} />
            <Text style={styles.statText}>{recipe.cookTime}</Text>
          </View>
        </View>
        {recipe.calories && (
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Energy</Text>
            <View style={styles.statValue}>
              <Ionicons name="flash" size={18} color="#EAB308" />
              <Text style={styles.statText}>{recipe.calories}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Ingredients Section */}
      {onAddIngredient && (
        <View style={styles.ingredientsSection}>
          <View style={styles.ingredientsSectionHeader}>
            <Text style={styles.ingredientsSectionTitle}>Ingredients</Text>
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
