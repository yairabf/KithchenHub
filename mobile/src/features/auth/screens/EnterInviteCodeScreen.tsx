import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius, typography } from '../../../theme';
import { inviteApi, InviteValidationResponse } from '../../households/services/inviteApi';
import { useOnboarding } from '../contexts/OnboardingContext';

type AuthStackParamList = {
  Login: undefined;
  EnterInviteCode: undefined;
  HouseholdName: undefined;
};

type EnterInviteCodeScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'EnterInviteCode'
>;

interface EnterInviteCodeScreenProps {
  navigation: EnterInviteCodeScreenNavigationProp;
}

/**
 * Screen for entering and validating an invite code to join an existing household.
 * 
 * Flow:
 * 1. User enters invite code
 * 2. User taps "Continue" to validate
 * 3. If valid, shows household preview and "Continue with Google" button
 * 4. User signs in with Google, joining the household
 */
export function EnterInviteCodeScreen({ navigation }: EnterInviteCodeScreenProps) {
  const { t } = useTranslation('auth');
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<InviteValidationResponse | null>(null);

  const { setMode, setInviteContext } = useOnboarding();

  /**
   * Validates the invite code with the backend
   */
  const handleValidate = async () => {
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError(t('inviteCode.errors.enterCode'));
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const data = await inviteApi.validateInviteCode(trimmedCode);
      setInviteData(data);
      setMode('join_by_invite');
      setInviteContext({
        code: trimmedCode,
        householdId: data.householdId,
        householdName: data.householdName,
      });
      navigation.navigate('Login');
    } catch (err) {
      setError(t('inviteCode.errors.invalidCode'));
      setInviteData(null);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              accessibilityLabel={t('inviteCode.goBack')}
              accessibilityRole="button"
              accessibilityHint={t('inviteCode.goBackHint')}
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>{t('inviteCode.title')}</Text>
            <View style={styles.backButton} />
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            {!inviteData ? (
              // Code entry view
              <>
                <View style={styles.iconContainer}>
                  <Ionicons name="people-outline" size={64} color={colors.primary} />
                </View>

                <Text style={styles.subtitle}>
                  {t('inviteCode.subtitle')}
                </Text>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    value={code}
                    onChangeText={(text) => {
                      setCode(text);
                      setError(null);
                    }}
                    placeholder={t('inviteCode.inputPlaceholder')}
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    autoFocus
                    editable={!isValidating}
                    accessibilityLabel={t('inviteCode.inviteCodeLabel')}
                    accessibilityHint={t('inviteCode.inviteCodeHint')}
                  />
                  {error && <Text style={styles.errorText}>{error}</Text>}
                </View>

                <TouchableOpacity
                  style={[styles.button, styles.primaryButton, isValidating && styles.buttonDisabled]}
                  onPress={handleValidate}
                  activeOpacity={0.7}
                  disabled={isValidating}
                  accessibilityLabel={t('inviteCode.continue')}
                  accessibilityRole="button"
                  accessibilityHint={t('inviteCode.continueHint')}
                >
                  {isValidating ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <Text style={styles.primaryButtonText}>{t('inviteCode.continue')}</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              // Household preview view
              <>
                <View style={styles.iconContainer}>
                  <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                </View>

                <Text style={styles.subtitle}>{t('inviteCode.youreJoining')}</Text>

                <View style={styles.householdPreviewContainer}>
                  <Text style={styles.householdName}>{inviteData.householdName}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={() => navigation.navigate('Login')}
                  activeOpacity={0.7}
                  accessibilityLabel={t('inviteCode.continueToSignIn')}
                  accessibilityRole="button"
                  accessibilityHint={t('inviteCode.continueToSignInHint')}
                >
                  <Text style={styles.primaryButtonText}>{t('inviteCode.continueToSignIn')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.changeCodeButton}
                  onPress={() => {
                    setInviteData(null);
                    setCode('');
                    setError(null);
                  }}
                  activeOpacity={0.7}
                  accessibilityLabel={t('inviteCode.changeCode')}
                  accessibilityRole="button"
                  accessibilityHint={t('inviteCode.changeCodeHint')}
                >
                  <Text style={styles.changeCodeText}>{t('inviteCode.changeCode')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
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
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.xxl,
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 400,
    marginBottom: spacing.lg,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    textAlign: 'center',
    fontSize: 18,
    letterSpacing: 2,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    maxWidth: 400,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.surface,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  householdPreviewContainer: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  householdName: {
    ...typography.h2,
    color: colors.primary,
    textAlign: 'center',
  },
  changeCodeButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  changeCodeText: {
    ...typography.button,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
