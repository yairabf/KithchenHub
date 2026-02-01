import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { AuthStackNavigator } from './AuthStackNavigator';
import { MainNavigator } from './MainNavigator';
import { invalidateAllSignedInCaches } from '../common/repositories/cacheAwareRepository';
import { colors } from '../theme';

export function RootNavigator() {
  const { user, isLoading } = useAuth();
  const hasInvalidatedWebCachesRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || isLoading || !user || hasInvalidatedWebCachesRef.current) {
      return;
    }
    hasInvalidatedWebCachesRef.current = true;
    invalidateAllSignedInCaches().catch((err) => {
      console.warn('[RootNavigator] Web cache invalidation failed:', err);
    });
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainNavigator /> : <AuthStackNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
