import React from 'react';
import { View, Text, TouchableOpacity, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { colors, pastelColors } from '../../../../theme/colors';
import { ListItemCardWrapper } from '../../../../common/components/ListItemCardWrapper';
import { GroceryCardContent, IngredientInfo } from '../../../../common/components/GroceryCard';
import type { RecipeIngredientsProps } from './types';
import { useTranslation } from 'react-i18next';
import { getUnitLabel } from '../../constants';

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
  const { t, i18n } = useTranslation('recipes');
  const isRtlLayout = i18n.dir() === 'rtl' || I18nManager.isRTL;

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
                accessibilityLabel={t('detail.addAllIngredientsToShoppingListAccessibilityLabel')}
              >
                <Ionicons name="add-circle" size={14} color={colors.recipes} />
                <Text style={styles.addAllButtonText}>{t('detail.addAll')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.ingredientsList}>
            {(recipe.ingredients || []).map((ingredient, index) => (
              <View key={ingredient.id || `ing-${index}`} style={styles.ingredientCardWrapper}>
                <ListItemCardWrapper
                  backgroundColor={pastelColors[index % pastelColors.length]}
                >
                  <GroceryCardContent
                    image={ingredient.image}
                    title={ingredient.name || ''}
                      subtitle={
                      <IngredientInfo
                        quantity={String(ingredient.quantityAmount ?? ingredient.quantity ?? '')}
                        unit={getUnitLabel(ingredient.quantityUnit ?? ingredient.unit ?? '', t)}
                      />
                    }
                    rightElement={
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => onAddIngredient(ingredient)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={t('detail.addIngredientToShoppingListAccessibilityLabel', {
                          name: ingredient.name || t('detail.ingredientFallbackName'),
                        })}
                      >
                        <Ionicons
                          name="cart-outline"
                          size={18}
                          color={colors.textMuted}
                        />
                      </TouchableOpacity>
                    }
                    imagePosition={ingredient.image ? 'left' : 'none'}
                    isRtl={isRtlLayout}
                  />
                </ListItemCardWrapper>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
