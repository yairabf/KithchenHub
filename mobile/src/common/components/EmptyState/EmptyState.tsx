import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../../theme';
import { styles } from './styles';
import type { EmptyStateProps } from './types';

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onActionPress,
  iconColor = colors.textMuted,
  actionColor = colors.primary,
}: EmptyStateProps) {
  return (
    <View style={styles.container} accessibilityRole="text">
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={64} color={iconColor} />
      </View>

      {/* Title */}
      <Text style={styles.title} accessibilityLabel={`Empty state: ${title}`}>
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text style={styles.description} accessibilityLabel={description}>
          {description}
        </Text>
      )}

      {/* Action Button */}
      {actionLabel && onActionPress && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: actionColor }]}
          onPress={onActionPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Ionicons name="add" size={20} color={colors.textLight} />
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
