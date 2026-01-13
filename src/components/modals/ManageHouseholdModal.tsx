import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../theme';
import { useHousehold } from '../../contexts/HouseholdContext';
import { CenteredModal } from '../common/CenteredModal';

interface ManageHouseholdModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ManageHouseholdModal({ visible, onClose }: ManageHouseholdModalProps) {
  const { members, addMember, removeMember } = useHousehold();
  const [newMemberName, setNewMemberName] = useState('');
  const inputRef = useRef<TextInput>(null);

  const handleAddMember = async () => {
    if (!newMemberName.trim()) return;
    await addMember(newMemberName.trim());
    setNewMemberName('');
  };

  const handleRemoveMember = async (id: string) => {
    await removeMember(id);
  };

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      title="Manage Household"
      showActions={false}
    >
      <View style={styles.contentContainer}>
        {/* Add Member Form */}
        <View style={styles.addForm}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Add new member..."
            placeholderTextColor={colors.textMuted}
            value={newMemberName}
            onChangeText={setNewMemberName}
            onSubmitEditing={handleAddMember}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.chores }]}
            onPress={handleAddMember}
          >
            <Ionicons name="add" size={24} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Members List */}
        <ScrollView style={styles.membersList} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Household Members</Text>
          {members.map(member => (
            <View key={member.id} style={styles.memberRow}>
              <View style={[styles.memberColorDot, { backgroundColor: member.color || colors.textMuted }]} />
              <Text style={styles.memberName}>{member.name}</Text>
              {member.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>Default</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.deleteButton, member.isDefault && styles.deleteButtonDisabled]}
                onPress={() => handleRemoveMember(member.id)}
                disabled={member.isDefault}
              >
                <Ionicons 
                  name="trash-outline" 
                  size={20} 
                  color={member.isDefault ? colors.textMuted : colors.error} 
                />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Default members cannot be removed
          </Text>
        </View>
      </View>
    </CenteredModal>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    maxHeight: 400,
  },
  addForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  membersList: {
    maxHeight: 250,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  memberColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  memberName: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  defaultBadge: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginRight: spacing.sm,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  deleteButton: {
    padding: spacing.sm,
  },
  deleteButtonDisabled: {
    opacity: 0.3,
  },
  footer: {
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
