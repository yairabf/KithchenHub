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
  TextInput,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useAuth } from '../../../contexts/AuthContext';
import { useOnboarding } from '../contexts/OnboardingContext';
import { colors, spacing, borderRadius, typography } from '../../../theme';
import { boxShadow } from '../../../theme/shadows';
import { useReducedMotion } from '../../../common/hooks/useReducedMotion';
import { useTranslation } from 'react-i18next';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  EnterInviteCode: undefined;
  HouseholdName: undefined;
  HouseholdOnboarding: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

export function LoginScreen({ navigation }: LoginScreenProps) {
  const { t } = useTranslation('auth');
  const { signInWithGoogle, signInWithEmail, showHouseholdNameScreen } = useAuth();
  const { mode, inviteContext, setMode, setInviteContext } = useOnboarding();
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const reduceMotion = useReducedMotion();

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const slideAnim = React.useRef(new Animated.Value(reduceMotion ? 0 : 20)).current;
  const orbAnim1 = React.useRef(new Animated.Value(0)).current;
  const orbAnim2 = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Only animate if motion is not reduced
    if (!reduceMotion) {
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
    }
  }, [reduceMotion]);

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
            t('login.inviteMissingTitle'),
            t('login.inviteMissingMessage'),
            [{ text: t('buttons.ok', { ns: 'common' }) }]
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
        t('login.signInFailed'),
        error instanceof Error
          ? error.message
          : t('login.unableToSignInGoogle'),
        [{ text: t('buttons.ok', { ns: 'common' }) }]
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

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(t('login.validationError'), t('login.enterEmailAndPassword'), [{ text: t('buttons.ok', { ns: 'common' }) }]);
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmail(email, password);
      // Navigation handled by RootNavigator based on user state
    } catch (error) {
      Alert.alert(
        t('login.signInFailed'),
        error instanceof Error
          ? error.message
          : t('login.unableToSignIn'),
        [{ text: t('buttons.ok', { ns: 'common' }) }]
      );
    } finally {
      setIsLoading(false);
    }
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
              <Image
                source={require('../../../../assets/fullhouse_icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
                accessibilityLabel="FullHouse icon"
              />
            </View>
            <Text style={styles.appName}>{t('login.appName')}</Text>
            <Text style={styles.tagline}>{t('login.tagline')}</Text>
            {mode === 'join_by_invite' && inviteContext?.householdName ? (
              <View style={styles.joiningBadge}>
                <Ionicons name="people" size={14} color={colors.primary} />
                <Text style={styles.joiningText}>
                  {t('login.joiningPrefix')} {inviteContext.householdName}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Sign In Buttons */}
          <View style={styles.buttonContainer}>
            <GoogleSignInButton onPress={handleGoogleSignIn} isLoading={isLoading} />

            {/* Email/Password Login Section */}
            {!showEmailLogin ? (
              <TouchableOpacity
                style={styles.emailLoginToggle}
                onPress={() => setShowEmailLogin(true)}
                activeOpacity={0.7}
                disabled={isLoading}
                accessibilityLabel={t('login.signInWithEmail')}
                accessibilityRole="button"
              >
                <Ionicons name="mail-outline" size={20} color={colors.primary} style={styles.emailLoginToggleIcon} />
                <Text style={styles.emailLoginToggleText}>{t('login.signInWithEmail')}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.emailLoginForm}>
                <TextInput
                  style={styles.emailInput}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('login.emailPlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  accessibilityLabel={t('login.emailPlaceholder')}
                />
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t('login.passwordPlaceholder')}
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    accessibilityLabel={t('login.passwordPlaceholder')}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    accessibilityLabel={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.emailLoginButton, isLoading && styles.buttonDisabled]}
                  onPress={handleEmailLogin}
                  disabled={isLoading}
                  accessibilityLabel={t('login.signIn')}
                  accessibilityRole="button"
                >
                  <Text style={styles.emailLoginButtonText}>
                    {isLoading ? t('login.signingIn') : t('login.signIn')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelEmailLogin}
                  onPress={() => {
                    setShowEmailLogin(false);
                    setEmail('');
                    setPassword('');
                  }}
                  disabled={isLoading}
                  accessibilityLabel={t('login.cancel')}
                  accessibilityRole="button"
                >
                  <Text style={styles.cancelEmailLoginText}>{t('login.cancel')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Create Account Button */}
            <TouchableOpacity
              style={styles.createAccountButton}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}
              disabled={isLoading}
              accessibilityLabel={t('login.createAccount')}
              accessibilityRole="button"
              accessibilityHint={t('login.createAccountHint')}
            >
              <Ionicons name="person-add-outline" size={20} color={colors.surface} style={styles.createAccountButtonIcon} />
              <Text style={styles.createAccountButtonText}>{t('login.createAccount')}</Text>
            </TouchableOpacity>

            {mode === 'join_by_invite' ? (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={handleChangeInvite}
                activeOpacity={0.7}
                disabled={isLoading}
                accessibilityLabel={t('login.changeInviteCode')}
                accessibilityRole="button"
                accessibilityHint={t('login.changeInviteCodeHint')}
              >
                <Ionicons name="refresh-outline" size={20} color={colors.secondary} style={styles.joinButtonIcon} />
                <Text style={styles.joinButtonText}>{t('login.changeInviteCode')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.joinButton}
                onPress={handleJoinHousehold}
                activeOpacity={0.7}
                disabled={isLoading}
                accessibilityLabel={t('login.joinHousehold')}
                accessibilityRole="button"
                accessibilityHint={t('login.joinHouseholdHint')}
              >
                <Ionicons name="people-outline" size={20} color={colors.secondary} style={styles.joinButtonIcon} />
                <Text style={styles.joinButtonText}>{t('login.joinHousehold')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('login.agreePrefix')}{' '}
              <Text style={styles.footerLink}>{t('login.termsOfService')}</Text>
              {' & '}
              <Text style={styles.footerLink}>{t('login.privacyPolicy')}</Text>
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
    backgroundColor: colors.background,
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
    marginTop: spacing.lg,
    marginBottom: spacing.xxl,
  },
  logoContainer: {
    width: 300,
    height: 300,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...boxShadow(4, 12, 'rgba(0, 0, 0, 0.1)'),
    marginBottom: spacing.lg,
  },
  logoImage: {
    width: '100%',
    height: '100%',
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
  emailLoginToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(35, 76, 106, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  emailLoginToggleIcon: {
    marginEnd: spacing.sm,
  },
  emailLoginToggleText: {
    ...typography.button,
    color: colors.primary,
    fontWeight: '600',
  },
  emailLoginForm: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  emailInput: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'rgba(35, 76, 106, 0.2)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'rgba(35, 76, 106, 0.2)',
    borderRadius: borderRadius.md,
  },
  passwordInput: {
    ...typography.body,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
  },
  eyeButton: {
    paddingHorizontal: spacing.md,
  },
  emailLoginButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
    ...boxShadow(4, 8, 'rgba(35, 76, 106, 0.3)'),
  },
  emailLoginButtonText: {
    ...typography.button,
    color: colors.surface,
    fontWeight: '700',
  },
  cancelEmailLogin: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelEmailLoginText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
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
    borderColor: 'rgba(35, 76, 106, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  joinButtonIcon: {
    marginEnd: spacing.sm,
  },
  joinButtonText: {
    ...typography.button,
    color: colors.primary,
    fontWeight: '600',
  },
  createAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.secondary,
    ...boxShadow(4, 8, 'rgba(35, 76, 106, 0.3)'),
  },
  createAccountButtonIcon: {
    marginEnd: spacing.sm,
  },
  createAccountButtonText: {
    ...typography.button,
    color: colors.surface,
    fontWeight: '700',
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
