import React from 'react';
import { View, Text, ImageBackground, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { colors } from '../../../../theme/colors';
import type { RecipeHeaderProps } from './types';
import { useRecipeImage } from '../../../../common/hooks/useRecipeImage';
import { useTranslation } from 'react-i18next';
import { getRecipeCategoryLabel, normalizeRecipeCategory } from '../../constants';
import { TextBlock } from '../../../../common/components/TextBlock';

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
  const { t, i18n } = useTranslation('recipes');
  const isRtlLayout = i18n.dir() === 'rtl' || I18nManager.isRTL;
  const { uri: cachedImageUri } = useRecipeImage({
    recipeId: recipe.id,
    variant: 'image',
    imageVersion: recipe.imageVersion,
    remoteUrl: recipe.imageUrl ?? null,
  });
  const imageUri = cachedImageUri ?? undefined;
  const categoryLabel = getRecipeCategoryLabel(normalizeRecipeCategory(recipe.category), t);
  const recipeDescription = recipe.description?.trim() ?? '';
  const prepTimeValue = (() => {
    const raw = recipe.prepTime;
    const num = raw != null ? Number(raw) : NaN;
    return Number.isFinite(num) ? num : null;
  })();
  const prepTimeText = prepTimeValue !== null
    ? `${t('detail.preparationTime')}: ${prepTimeValue} ${t('detail.minutesLabel')}`
    : `${t('detail.preparationTime')}: —`;

  return (
    <View style={styles.container}>
      {/* Recipe Image with Title and Description Overlay */}
      <View style={styles.imageContainer}>
        {imageUri ? (
          <ImageBackground
            source={{ uri: imageUri }}
            style={styles.imageBackground}
            imageStyle={styles.imageStyle}
          >
            {/* Dark overlay for text readability */}
            <View style={styles.imageOverlay}>
              {/* Category badges positioned at top */}
              <View style={[styles.badgesRow, isRtlLayout && styles.badgesRowRtl]}>
                <View style={[styles.badge, styles.categoryBadge]}>
                  <Text style={[styles.badgeText, styles.categoryBadgeText]}>
                    {categoryLabel}
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

              {/* Title and Description at bottom (inside image) */}
              <TextBlock
                title={recipe.title}
                subtitle={recipeDescription}
                isRtl={isRtlLayout}
                containerStyle={styles.textOverlay}
                containerRtlStyle={styles.textOverlayRtl}
                titleStyle={styles.title}
                titleRtlStyle={styles.titleRtl}
                subtitleStyle={styles.description}
                subtitleRtlStyle={styles.descriptionRtl}
              />
            </View>
          </ImageBackground>
        ) : (
          <View style={styles.imagePlaceholder}>
            <View style={styles.placeholderContent}>
              <Ionicons name="restaurant-outline" size={64} color={colors.textMuted} />
            </View>
            <View style={styles.placeholderOverlay}>
              {/* Category badges */}
              <View style={[styles.badgesRow, isRtlLayout && styles.badgesRowRtl]}>
                <View style={[styles.badge, styles.categoryBadge]}>
                  <Text style={[styles.badgeText, styles.categoryBadgeText]}>
                    {categoryLabel}
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
              {/* Title and Description (inside image area) */}
              <TextBlock
                title={recipe.title}
                subtitle={recipeDescription}
                isRtl={isRtlLayout}
                containerStyle={styles.textOverlay}
                containerRtlStyle={styles.textOverlayRtl}
                titleStyle={styles.titlePlaceholder}
                titleRtlStyle={styles.titleRtl}
                subtitleStyle={styles.descriptionPlaceholder}
                subtitleRtlStyle={styles.descriptionRtl}
              />
            </View>
          </View>
        )}
      </View>

      {/* Quick stats below image */}
      <View style={[styles.statsGrid, isRtlLayout && styles.statsGridRtl]}>
        <View style={styles.statCard}>
          <View style={isRtlLayout ? styles.prepTimeRowRtl : undefined}>
            <Text style={[styles.prepTimeText, isRtlLayout && styles.prepTimeTextRtl]}>{prepTimeText}</Text>
          </View>
        </View>
        {recipe.calories && (
          <View style={styles.statCard}>
            <View style={[styles.statValue, isRtlLayout && styles.statValueRtl]}>
              <Ionicons name="flash" size={18} color="#EAB308" />
              <Text style={[styles.statText, isRtlLayout && styles.statTextRtl]}>{recipe.calories}</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
