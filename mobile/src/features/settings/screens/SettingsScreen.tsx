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
import { colors, spacing, borderRadius, typography, shadows, boxShadow } from '../../../theme';
import { ScreenHeader } from '../../../common/components/ScreenHeader';
import { ManageHouseholdModal } from '../components/ManageHouseholdModal';
import { InviteMemberModal } from '../components/InviteMemberModal';
import { LanguageSelectorModal } from '../components/LanguageSelectorModal';
import { i18n } from '../../../i18n';
import { normalizeLocale } from '../../../i18n/localeNormalization';
import { getNativeNameForCode } from '../../../i18n/constants';
import { getDirectionalIcon } from '../../../common/utils/rtlIcons';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../../../common/constants/legal';
import { openLegalUrl } from '../../../common/utils/legalLinks';

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
      <ScreenHeader title={t('title')} titleIcon="settings-outline" />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => setShowLanguageSelector(true)}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: colors.pastel.yellow }]}>
                <Ionicons name="language-outline" size={20} color={colors.secondary} />
              </View>
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
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.pastel.green }]}>
                  <Ionicons name="person" size={28} color={colors.primary} />
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.name ?? 'User'}</Text>
              {user?.id ? (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{user?.role ?? 'Member'}</Text>
                </View>
              ) : null}
              {user?.email ? (
                <Text style={styles.profileEmail}>{user.email}</Text>
              ) : null}
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
              <View style={[styles.iconContainer, { backgroundColor: colors.pastel.cyan }]}>
                <Ionicons name="people-outline" size={20} color={colors.primary} />
              </View>
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
                <View style={[styles.iconContainer, { backgroundColor: colors.pastel.peach }]}>
                  <Ionicons name="person-add-outline" size={20} color={colors.secondary} />
                </View>
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
          <TouchableOpacity
            style={styles.settingRow}
            accessibilityLabel="Delete account - This action cannot be undone"
            accessibilityRole="button"
            accessibilityHint="Permanently delete your account and all data"
          >
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: colors.pastel.lavender }]}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </View>
              <Text style={[styles.settingLabel, { color: colors.error }]}>Delete account</Text>
            </View>
            <Ionicons name={getDirectionalIcon('chevron-forward')} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => openLegalUrl(PRIVACY_POLICY_URL)}
            accessibilityRole="link"
            accessibilityLabel={`${t('privacyPolicy')} ${t('opensExternalLink')}`}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: colors.pastel.lavender }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.settingLabel}>{t('privacyPolicy')}</Text>
            </View>
            <Ionicons name={getDirectionalIcon('chevron-forward')} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => openLegalUrl(TERMS_OF_SERVICE_URL)}
            accessibilityRole="link"
            accessibilityLabel={`${t('termsOfService')} ${t('opensExternalLink')}`}
          >
            <View style={styles.settingInfo}>
              <View style={[styles.iconContainer, { backgroundColor: colors.pastel.lavender }]}>
                <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              </View>
              <Text style={styles.settingLabel}>{t('termsOfService')}</Text>
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
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    ...boxShadow(1, 4, 'rgba(0, 0, 0, 0.05)'),
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    ...typography.body,
    marginStart: spacing.md,
    fontWeight: '500',
  },
  settingValue: {
    ...typography.body,
    color: colors.textSecondary,
    marginEnd: spacing.xs,
    fontSize: 14,
  },
  versionText: {
    ...typography.body,
    color: colors.textSecondary,
    fontSize: 14,
  },
  roleBadge: {
    backgroundColor: 'rgba(96, 108, 56, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    marginBottom: spacing.xs,
  },
  roleText: {
    ...typography.tiny,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
