import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { EnterInviteCodeScreen } from '../features/auth/screens/EnterInviteCodeScreen';
import { HouseholdNameScreen } from '../features/auth/screens/HouseholdNameScreen';

export type AuthStackParamList = {
  Login: undefined;
  EnterInviteCode: undefined;
  HouseholdName: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="EnterInviteCode" component={EnterInviteCodeScreen} />
      <Stack.Screen name="HouseholdName" component={HouseholdNameScreen} />
    </Stack.Navigator>
  );
}
