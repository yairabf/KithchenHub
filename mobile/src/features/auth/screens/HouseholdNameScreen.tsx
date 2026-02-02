import React, { useState, useEffect } from 'react';
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
import { colors, spacing, borderRadius, typography } from '../../../theme';
import { householdApi } from '../../households/services/householdApi';
import { authApi } from '../../auth/services/authApi';
import { useAuth } from '../../../contexts/AuthContext';

type AuthStackParamList = {
  Login: undefined;
  EnterInviteCode: undefined;
  HouseholdName: undefined;
};

type HouseholdNameScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'HouseholdName'
>;

interface HouseholdNameScreenProps {
  navigation: HouseholdNameScreenNavigationProp;
}

/**
 * Screen for naming a newly created household.
 * 
 * Shown only when isNewHousehold=true after OAuth sign-in.
 * Pre-filled with the backend-generated default name.
 * 
 * User can:
 * - Edit the name
 * - Save (validates min 2, max 40 chars)
 * - Skip (if name unchanged)
 */
export function HouseholdNameScreen({ navigation }: HouseholdNameScreenProps) {
  const { user, setShowHouseholdNameScreen } = useAuth();
  const [name, setName] = useState('');
  const [originalName, setOriginalName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch current household name from backend
    const fetchHouseholdName = async () => {
      if (user?.householdId) {
        try {
          const userData = await authApi.getCurrentUser();
          const householdName = userData.household?.name || 'My family';
          setName(householdName);
          setOriginalName(householdName);
        } catch (error) {
          console.error('Error fetching household name:', error);
          // Fallback to default
          const defaultName = 'My family';
          setName(defaultName);
          setOriginalName(defaultName);
        }
      }
    };

    fetchHouseholdName();
  }, [user]);

  /**
   * Validates and saves the household name
   */
  const handleSave = async () => {
    const trimmedName = name.trim();

    // Validation
    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    if (trimmedName.length > 40) {
      setError('Name must be less than 40 characters');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await householdApi.updateHousehold(trimmedName);
      // Clear the flag to allow RootNavigator to switch to MainNavigator
      setShowHouseholdNameScreen(false);
      // RootNavigator will automatically show MainNavigator since user is set and flag is cleared
    } catch (err) {
      setError('Failed to save household name. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Skips naming if the name hasn't changed
   */
  const handleSkip = () => {
    // Clear the flag to allow RootNavigator to switch to MainNavigator
    setShowHouseholdNameScreen(false);
    // RootNavigator will automatically show MainNavigator since user is set and flag is cleared
  };

  const hasChanges = name.trim() !== originalName;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Name your household</Text>
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="home-outline" size={64} color={colors.primary} />
            </View>

            <Text style={styles.subtitle}>
              Give your household a name so everyone knows they're in the right place
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setError(null);
                }}
                placeholder="My family"
                placeholderTextColor={colors.textSecondary}
                autoFocus
                editable={!isSaving}
                maxLength={40}
              />
              {error && <Text style={styles.errorText}>{error}</Text>}
              <Text style={styles.characterCount}>
                {name.length}/40 characters
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton, isSaving && styles.buttonDisabled]}
              onPress={handleSave}
              activeOpacity={0.7}
              disabled={isSaving || !name.trim()}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.primaryButtonText}>Save</Text>
              )}
            </TouchableOpacity>

            {!hasChanges && (
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
                activeOpacity={0.7}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              You can change this name later in settings
            </Text>
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
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.text,
    textAlign: 'center',
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
    ...typography.h3,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    textAlign: 'center',
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  characterCount: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'right',
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
  skipButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
  skipButtonText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  footer: {
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
