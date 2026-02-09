import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { EnterInviteCodeScreen } from '../features/auth/screens/EnterInviteCodeScreen';
import { HouseholdNameScreen } from '../features/auth/screens/HouseholdNameScreen';
import { HouseholdOnboardingScreen } from '../features/onboarding/screens/HouseholdOnboardingScreen';

export type AuthStackParamList = {
  Login: undefined;
  EnterInviteCode: undefined;
  HouseholdName: undefined;
  HouseholdOnboarding: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStackNavigator() {
  const { user, showHouseholdNameScreen } = useAuth();

  // Determine initial route based on user state
  let initialRoute: keyof AuthStackParamList = 'Login';
  if (user) {
    if (showHouseholdNameScreen) {
      initialRoute = 'HouseholdName';
    } else if (!user.householdId) {
      initialRoute = 'HouseholdOnboarding';
    }
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="EnterInviteCode" component={EnterInviteCodeScreen} />
      <Stack.Screen name="HouseholdName" component={HouseholdNameScreen} />
      <Stack.Screen name="HouseholdOnboarding" component={HouseholdOnboardingScreen} />
    </Stack.Navigator>
  );
}
