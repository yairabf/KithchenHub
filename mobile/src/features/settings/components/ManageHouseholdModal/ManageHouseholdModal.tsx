import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme';
import { useHousehold } from '../../../../contexts/HouseholdContext';
import { CenteredModal } from '../../../../common/components/CenteredModal';
import { styles } from './styles';
import { ManageHouseholdModalProps } from './types';

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
