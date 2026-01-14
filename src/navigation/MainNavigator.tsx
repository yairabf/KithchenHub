import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabsScreen } from '../screens/MainTabsScreen';
import { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabsScreen} />
    </Stack.Navigator>
  );
}
