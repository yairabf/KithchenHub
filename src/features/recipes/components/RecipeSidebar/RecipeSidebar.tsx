import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './styles';
import { colors } from '../../../../theme/colors';
import type { RecipeSidebarProps } from './types';

export function RecipeSidebar({ recipe }: RecipeSidebarProps) {
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
    </View>
  );
}
