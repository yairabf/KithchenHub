/**
 * HouseholdNameScreen: rename new household after sign-up.
 *
 * Shown when backend returns isNewHousehold. Input: current household name (from
 * route or pendingAuth). User can edit and Save (PUT /household) or Skip. On
 * complete, calls completeSignInWithPendingUser and navigates to Home. Part of auth stack.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { AuthStackParamList } from '../../../navigation/AuthStackNavigator';
import { colors, spacing, typography } from '../../../theme';
import { useAuth } from '../../../contexts/AuthContext';
import { updateHousehold } from '../../../services/householdApi';

const MIN_LENGTH = 2;
const MAX_LENGTH = 40;

type HouseholdNameRouteProp = RouteProp<
  AuthStackParamList,
  'HouseholdName'
>;

export function HouseholdNameScreen() {
  const navigation = useNavigation();
  const route = useRoute<HouseholdNameRouteProp>();
  const { pendingAuth, completeSignInWithPendingUser } = useAuth();
  const initialName = route.params?.householdName ?? pendingAuth?.authResponse.household?.name ?? 'My family';
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialName) {
      setName(initialName);
    }
  }, [initialName]);

  const trimmedName = name.trim();
  const isValid = trimmedName.length >= MIN_LENGTH && trimmedName.length <= MAX_LENGTH;
  const hasChanged = trimmedName !== (pendingAuth?.authResponse.household?.name ?? initialName);

  const handleSave = async () => {
    if (!isValid) {
      if (trimmedName.length < MIN_LENGTH) {
        setError(`Name must be at least ${MIN_LENGTH} characters`);
      } else if (trimmedName.length > MAX_LENGTH) {
        setError(`Name must be at most ${MAX_LENGTH} characters`);
      }
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      if (hasChanged) {
        await updateHousehold(trimmedName);
      }
      completeSignInWithPendingUser();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const canSkip = !hasChanged;
  const handleSkip = () => {
    completeSignInWithPendingUser();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Name your household</Text>
              <Text style={styles.subtitle}>
                Give your shared space a name. You can change this later.
              </Text>
            </View>
            <View style={styles.form}>
              <TextInput
                style={[styles.input, error ? styles.inputError : null]}
                placeholder="e.g. The Smiths, Cozy Cottage"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setError(null);
                }}
                autoCapitalize="words"
                maxLength={MAX_LENGTH}
                editable={!isSaving}
              />
              <Text style={styles.helperText}>
                {trimmedName.length}/{MAX_LENGTH} (min {MIN_LENGTH})
              </Text>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity
                style={[
                  styles.button,
                  (!isValid || isSaving) && styles.buttonDisabled,
                ]}
                onPress={handleSave}
                disabled={!isValid || isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Save</Text>
                )}
              </TouchableOpacity>
              {canSkip && (
                <TouchableOpacity
                  style={styles.skipButton}
                  onPress={handleSkip}
                  disabled={isSaving}
                >
                  <Text style={styles.skipButtonText}>Skip for now</Text>
                </TouchableOpacity>
              )}
            </View>
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
    marginBottom: spacing.xs,
  },
  inputError: {
    borderColor: colors.error,
  },
  helperText: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
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
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  skipButtonText: {
    ...typography.button,
    color: colors.secondary,
  },
});
