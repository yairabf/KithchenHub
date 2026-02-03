import React from 'react';
import { View, Text, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { colors } from '../../../../theme/colors';
import type { RecipeHeaderProps } from './types';

/**
 * RecipeHeader component displays recipe metadata including category badges,
 * title, description, and quick stats (time and calories).
 *
 * The title and description are overlaid on the recipe image for a modern,
 * visually appealing header design.
 *
 * @param recipe - The recipe object containing metadata to display
 *
 * @example
 * ```tsx
 * <RecipeHeader recipe={recipe} />
 * ```
 */
export function RecipeHeader({ recipe }: RecipeHeaderProps) {
  const hasImage = Boolean(recipe.imageUrl);

  return (
    <View style={styles.container}>
      {/* Recipe Image with Title and Description Overlay */}
      <View style={styles.imageContainer}>
        {hasImage ? (
          <ImageBackground
            source={{ uri: recipe.imageUrl }}
            style={styles.imageBackground}
            imageStyle={styles.imageStyle}
          >
            {/* Dark overlay for text readability */}
            <View style={styles.imageOverlay}>
              {/* Category badges positioned at top */}
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

              {/* Title and Description at bottom */}
              <View style={styles.textOverlay}>
                <Text style={styles.title}>{recipe.title}</Text>
                {recipe.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {recipe.description}
                  </Text>
                )}
              </View>
            </View>
          </ImageBackground>
        ) : (
          <View style={styles.imagePlaceholder}>
            <View style={styles.placeholderContent}>
              <Ionicons name="restaurant-outline" size={64} color={colors.textMuted} />
            </View>
            <View style={styles.placeholderOverlay}>
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
              {/* Title and Description */}
              <View style={styles.textOverlay}>
                <Text style={styles.titlePlaceholder}>{recipe.title}</Text>
                {recipe.description && (
                  <Text style={styles.descriptionPlaceholder} numberOfLines={2}>
                    {recipe.description}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Quick stats below image */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Time</Text>
          <View style={styles.statValue}>
            <Ionicons name="time-outline" size={18} color={colors.recipes} />
            <Text style={styles.statText}>{recipe.cookTime ? `${recipe.cookTime} min` : 'N/A'}</Text>
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
    </View>
  );
}
