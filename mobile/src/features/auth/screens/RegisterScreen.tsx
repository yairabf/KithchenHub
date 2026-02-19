import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../../../theme';
import { boxShadow } from '../../../theme/shadows';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  EnterInviteCode: undefined;
  HouseholdName: undefined;
};

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { signUpWithEmail, signInWithEmail } = useAuth();
  const { t } = useTranslation('auth');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) {
      return { valid: false, message: t('register.errors.passwordMinLength') };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: t('register.errors.passwordUppercase') };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: t('register.errors.passwordLowercase') };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: t('register.errors.passwordNumber') };
    }
    return { valid: true };
  };

  const validateForm = (): string | null => {
    if (!name.trim()) return t('register.errors.nameRequired');
    if (!email.trim()) return t('register.errors.emailRequired');
    if (!validateEmail(email)) return t('register.errors.invalidEmail');

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) return passwordCheck.message!;

    if (password !== confirmPassword) return t('register.errors.passwordMismatch');
    return null;
  };

  /**
   * Handles user registration flow.
   *
   * Flow:
   * 1. Validates form inputs (email, password, name)
   * 2. Calls backend /auth/register endpoint
   * 3. Shows success message with verification instructions
   * 4. Navigates back to login screen
   *
   * Note: Backend requires email verification before login can succeed.
   * User must verify email via link before they can sign in.
   *
   * @throws {Error} If registration fails
   */
  const handleRegister = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert(t('register.errors.validationError'), error, [{ text: t('buttons.ok', { ns: 'common' }) }]);
      return;
    }

    setIsLoading(true);
    try {
      // Register the user
      await signUpWithEmail(email, password, name);

      // Show success message with verification instructions
      Alert.alert(
        t('register.accountCreated'),
        t('register.verifyEmailMessage'),
        [
          {
            text: t('buttons.ok', { ns: 'common' }),
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        t('register.registrationFailed'),
        error instanceof Error
          ? error.message
          : t('register.unableToCreate'),
        [{ text: t('buttons.ok', { ns: 'common' }) }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityLabel={t('register.goBack')}
              accessibilityRole="button"
            >
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Glass Card */}
          <View style={styles.glassCard}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{t('register.title')}</Text>
              <Text style={styles.subtitle}>{t('register.subtitle')}</Text>
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              {/* Name Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('register.name')}</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder={t('register.namePlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="words"
                  editable={!isLoading}
                  accessibilityLabel={t('register.name')}
                  accessibilityHint="Enter your full name"
                />
              </View>

              {/* Email Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('register.email')}</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('register.emailPlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  accessibilityLabel={t('register.email')}
                  accessibilityHint="Enter your email address"
                />
              </View>

              {/* Password Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('register.password')}</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    accessibilityLabel={t('register.password')}
                    accessibilityHint="Enter your password, at least 6 characters"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                    accessibilityLabel={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Field */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>{t('register.confirmPassword')}</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    accessibilityLabel="Confirm password"
                    accessibilityHint="Re-enter your password"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    accessibilityLabel={showConfirmPassword ? t('login.hidePassword') : t('login.showPassword')}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.registerButton, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
                accessibilityLabel={t('register.createAccount')}
                accessibilityRole="button"
              >
                <Text style={styles.registerButtonText}>
                  {isLoading ? t('register.creatingAccount') : t('register.createAccount')}
                </Text>
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>{t('register.alreadyHaveAccount')}</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  disabled={isLoading}
                  accessibilityLabel={t('register.signIn')}
                  accessibilityRole="button"
                >
                  <Text style={styles.loginLink}>{t('register.signIn')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F0',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...boxShadow(2, 4, 'rgba(0, 0, 0, 0.1)'),
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderRadius: borderRadius.xxl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...boxShadow(10, 20, 'rgba(0, 0, 0, 0.1)'),
  },
  titleContainer: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.xs,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 16,
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.caption,
    color: colors.text,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'rgba(96, 108, 56, 0.2)',
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
    borderColor: 'rgba(96, 108, 56, 0.2)',
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
  registerButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    ...boxShadow(4, 8, 'rgba(96, 108, 56, 0.3)'),
  },
  registerButtonText: {
    ...typography.button,
    color: colors.surface,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  loginText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  loginLink: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
});
