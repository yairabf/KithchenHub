import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabsScreen } from './MainTabsScreen';
import { MainStackParamList } from './types';
import { NetworkProvider } from '../contexts/NetworkContext';
import { AppLifecycleProvider } from '../contexts/AppLifecycleContext';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <NetworkProvider>
      <AppLifecycleProvider>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="MainTabs" component={MainTabsScreen} />
        </Stack.Navigator>
      </AppLifecycleProvider>
    </NetworkProvider>
  );
}
