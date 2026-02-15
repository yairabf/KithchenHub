import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme';
import { useEntitySyncStatusWithEntity } from '../../../../common/hooks/useSyncStatus';
import { SyncStatusIndicator } from '../../../../common/components/SyncStatusIndicator';
import { determineIndicatorStatus } from '../../../../common/utils/syncStatusUtils';
import { styles } from './styles';
import { RecipeCardProps } from './types';
import { useRecipeImage } from '../../../../common/hooks/useRecipeImage';

export function RecipeCard({ recipe, backgroundColor, onPress, width, style, onEdit }: RecipeCardProps) {
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
      return Number.isFinite(value) ? `${value} min` : '—';
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? `${parsed} min` : '—';
    }
    return '—';
  };

  const timeLabel = recipe.prepTime ?? recipe.cookTime;

  return (
    <TouchableOpacity
      style={[styles.recipeCard, { width }, style]}
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

        {/* Sync status indicator */}
        {(syncStatus.isPending || syncStatus.isFailed) && (
          <View style={styles.syncStatusContainer}>
            <SyncStatusIndicator status={indicatorStatus} size="small" />
          </View>
        )}
      </View>

      <View style={styles.recipeInfo}>
        <View style={styles.recipeNameTimeRow}>
          <Text style={styles.recipeName} numberOfLines={1} ellipsizeMode="tail">
            {recipe.title || 'Untitled Recipe'}
          </Text>
          <View style={styles.recipeMetaItem}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={styles.recipeMetaText}>{formatMinutes(timeLabel)}</Text>
          </View>
        </View>
        {recipe.description?.trim() ? (
          <Text style={styles.recipeDescription} numberOfLines={2}>
            {recipe.description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
