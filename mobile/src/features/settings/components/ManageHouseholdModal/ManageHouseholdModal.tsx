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
              const isRemoveDisabled = !canManageMembers || member.isCurrentUser;

              return (
              <View key={member.id} style={styles.memberRow}>
                <View style={[styles.memberColorDot, { backgroundColor: member.color || colors.textMuted }]} />
                <View style={styles.memberTextColumn}>
                  <View style={styles.memberHeaderRow}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    {member.isCurrentUser ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{t('manageHouseholdModal.currentUserBadge')}</Text>
                      </View>
                    ) : null}
                  </View>
                  {member.email ? (
                    <Text style={styles.memberEmail}>{member.email}</Text>
                  ) : null}
                  <Text style={styles.memberRole}>{getRoleLabel(member.role, t)}</Text>
                </View>
                <TouchableOpacity
                  accessibilityLabel={t('manageHouseholdModal.removeMember')}
                  style={[styles.deleteButton, isRemoveDisabled && styles.deleteButtonDisabled]}
                  onPress={() => handleRemoveMember(member.id)}
                  disabled={isRemoveDisabled}
                >
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={isRemoveDisabled ? colors.textMuted : colors.error}
                  />
                </TouchableOpacity>
              </View>
            )})
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {canManageMembers
              ? t('manageHouseholdModal.cannotRemoveYourself')
              : t('manageHouseholdModal.onlyAdminsCanRemoveMembers')}
          </Text>
        </View>
      </View>
    </CenteredModal>
  );
}
