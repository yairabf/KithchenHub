import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { MainTabsScreen } from './MainTabsScreen';
import { MainStackParamList } from './types';
import { PremiumPaywallScreen } from '../features/subscription/screens/PremiumPaywallScreen';
import { SupportTicketScreen } from '../features/support/screens/SupportTicketScreen';
import { NetworkProvider } from '../contexts/NetworkContext';
import { AppLifecycleProvider } from '../contexts/AppLifecycleContext';
import { useSyncQueue } from '../common/hooks/useSyncQueue';

const Stack = createNativeStackNavigator<MainStackParamList>();

/**
 * Inner component that uses the sync queue hook
 * Must be inside NetworkProvider and AppLifecycleProvider
 */
function MainNavigatorContent() {
  const { t } = useTranslation('common');

  // Process sync queue when network comes back online or app comes to foreground
  useSyncQueue();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={MainTabsScreen}
        options={{ title: t('navigation.home') }}
      />
      <Stack.Screen
        name="PremiumPaywall"
        component={PremiumPaywallScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SupportTicket"
        component={SupportTicketScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export function MainNavigator() {
  return (
    <NetworkProvider>
      <AppLifecycleProvider>
        <MainNavigatorContent />
      </AppLifecycleProvider>
    </NetworkProvider>
  );
}
