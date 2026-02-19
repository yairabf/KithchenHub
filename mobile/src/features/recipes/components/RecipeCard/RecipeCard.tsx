import React from 'react';
import { View, Text, TouchableOpacity, Image, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../../theme';
import { useEntitySyncStatusWithEntity } from '../../../../common/hooks/useSyncStatus';
import { SyncStatusIndicator } from '../../../../common/components/SyncStatusIndicator';
import { determineIndicatorStatus } from '../../../../common/utils/syncStatusUtils';
import { styles } from './styles';
import { RecipeCardProps } from './types';
import { useRecipeImage } from '../../../../common/hooks/useRecipeImage';

export function RecipeCard({ recipe, backgroundColor, onPress, width, style, onEdit }: RecipeCardProps) {
  const { i18n } = useTranslation();
  const isRtlLayout = i18n.dir() === 'rtl' || I18nManager.isRTL;

  // Check sync status for signed-in users
  const syncStatus = useEntitySyncStatusWithEntity('recipes', recipe);

  // Determine status for indicator
  const indicatorStatus = determineIndicatorStatus(syncStatus);
  const remoteImageUrl = recipe.thumbUrl || recipe.imageUrl || null;
  const { uri: cachedImageUri } = useRecipeImage({
    recipeId: recipe.id,
    variant: 'thumb',
    imageVersion: recipe.imageVersion,
    remoteUrl: remoteImageUrl,
  });

  const formatMinutes = (value?: number | string): string => {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? `${value} MIN` : '—';
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? `${parsed} MIN` : '—';
    }
    return '—';
  };

  const prepTimeLabel = formatMinutes(recipe.prepTime);
  const TextWrapper = isRtlLayout
    ? ({ children }: { children: React.ReactNode }) => (
        <View style={styles.rtlTextRow}>{children}</View>
      )
    : React.Fragment;

  return (
    <TouchableOpacity
      style={[styles.recipeCard, { width, backgroundColor }, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.recipeImageContainer}>
        {cachedImageUri ? (
          <Image
            source={{ uri: cachedImageUri }}
            style={styles.recipeImage}
          />
        ) : (
          <View style={styles.recipeImagePlaceholder}>
            <Ionicons name="restaurant-outline" size={40} color={colors.textSecondary} />
          </View>
        )}

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{recipe.category || 'HEALTHY'}</Text>
        </View>

        {prepTimeLabel !== '—' ? (
          <View style={styles.timeBadge}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.timeBadgeText}>{prepTimeLabel}</Text>
          </View>
        ) : null}

        {/* Sync status indicator */}
        {(syncStatus.isPending || syncStatus.isFailed) && (
          <View style={styles.syncStatusContainer}>
            <SyncStatusIndicator status={indicatorStatus} size="small" />
          </View>
        )}
      </View>

      <View style={styles.recipeInfo}>
        <TextWrapper>
          <Text
            style={[styles.recipeName, isRtlLayout && styles.recipeNameRtl]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {recipe.title || 'Untitled Recipe'}
          </Text>
        </TextWrapper>
        {recipe.description?.trim() ? (
          <TextWrapper>
            <Text
              style={[styles.recipeDescription, isRtlLayout && styles.recipeDescriptionRtl]}
              numberOfLines={2}
            >
              {recipe.description}
            </Text>
          </TextWrapper>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
