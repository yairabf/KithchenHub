import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '../../contexts/NetworkContext';
import { colors, spacing, borderRadius, zIndex } from '../../theme';

export function OfflineBanner() {
  const { top } = useSafeAreaInsets();
  const { isOffline, connectionType } = useNetwork();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (!isOffline) {
      setIsDismissed(false);
    }
  }, [isOffline]);

  if (!isOffline || isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  return (
    <View style={[styles.container, { paddingTop: top + spacing.xs }]}>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>You're offline. Some features may be unavailable.</Text>
          {connectionType && connectionType !== 'unknown' && connectionType !== 'none' ? (
            <Text style={styles.subtitle}>Connection: {connectionType}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Dismiss offline banner"
        >
          <Ionicons name="close" size={20} color={colors.textLight} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    zIndex: zIndex.overlay,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: colors.textLight,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textLight,
    marginTop: spacing.xs,
    opacity: 0.9,
  },
  closeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
});
