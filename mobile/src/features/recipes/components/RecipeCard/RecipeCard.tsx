import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme';
import { useEntitySyncStatusWithEntity } from '../../../../common/hooks/useSyncStatus';
import { SyncStatusIndicator } from '../../../../common/components/SyncStatusIndicator';
import { determineIndicatorStatus } from '../../../../common/utils/syncStatusUtils';
import { styles } from './styles';
import { RecipeCardProps } from './types';

export function RecipeCard({ recipe, backgroundColor, onPress, width, style }: RecipeCardProps) {
  // Check sync status for signed-in users
  const syncStatus = useEntitySyncStatusWithEntity('recipes', recipe);

  // Determine status for indicator
  const indicatorStatus = determineIndicatorStatus(syncStatus);

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
        {/* Sync status indicator in top-right corner of image */}
        {(syncStatus.isPending || syncStatus.isFailed) && (
          <View style={styles.syncStatusContainer}>
            <SyncStatusIndicator status={indicatorStatus} size="small" />
          </View>
        )}
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
