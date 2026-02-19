/**
 * EnterInviteCodeScreen: join-by-invite flow.
 *
 * Input: user-entered invite code. Validates via GET /invite/validate; on success
 * shows household preview and "Continue with Google". On Google sign-in, passes
 * householdId to auth so user is attached to that household. Part of auth stack.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../../navigation/AuthStackNavigator';
import { colors, spacing, typography } from '../../../theme';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useGoogleIdToken } from '../../auth/hooks/useGoogleIdToken';
import { validateInviteCode } from '../../../services/inviteApi';
import { GoogleSignInButton } from '../../auth/components/GoogleSignInButton';

type EnterInviteCodeNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'EnterInviteCode'
>;

export function EnterInviteCodeScreen() {
  const navigation = useNavigation<EnterInviteCodeNavigationProp>();
  const { setInvite, invite } = useOnboarding();
  const { signInWithGoogle } = useAuth();
  const { getGoogleIdToken, isReady, isClientIdMissing } = useGoogleIdToken();
  const [code, setCode] = useState('');
  const [validateError, setValidateError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleContinue = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setValidateError('Please enter an invite code');
      return;
    }
    setValidateError(null);
    setIsValidating(true);
    try {
      const result = await validateInviteCode(trimmed);
      setInvite({
        code: trimmed,
        householdId: result.householdId,
        householdName: result.householdName,
      });
    } catch (error) {
      setValidateError(
        error instanceof Error ? error.message : 'Invalid or expired code'
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleContinueWithGoogle = async () => {
    if (!invite) return;
    if (!isReady) {
      Alert.alert(
        'Sign In',
        isClientIdMissing
          ? 'Google sign-in is not configured (EXPO_PUBLIC_GOOGLE_CLIENT_ID is missing).'
          : 'Sign-in is still preparing. Please try again in a moment.',
        [{ text: 'OK' }]
      );
      return;
    }
    setIsSigningIn(true);
    setValidateError(null);
    try {
      const idToken = await getGoogleIdToken();
      if (!idToken) {
        Alert.alert(
          'Sign In',
          'Sign-in was cancelled or is not available. On web, set EXPO_PUBLIC_GOOGLE_CLIENT_ID and add the redirect URL to your Google Cloud OAuth client.',
          [{ text: 'OK' }]
        );
        return;
      }
      await signInWithGoogle({
        idToken,
        householdId: invite.householdId,
      });
    } catch (error) {
      setValidateError(
        error instanceof Error ? error.message : 'Sign in failed. Please try again.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const showHouseholdPreview = invite != null;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            {!showHouseholdPreview ? (
              <>
                <View style={styles.header}>
                  <Text style={styles.title}>Join a household</Text>
                  <Text style={styles.subtitle}>
                    Enter the invite code shared by a household member.
                  </Text>
                </View>
                <View style={styles.form}>
                  <TextInput
                    style={[styles.input, validateError ? styles.inputError : null]}
                    placeholder="Invite code"
                    placeholderTextColor={colors.textMuted}
                    value={code}
                    onChangeText={(text) => {
                      setCode(text);
                      setValidateError(null);
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isValidating}
                  />
                  {validateError ? (
                    <Text style={styles.errorText}>{validateError}</Text>
                  ) : null}
                  <TouchableOpacity
                    style={[
                      styles.button,
                      (!code.trim() || isValidating) && styles.buttonDisabled,
                    ]}
                    onPress={handleContinue}
                    disabled={!code.trim() || isValidating}
                  >
                    {isValidating ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Continue</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.header}>
                  <Text style={styles.title}>You're joining</Text>
                  <Text style={styles.householdName}>{invite.householdName}</Text>
                  <Text style={styles.subtitle}>
                    Sign in with Google to join this household.
                  </Text>
                </View>
                {validateError ? (
                  <Text style={styles.errorText}>{validateError}</Text>
                ) : null}
                <GoogleSignInButton
                  onPress={handleContinueWithGoogle}
                  isLoading={isSigningIn}
                  disabled={!isReady}
                />
              </>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  householdName: {
    ...typography.h1,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  form: {
    marginTop: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.7,
  },
  buttonText: {
    ...typography.button,
    color: '#fff',
  },
});
