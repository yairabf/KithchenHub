/**
 * Offline Pill Component
 * 
 * Compact, dismissible offline indicator with sync status.
 * Shows offline state, pending sync count, or syncing state.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeIn, FadeOut } from 'react-native-reanimated';
import { useNetwork } from '../../../contexts/NetworkContext';
import { useSyncQueueStatus } from '../../hooks/useSyncStatus';
import { colors } from '../../../theme';
import { createStyles } from './styles';
import type { OfflinePillProps } from './types';

const DISMISS_STORAGE_KEY = '@kitchen_hub_offline_pill_dismissed';

/**
 * Offline Pill Component
 * 
 * Shows compact indicator for offline state and sync status.
 * Automatically hides when online with no pending items.
 */
export function OfflinePill({
  position = 'bottom-right',
  dismissible = false,
  showPendingCount = true,
}: OfflinePillProps) {
  const { isOffline } = useNetwork();
  const { totalPending, isProcessing, failedCount } = useSyncQueueStatus();
  const [isDismissed, setIsDismissed] = useState(false);
  const opacity = useSharedValue(0);

  // Check if pill was previously dismissed
  useEffect(() => {
    const checkDismissed = async () => {
      if (dismissible) {
        try {
          const dismissed = await AsyncStorage.getItem(DISMISS_STORAGE_KEY);
          setIsDismissed(dismissed === 'true');
        } catch (error) {
          console.error('Failed to check pill dismissal state:', error);
        }
      }
    };
    checkDismissed();
  }, [dismissible]);

  // Determine if pill should be visible
  const shouldShow = !isDismissed && (
    isOffline || // Always show when offline
    (totalPending > 0) || // Show when there are pending items
    isProcessing || // Show when syncing
    (failedCount > 0) // Show when there are failed items
  );

  // Animate appearance/disappearance
  useEffect(() => {
    opacity.value = withTiming(shouldShow ? 1 : 0, { duration: 300 });
  }, [shouldShow, opacity]);

  // Handle dismiss
  const handleDismiss = async () => {
    if (dismissible) {
      try {
        await AsyncStorage.setItem(DISMISS_STORAGE_KEY, 'true');
        setIsDismissed(true);
      } catch (error) {
        console.error('Failed to save pill dismissal:', error);
      }
    }
  };

  /**
   * Determines the content to display in the offline pill based on current state.
   * 
   * Priority order: offline > syncing > failed > pending
   * 
   * @returns Object with icon, text, color, and optional showSpinner flag, or null if pill should be hidden
   */
  const getContent = (): {
    icon: string | null;
    text: string;
    color: string;
    showSpinner?: boolean;
  } | null => {
    if (isOffline) {
      return {
        icon: 'wifi-outline' as const,
        text: 'Offline',
        color: colors.error,
      };
    }

    if (isProcessing) {
      return {
        icon: null,
        text: 'Syncing...',
        color: colors.primary,
        showSpinner: true,
      };
    }

    if (failedCount > 0) {
      return {
        icon: 'warning-outline' as const,
        text: showPendingCount ? `${failedCount} failed` : 'Failed',
        color: colors.error,
      };
    }

    if (totalPending > 0) {
      return {
        icon: 'sync-outline' as const,
        text: showPendingCount ? `${totalPending} pending` : 'Pending',
        color: colors.warning,
      };
    }

    return null;
  };

  const content = getContent();
  const styles = createStyles(position);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: opacity.value }],
  }));

  if (!shouldShow || !content) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
    >
      {content.showSpinner ? (
        <ActivityIndicator size="small" color={content.color} />
      ) : content.icon ? (
        <View style={styles.iconContainer}>
          <Ionicons name={content.icon} size={16} color={content.color} />
        </View>
      ) : null}
      <Text style={[styles.text, { color: content.color }]}>
        {content.text}
      </Text>
      {dismissible && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}
