import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../../theme';
import { useAuth } from '../../../../contexts/AuthContext';
import { useHousehold } from '../../../../contexts/HouseholdContext';
import { CenteredModal } from '../../../../common/components/CenteredModal';
import { styles } from './styles';
import { ManageHouseholdModalProps } from './types';

function getRoleLabel(role: string, t: (key: string) => string): string {
  return role.toLowerCase() === 'admin'
    ? t('manageHouseholdModal.adminRole')
    : t('manageHouseholdModal.memberRole');
}

function getInitials(name?: string, email?: string): string {
  const source = name?.trim() || email?.split('@')[0] || '?';
  const parts = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return '?';
  }

  return parts.map((part) => part[0]).join('').toUpperCase();
}

export function ManageHouseholdModal({ visible, onClose }: ManageHouseholdModalProps) {
  const { t } = useTranslation('settings');
  const { user } = useAuth();
  const { members, isLoading, removeMember } = useHousehold();
  const canManageMembers = user?.role?.toLowerCase() === 'admin';

  const handleRemoveMember = async (id: string) => {
    await removeMember(id);
  };

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      title={t('manageHouseholdModal.title')}
      showActions={false}
    >
      <View style={styles.contentContainer}>
        <ScrollView style={styles.membersList} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>{t('manageHouseholdModal.membersSectionTitle')}</Text>

          {isLoading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.stateText}>{t('manageHouseholdModal.loading')}</Text>
            </View>
          ) : members.length === 0 ? (
            <View style={styles.stateContainer}>
              <Text style={styles.stateText}>{t('manageHouseholdModal.emptyState')}</Text>
            </View>
          ) : (
            members.map((member) => {
              const canRemoveMember = canManageMembers && !member.isCurrentUser;
              const roleLabel = getRoleLabel(member.role, t);

              return (
                <View key={member.id} style={styles.memberCard}>
                  <View
                    style={[
                      styles.memberAvatar,
                      { backgroundColor: member.color || colors.primary },
                    ]}
                  >
                    <Text style={styles.memberAvatarText}>{getInitials(member.name, member.email)}</Text>
                  </View>

                  <View style={styles.memberTextColumn}>
                    <View style={styles.memberHeaderRow}>
                      <Text style={styles.memberName} numberOfLines={1}>{member.name}</Text>
                      {member.isCurrentUser ? (
                        <View style={[styles.badge, styles.currentUserBadge]}>
                          <Text style={[styles.badgeText, styles.currentUserBadgeText]}>
                            {t('manageHouseholdModal.currentUserBadge')}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {member.email ? (
                      <Text style={styles.memberEmail} numberOfLines={1}>{member.email}</Text>
                    ) : null}

                    <View style={styles.memberMetaRow}>
                      <View
                        style={[
                          styles.roleBadge,
                          member.role.toLowerCase() === 'admin'
                            ? styles.adminRoleBadge
                            : styles.memberRoleBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.roleBadgeText,
                            member.role.toLowerCase() === 'admin'
                              ? styles.adminRoleBadgeText
                              : styles.memberRoleBadgeText,
                          ]}
                        >
                          {roleLabel}
                        </Text>
                      </View>

                      {canRemoveMember ? (
                        <TouchableOpacity
                          accessibilityLabel={t('manageHouseholdModal.removeMember')}
                          style={styles.removeButton}
                          onPress={() => handleRemoveMember(member.id)}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.error} />
                          <Text style={styles.removeButtonText}>
                            {t('manageHouseholdModal.removeMember')}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    {member.isCurrentUser ? (
                      <Text style={styles.inlineHelperText}>
                        {t('manageHouseholdModal.cannotRemoveYourself')}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {!canManageMembers ? (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('manageHouseholdModal.onlyAdminsCanRemoveMembers')}
            </Text>
          </View>
        ) : null}
      </View>
    </CenteredModal>
  );
}
