import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import { colors, spacing, borderRadius, typography, shadows } from '../../../theme';
import { ScreenHeader } from '../../../common/components/ScreenHeader';
import { ManageHouseholdModal } from '../components/ManageHouseholdModal';
import { LanguageSelectorModal } from '../components/LanguageSelectorModal';
import { CenteredModal } from '../../../common/components/CenteredModal';
import { ImportDataModal } from '../components/ImportDataModal';
import { Toast } from '../../../common/components/Toast';
import { i18n } from '../../../i18n';
import { normalizeLocale } from '../../../i18n/localeNormalization';
import { getNativeNameForCode } from '../../../i18n/constants';
import { getDirectionalIcon } from '../../../common/utils/rtlIcons';

export function SettingsScreen() {
  const { t } = useTranslation('settings');
  const { user, signOut, signInWithGoogle, hasGuestData, importGuestData, clearGuestData } = useAuth();
  const [pushNotifications, setPushNotifications] = React.useState(true);
  const [dailySummary, setDailySummary] = React.useState(false);
  const [cloudSync, setCloudSync] = React.useState(true);
  const [showLanguageSelector, setShowLanguageSelector] = React.useState(false);
  const [showManageHousehold, setShowManageHousehold] = React.useState(false);
  const [showImportData, setShowImportData] = React.useState(false);
  const [showClearDataConfirm, setShowClearDataConfirm] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [toastType, setToastType] = React.useState<'success' | 'error'>('success');

  const currentLanguageCode = normalizeLocale(i18n.language ?? '');
  const currentLanguageDisplayName = getNativeNameForCode(currentLanguageCode);

  const handleImportGuestData = () => {
    setShowImportData(true);
  };

  const handleClearGuestData = async () => {
    setShowClearDataConfirm(false);
    try {
      await clearGuestData();
      setToastType('success');
      setToastMessage('Guest data deleted');
    } catch (error) {
      setToastType('error');
      setToastMessage('Failed to delete guest data. Please try again.');
    }
  };


  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('title')} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowLanguageSelector(true)}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="language-outline" size={22} color={colors.textPrimary} />
              <Text style={styles.settingLabel}>{t('language')}</Text>
            </View>
            <Text style={styles.settingValue}>{currentLanguageDisplayName}</Text>
            <Ionicons name={getDirectionalIcon('chevron-forward')} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={32} color={colors.textSecondary} />
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name || 'Guest'}</Text>
              {user?.email ? (
                <Text style={styles.profileEmail}>{user.email}</Text>
              ) : null}
              <Text style={styles.profileProvider}>
                {user?.isGuest ? 'Guest Mode' : 'Connected via Google'}
              </Text>
            </View>
          </View>

          {user?.isGuest && (
            <TouchableOpacity style={styles.signInPrompt} onPress={signInWithGoogle}>
              <Ionicons name="logo-google" size={20} color={colors.google} />
              <Text style={styles.signInPromptText}>Sign in to sync your data</Text>
              <Ionicons name={getDirectionalIcon('chevron-forward')} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
              <Text style={styles.settingLabel}>Push notifications</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: colors.border, true: colors.chores }}
              thumbColor={colors.surface}
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="mail-outline" size={22} color={colors.textPrimary} />
              <Text style={styles.settingLabel}>Daily summary email</Text>
            </View>
            <Switch
              value={dailySummary}
              onValueChange={setDailySummary}
              trackColor={{ false: colors.border, true: colors.chores }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        {/* Household Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Household</Text>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowManageHousehold(true)}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="people-outline" size={22} color={colors.textPrimary} />
              <Text style={styles.settingLabel}>Manage household members</Text>
            </View>
            <Ionicons name={getDirectionalIcon('chevron-forward')} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Guest Data Section - Only visible if hasGuestData AND Signed In */}
        {!user?.isGuest && hasGuestData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Guest Data</Text>
            <TouchableOpacity style={styles.settingRow} onPress={handleImportGuestData}>
              <View style={styles.settingInfo}>
                <Ionicons name="cloud-upload-outline" size={22} color={colors.primary} />
                <Text style={styles.settingLabel}>Import local guest data</Text>
              </View>
              <Ionicons name={getDirectionalIcon('chevron-forward')} size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setShowClearDataConfirm(true)}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="trash-outline" size={22} color={colors.error} />
                <Text style={[styles.settingLabel, { color: colors.error }]}>Delete local guest data</Text>
              </View>
              <Ionicons name={getDirectionalIcon('chevron-forward')} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="cloud-outline" size={22} color={colors.textPrimary} />
              <Text style={styles.settingLabel}>Sync to cloud</Text>
            </View>
            <Switch
              value={cloudSync}
              onValueChange={setCloudSync}
              trackColor={{ false: colors.border, true: colors.chores }}
              thumbColor={colors.surface}
              disabled={user?.isGuest}
            />
          </View>
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="download-outline" size={22} color={colors.textPrimary} />
              <Text style={styles.settingLabel}>Export my data</Text>
            </View>
            <Ionicons name={getDirectionalIcon('chevron-forward')} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
              <Text style={[styles.settingLabel, { color: colors.error }]}>Delete account</Text>
            </View>
            <Ionicons name={getDirectionalIcon('chevron-forward')} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="document-text-outline" size={22} color={colors.textPrimary} />
              <Text style={styles.settingLabel}>Terms of Service</Text>
            </View>
            <Ionicons name={getDirectionalIcon('chevron-forward')} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="shield-checkmark-outline" size={22} color={colors.textPrimary} />
              <Text style={styles.settingLabel}>Privacy Policy</Text>
            </View>
            <Ionicons name={getDirectionalIcon('chevron-forward')} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="information-circle-outline" size={22} color={colors.textPrimary} />
              <Text style={styles.settingLabel}>App Version</Text>
            </View>
            <Text style={styles.versionText}>1.0.0</Text>
          </View>
        </View>
      </ScrollView>

      <ManageHouseholdModal
        visible={showManageHousehold}
        onClose={() => setShowManageHousehold(false)}
      />

      <ImportDataModal
        visible={showImportData}
        onClose={() => setShowImportData(false)}
      />

      <LanguageSelectorModal
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        currentLanguageCode={currentLanguageCode}
      />

      <CenteredModal
        visible={showClearDataConfirm}
        onClose={() => setShowClearDataConfirm(false)}
        title="Delete guest data?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleClearGuestData}
        confirmColor={colors.error}
        showActions={true}
      >
        <Text style={styles.confirmText}>
          This will permanently remove all data created while you were in Guest mode. This action cannot be undone.
        </Text>
      </CenteredModal>

      {toastMessage && (
        <Toast
          visible={!!toastMessage}
          message={toastMessage}
          onHide={() => setToastMessage(null)}
          type={toastType}
        />
      )}
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: 120, // Space for bottom pill nav
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '700',
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avatarContainer: {
    marginRight: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.quantityBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  profileEmail: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  profileProvider: {
    ...typography.tinyMuted,
    marginTop: spacing.xs,
  },
  signInPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  signInPromptText: {
    ...typography.body,
    flex: 1,
    marginStart: spacing.md,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  signOutText: {
    ...typography.button,
    color: colors.error,
    marginStart: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    ...typography.body,
    marginStart: spacing.md,
  },
  settingValue: {
    ...typography.body,
    color: colors.textSecondary,
    marginEnd: spacing.xs,
  },
  versionText: {
    ...typography.body,
    color: colors.textSecondary,
  },

  confirmText: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});
