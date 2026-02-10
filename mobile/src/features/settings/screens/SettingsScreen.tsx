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
import { InviteMemberModal } from '../components/InviteMemberModal';
import { LanguageSelectorModal } from '../components/LanguageSelectorModal';
import { i18n } from '../../../i18n';
import { normalizeLocale } from '../../../i18n/localeNormalization';
import { getNativeNameForCode } from '../../../i18n/constants';
import { getDirectionalIcon } from '../../../common/utils/rtlIcons';

/** Set to true when push notifications are implemented. */
const SHOW_PUSH_NOTIFICATIONS_SETTING = false;

/** Set to true when export data is implemented. */
const SHOW_EXPORT_DATA_SETTING = false;

export function SettingsScreen() {
  const { t } = useTranslation('settings');
  const { user, signOut } = useAuth();
  const [pushNotifications, setPushNotifications] = React.useState(true);
  const [showLanguageSelector, setShowLanguageSelector] = React.useState(false);
  const [showManageHousehold, setShowManageHousehold] = React.useState(false);
  const [showInviteModal, setShowInviteModal] = React.useState(false);

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const currentLanguageCode = normalizeLocale(i18n.language ?? '');
  const currentLanguageDisplayName = getNativeNameForCode(currentLanguageCode);

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
              <Text style={styles.profileName}>{user?.name ?? 'User'}</Text>
              {user?.email ? (
                <Text style={styles.profileEmail}>{user.email}</Text>
              ) : null}
              <Text style={styles.profileProvider}>Connected via Google</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications Section - hidden until push notifications are implemented */}
        {SHOW_PUSH_NOTIFICATIONS_SETTING && (
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
          </View>
        )}

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

          {isAdmin && (
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setShowInviteModal(true)}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="person-add-outline" size={22} color={colors.textPrimary} />
                <Text style={styles.settingLabel}>Invite member to household</Text>
              </View>
              <Ionicons name={getDirectionalIcon('chevron-forward')} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          {SHOW_EXPORT_DATA_SETTING && (
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="download-outline" size={22} color={colors.textPrimary} />
                <Text style={styles.settingLabel}>Export my data</Text>
              </View>
              <Ionicons name={getDirectionalIcon('chevron-forward')} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
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

      <LanguageSelectorModal
        visible={showLanguageSelector}
        onClose={() => setShowLanguageSelector(false)}
        currentLanguageCode={currentLanguageCode}
      />

      <InviteMemberModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />

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
});
