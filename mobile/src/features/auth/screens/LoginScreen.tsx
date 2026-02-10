import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useAuth } from '../../../contexts/AuthContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { colors, spacing, borderRadius, typography } from '../../../theme';
import { boxShadow } from '../../../theme/shadows';

type AuthStackParamList = {
  Login: undefined;
  EnterInviteCode: undefined;
  HouseholdName: undefined;
  HouseholdOnboarding: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

export function LoginScreen({ navigation }: LoginScreenProps) {
  const { signInWithGoogle, showHouseholdNameScreen } = useAuth();
  const { mode, inviteContext, setMode, setInviteContext } = useOnboarding();
  const [isLoading, setIsLoading] = useState(false);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;
  const orbAnim1 = React.useRef(new Animated.Value(0)).current;
  const orbAnim2 = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Loop floating animations for background orbs
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbAnim1, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(orbAnim1, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orbAnim2, {
          toValue: 1,
          duration: 5000,
          useNativeDriver: true,
        }),
        Animated.timing(orbAnim2, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

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
      if (mode === 'join_by_invite') {
        if (!inviteContext?.householdId || !inviteContext.code) {
          Alert.alert(
            'Invite Missing',
            'Please enter a valid invite code to join a household.',
            [{ text: 'OK' }]
          );
          return;
        }
        await signInWithGoogle({
          householdId: inviteContext.householdId,
          inviteCode: inviteContext.code,
        });
      } else {
        await signInWithGoogle();
      }
      if (mode === 'join_by_invite') {
        setMode('login_or_signup');
        setInviteContext(undefined);
      }
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

  const handleChangeInvite = () => {
    setMode('login_or_signup');
    setInviteContext(undefined);
    navigation.navigate('EnterInviteCode');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Decorative Background Orbs */}
      <Animated.View
        style={[
          styles.orb,
          styles.orb1,
          {
            opacity: orbAnim1.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.6] }),
            transform: [{ translateY: orbAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }]
          }
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          styles.orb2,
          {
            opacity: orbAnim2.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.5] }),
            transform: [{ scale: orbAnim2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }]
          }
        ]}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Glassmorphic Card Container */}
        <View style={styles.glassCard}>
          {/* Logo & Branding */}
          <View style={styles.brandingContainer}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🍳</Text>
            </View>
            <Text style={styles.appName}>Kitchen Hub</Text>
            <Text style={styles.tagline}>Your family's kitchen assistant</Text>
            {mode === 'join_by_invite' && inviteContext?.householdName ? (
              <View style={styles.joiningBadge}>
                <Ionicons name="people" size={14} color={colors.primary} />
                <Text style={styles.joiningText}>
                  Joining {inviteContext.householdName}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Sign In Buttons */}
          <View style={styles.buttonContainer}>
            <GoogleSignInButton onPress={handleGoogleSignIn} isLoading={isLoading} />

            {mode === 'join_by_invite' ? (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={handleChangeInvite}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Ionicons name="refresh-outline" size={20} color={colors.secondary} style={styles.joinButtonIcon} />
                <Text style={styles.joinButtonText}>Change invite code</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={handleJoinHousehold}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Ionicons name="people-outline" size={20} color={colors.secondary} style={styles.joinButtonIcon} />
                <Text style={styles.joinButtonText}>Join household</Text>
              </TouchableOpacity>
            )}
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
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0', // Match theme Warm Cream
  },
  orb: {
    position: 'absolute',
    borderRadius: 1000,
  },
  orb1: {
    width: 300,
    height: 300,
    backgroundColor: colors.primary,
    top: -50,
    right: -50,
  },
  orb2: {
    width: 250,
    height: 250,
    backgroundColor: colors.primaryLight,
    bottom: 50,
    left: -50,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...boxShadow(10, 20, 'rgba(0, 0, 0, 0.1)'),
    alignItems: 'center',
  },
  brandingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...boxShadow(4, 12, 'rgba(0, 0, 0, 0.1)'),
    marginBottom: spacing.lg,
  },
  logoEmoji: {
    fontSize: 50,
  },
  appName: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.xs,
    fontSize: 32,
    fontWeight: '800',
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  joiningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pastel.green,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  joiningText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(96, 108, 56, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  joinButtonIcon: {
    marginRight: spacing.sm,
  },
  joinButtonText: {
    ...typography.button,
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    opacity: 0.6,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
