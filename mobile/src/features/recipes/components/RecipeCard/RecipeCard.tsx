import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme';
import { useEntitySyncStatusWithEntity } from '../../../../common/hooks/useSyncStatus';
import { SyncStatusIndicator } from '../../../../common/components/SyncStatusIndicator';
import { determineIndicatorStatus } from '../../../../common/utils/syncStatusUtils';
import { styles } from './styles';
import { RecipeCardProps } from './types';

export function RecipeCard({ recipe, backgroundColor, onPress, width, style, onEdit }: RecipeCardProps) {
  // Check sync status for signed-in users
  const syncStatus = useEntitySyncStatusWithEntity('recipes', recipe);

  // Determine status for indicator
  const indicatorStatus = determineIndicatorStatus(syncStatus);

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
      style={[styles.recipeCard, { backgroundColor, width }, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.recipeImageContainer}>
        {recipe.imageUrl ? (
          // @ts-ignore - Image source type mismatch with string
          <Image source={{ uri: recipe.imageUrl }} style={styles.recipeImage} />
        ) : (
          <View style={styles.recipeImagePlaceholder}>
            <Ionicons name="restaurant-outline" size={40} color={colors.textSecondary} />
          </View>
        )}
        {typeof onEdit === 'function' && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={onEdit}
            accessibilityRole="button"
            accessibilityLabel="Edit recipe"
          >
            <Ionicons name="create-outline" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        {/* Sync status indicator in top-right corner of image */}
        {(syncStatus.isPending || syncStatus.isFailed) && (
          <View style={styles.syncStatusContainer}>
            <SyncStatusIndicator status={indicatorStatus} size="small" />
          </View>
        )}
      </View>
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeName} numberOfLines={1}>
          {recipe.title || 'Untitled Recipe'}
        </Text>
        <View style={styles.recipeMetaRow}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.recipeMeta}>{formatMinutes(timeLabel)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
