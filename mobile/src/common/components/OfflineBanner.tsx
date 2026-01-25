import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '../../contexts/NetworkContext';
import { colors, spacing, borderRadius, zIndex } from '../../theme';

export function OfflineBanner() {
  const { top } = useSafeAreaInsets();
  const { isOffline, connectionType } = useNetwork();

  if (!isOffline) return null;

  return (
    <View style={[styles.container, { paddingTop: top + spacing.xs }]}>
      <Text style={styles.title}>You're offline. Some features may be unavailable.</Text>
      {connectionType && connectionType !== 'unknown' && connectionType !== 'none' ? (
        <Text style={styles.subtitle}>Connection: {connectionType}</Text>
      ) : null}
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
  title: {
    color: colors.textLight,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textLight,
    marginTop: spacing.xs,
    opacity: 0.9,
  },
});
