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
import { useAuth } from '../contexts/AuthContext';
import { colors, spacing, borderRadius, typography } from '../theme';
import { ManageHouseholdModal } from '../components/modals/ManageHouseholdModal';

// Screen-specific colors matching ShoppingListsScreen theme
const screenColors = {
  background: '#F5F5F0',
  surface: '#FFFFFF',
  tabActive: '#4A5D4A',
  textPrimary: '#2D3139',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  addButton: '#F5DEB3',
  quantityBg: '#F3F4F6',
  border: '#E5E7EB',
  accent: '#10B981',
};

export function SettingsScreen() {
  const { user, signOut } = useAuth();
  const [pushNotifications, setPushNotifications] = React.useState(true);
  const [dailySummary, setDailySummary] = React.useState(false);
  const [cloudSync, setCloudSync] = React.useState(true);
  const [showManageHousehold, setShowManageHousehold] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              {user?.photoUrl ? (
                <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={32} color={screenColors.textSecondary} />
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
            <TouchableOpacity style={styles.signInPrompt}>
              <Ionicons name="logo-google" size={20} color={colors.google} />
              <Text style={styles.signInPromptText}>Sign in to sync your data</Text>
              <Ionicons name="chevron-forward" size={20} color={screenColors.textSecondary} />
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
              <Ionicons name="notifications-outline" size={22} color={screenColors.textPrimary} />
              <Text style={styles.settingLabel}>Push notifications</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: screenColors.border, true: screenColors.tabActive }}
              thumbColor={screenColors.surface}
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="mail-outline" size={22} color={screenColors.textPrimary} />
              <Text style={styles.settingLabel}>Daily summary email</Text>
            </View>
            <Switch
              value={dailySummary}
              onValueChange={setDailySummary}
              trackColor={{ false: screenColors.border, true: screenColors.tabActive }}
              thumbColor={screenColors.surface}
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
              <Ionicons name="people-outline" size={22} color={screenColors.textPrimary} />
              <Text style={styles.settingLabel}>Manage household members</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={screenColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="cloud-outline" size={22} color={screenColors.textPrimary} />
              <Text style={styles.settingLabel}>Sync to cloud</Text>
            </View>
            <Switch
              value={cloudSync}
              onValueChange={setCloudSync}
              trackColor={{ false: screenColors.border, true: screenColors.tabActive }}
              thumbColor={screenColors.surface}
              disabled={user?.isGuest}
            />
          </View>
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="download-outline" size={22} color={screenColors.textPrimary} />
              <Text style={styles.settingLabel}>Export my data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={screenColors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
              <Text style={[styles.settingLabel, { color: colors.error }]}>Delete account</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={screenColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="document-text-outline" size={22} color={screenColors.textPrimary} />
              <Text style={styles.settingLabel}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={screenColors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="shield-checkmark-outline" size={22} color={screenColors.textPrimary} />
              <Text style={styles.settingLabel}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={screenColors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="information-circle-outline" size={22} color={screenColors.textPrimary} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: screenColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: screenColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: screenColors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: screenColors.textPrimary,
    letterSpacing: -0.5,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 120, // Space for bottom pill nav
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: screenColors.textPrimary,
    marginBottom: spacing.sm,
    paddingLeft: spacing.sm,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: screenColors.surface,
    borderRadius: 12,
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
    backgroundColor: screenColors.quantityBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: screenColors.textPrimary,
    marginBottom: spacing.xs,
  },
  profileEmail: {
    fontSize: 14,
    color: screenColors.textSecondary,
  },
  profileProvider: {
    fontSize: 11,
    color: screenColors.textMuted,
    marginTop: spacing.xs,
  },
  signInPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: screenColors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  signInPromptText: {
    fontSize: 16,
    color: screenColors.textPrimary,
    flex: 1,
    marginLeft: spacing.md,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: screenColors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginLeft: spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: screenColors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: screenColors.textPrimary,
    marginLeft: spacing.md,
  },
  versionText: {
    fontSize: 16,
    color: screenColors.textSecondary,
  },
});
