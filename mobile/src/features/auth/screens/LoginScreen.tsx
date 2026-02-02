import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useAuth } from '../../../contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../../../theme';
import { GuestDataImportModal } from '../components/GuestDataImportModal';

type AuthStackParamList = {
  Login: undefined;
  EnterInviteCode: undefined;
  HouseholdName: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

export function LoginScreen({ navigation }: LoginScreenProps) {
  const { signInWithGoogle, showGuestImportPrompt, resolveGuestImport, showHouseholdNameScreen } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Navigate to HouseholdName screen if flag is set (after OAuth callback with new household)
  useEffect(() => {
    if (showHouseholdNameScreen) {
      navigation.navigate('HouseholdName');
    }
  }, [showHouseholdNameScreen, navigation]);

  /**
   * Handles Google sign-in button press.
   * Navigation to HouseholdName screen is handled by useEffect watching showHouseholdNameScreen flag.
   */
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // Navigation to HouseholdName screen is handled by useEffect watching showHouseholdNameScreen
      // RootNavigator will automatically show MainNavigator if user is set and flag is not set
    } catch (error) {
      Alert.alert(
        'Sign In Failed',
        error instanceof Error
          ? error.message
          : 'Unable to sign in with Google. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinHousehold = () => {
    navigation.navigate('EnterInviteCode');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo & Branding */}
        <View style={styles.brandingContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🍳</Text>
          </View>
          <Text style={styles.appName}>Kitchen Hub</Text>
          <Text style={styles.tagline}>Your family's kitchen assistant</Text>
        </View>

        {/* Sign In Buttons */}
        <View style={styles.buttonContainer}>
          <GoogleSignInButton onPress={handleGoogleSignIn} isLoading={isLoading} />

          <TouchableOpacity
            style={styles.joinButton}
            onPress={handleJoinHousehold}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <Ionicons name="people-outline" size={20} color={colors.secondary} style={styles.joinButtonIcon} />
            <Text style={styles.joinButtonText}>Join household</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing in, you agree to our{' '}
            <Text style={styles.footerLink}>Terms of Service</Text>
            {' & '}
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </Text>
        </View>
      </View>

      <GuestDataImportModal
        visible={showGuestImportPrompt}
        onImport={() => resolveGuestImport(true)}
        onSkip={() => resolveGuestImport(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    paddingVertical: spacing.xxl,
  },
  brandingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: spacing.lg,
  },
  logoEmoji: {
    fontSize: 60,
  },
  appName: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  joinButtonIcon: {
    marginRight: spacing.sm,
  },
  joinButtonText: {
    ...typography.button,
    color: colors.secondary,
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footerLink: {
    color: colors.secondary,
    textDecorationLine: 'underline',
  },
});
