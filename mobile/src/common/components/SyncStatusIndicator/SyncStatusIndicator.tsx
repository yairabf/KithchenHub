/**
 * Sync Status Indicator Component
 * 
 * Small visual indicator for entity sync status.
 * Shows pending, confirmed, or failed state with appropriate icon.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { createStyles } from './styles';
import type { SyncStatusIndicatorProps } from './types';

// Size configuration for icon sizing
const sizeConfig: Record<'small' | 'medium', { icon: number }> = {
  small: { icon: 12 },
  medium: { icon: 16 },
};

/**
 * Sync Status Indicator Component
 * 
 * Displays a small icon (and optional label) indicating the sync status of an entity.
 * - Pending: Clock icon (gray)
 * - Confirmed: Checkmark icon (green) or no indicator
 * - Failed: Warning icon (red)
 */
export function SyncStatusIndicator({
  status,
  size = 'small',
  showLabel = false,
}: SyncStatusIndicatorProps) {
  const { t } = useTranslation('common');
  const styles = createStyles(size);
  const iconSize = sizeConfig[size].icon;

  // Confirmed status shows no indicator by default (or subtle checkmark if requested)
  if (status === 'confirmed') {
    if (!showLabel) {
      return null; // No indicator for confirmed entities
    }
    return (
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark" size={iconSize} color={styles.confirmedIcon.color} />
        </View>
        {showLabel && <Text style={[styles.label, styles.confirmedIcon]}>{t('offline.synced')}</Text>}
      </View>
    );
  }

  // Pending status
  if (status === 'pending') {
    return (
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name="time-outline" size={iconSize} color={styles.pendingIcon.color} />
        </View>
        {showLabel && <Text style={[styles.label, styles.pendingLabel]}>{t('offline.pending')}</Text>}
      </View>
    );
  }

  // Failed status
  if (status === 'failed') {
    return (
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name="warning-outline" size={iconSize} color={styles.failedIcon.color} />
        </View>
        {showLabel && <Text style={[styles.label, styles.failedLabel]}>{t('offline.failed')}</Text>}
      </View>
    );
  }

  return null;
}
