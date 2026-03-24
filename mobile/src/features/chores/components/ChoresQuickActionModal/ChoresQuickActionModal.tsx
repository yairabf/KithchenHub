import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { colors } from '../../../../theme';
import { CenteredModal } from '../../../../common/components/CenteredModal';
import { useHousehold } from '../../../../contexts/HouseholdContext';
import { ManageHouseholdModal } from '../../../settings/components/ManageHouseholdModal';
import { DateTimePicker } from '../../../../common/components/DateTimePicker';
import { styles } from './styles';
import { ChoresQuickActionModalProps, ChoreTemplate } from './types';
import { getDirectionalIcon } from '../../../../common/utils/rtlIcons';

// Mock Chores Database - Common household chores
const mockChoresDB: ChoreTemplate[] = [
  // Kitchen
  { id: 'c1', name: 'Wash dishes', icon: '🍽️', category: 'Kitchen' },
  { id: 'c2', name: 'Clean counters', icon: '🧽', category: 'Kitchen' },
  { id: 'c3', name: 'Mop kitchen floor', icon: '🧹', category: 'Kitchen' },
  { id: 'c4', name: 'Take out trash', icon: '🗑️', category: 'Kitchen' },
  { id: 'c5', name: 'Empty dishwasher', icon: '🍽️', category: 'Kitchen' },
  { id: 'c6', name: 'Wipe stove', icon: '🔥', category: 'Kitchen' },
  { id: 'c7', name: 'Clean refrigerator', icon: '❄️', category: 'Kitchen' },
  { id: 'c8', name: 'Organize pantry', icon: '🥫', category: 'Kitchen' },

  // Bathroom
  { id: 'c9', name: 'Clean toilet', icon: '🚽', category: 'Bathroom' },
  { id: 'c10', name: 'Scrub shower', icon: '🚿', category: 'Bathroom' },
  { id: 'c11', name: 'Wipe mirrors', icon: '🪞', category: 'Bathroom' },
  { id: 'c12', name: 'Clean sink', icon: '🚰', category: 'Bathroom' },
  { id: 'c13', name: 'Mop bathroom floor', icon: '🧹', category: 'Bathroom' },
  { id: 'c14', name: 'Replace towels', icon: '🧴', category: 'Bathroom' },

  // Bedroom
  { id: 'c15', name: 'Make bed', icon: '🛏️', category: 'Bedroom' },
  { id: 'c16', name: 'Fold laundry', icon: '👕', category: 'Bedroom' },
  { id: 'c17', name: 'Vacuum bedroom', icon: '🧹', category: 'Bedroom' },
  { id: 'c18', name: 'Change bed sheets', icon: '🛏️', category: 'Bedroom' },
  { id: 'c19', name: 'Organize closet', icon: '👔', category: 'Bedroom' },
  { id: 'c20', name: 'Dust furniture', icon: '🪶', category: 'Bedroom' },

  // Living Areas
  { id: 'c21', name: 'Vacuum living room', icon: '🧹', category: 'Living Areas' },
  { id: 'c22', name: 'Dust shelves', icon: '🪶', category: 'Living Areas' },
  { id: 'c23', name: 'Organize living room', icon: '🛋️', category: 'Living Areas' },
  { id: 'c24', name: 'Clean windows', icon: '🪟', category: 'Living Areas' },
  { id: 'c25', name: 'Vacuum stairs', icon: '🧹', category: 'Living Areas' },
  { id: 'c26', name: 'Wipe baseboards', icon: '🧽', category: 'Living Areas' },

  // Laundry
  { id: 'c27', name: 'Wash clothes', icon: '👕', category: 'Laundry' },
  { id: 'c28', name: 'Dry clothes', icon: '🌀', category: 'Laundry' },
  { id: 'c29', name: 'Iron clothes', icon: '👔', category: 'Laundry' },
  { id: 'c30', name: 'Put away laundry', icon: '🧺', category: 'Laundry' },

  // Outdoor
  { id: 'c31', name: 'Water plants', icon: '🌱', category: 'Outdoor' },
  { id: 'c32', name: 'Mow lawn', icon: '🌿', category: 'Outdoor' },
  { id: 'c33', name: 'Sweep porch', icon: '🧹', category: 'Outdoor' },
  { id: 'c34', name: 'Rake leaves', icon: '🍂', category: 'Outdoor' },
  { id: 'c35', name: 'Take out recycling', icon: '♻️', category: 'Outdoor' },
  { id: 'c36', name: 'Clean garage', icon: '🚗', category: 'Outdoor' },

  // General
  { id: 'c37', name: 'Sweep floors', icon: '🧹', category: 'General' },
  { id: 'c38', name: 'Mop floors', icon: '🧽', category: 'General' },
  { id: 'c39', name: 'Dust surfaces', icon: '🪶', category: 'General' },
  { id: 'c40', name: 'Organize clutter', icon: '📦', category: 'General' },
];

export function ChoresQuickActionModal({ visible, onClose, onAddChore }: ChoresQuickActionModalProps) {
  const { t } = useTranslation('chores');
  const { members } = useHousehold();
  const [newChoreText, setNewChoreText] = useState('');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | undefined>(undefined);
  const [selectedAssigneeName, setSelectedAssigneeName] = useState<string | undefined>(undefined);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(new Date());
  const [showManageHousehold, setShowManageHousehold] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<string>('📋');
  const [searchResults, setSearchResults] = useState<ChoreTemplate[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const choreTemplates = mockChoresDB;

  const inputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle search logic
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (newChoreText.length > 0) {
      searchTimeoutRef.current = setTimeout(() => {
        const filtered = choreTemplates.filter(chore =>
          chore.name.toLowerCase().includes(newChoreText.toLowerCase())
        );
        setSearchResults(filtered);
        setShowSearchDropdown(true);
      }, 300); // Debounce search
    } else {
      setShowSearchDropdown(false);
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [newChoreText, choreTemplates]);

  const handleSelectChoreTemplate = useCallback((choreTemplate: ChoreTemplate) => {
    setNewChoreText(choreTemplate.name);
    setSelectedIcon(choreTemplate.icon);
    setShowSearchDropdown(false);
  }, []);

  const handleSelectAssignee = useCallback((memberId: string, memberName: string) => {
    setSelectedAssigneeId(memberId);
    setSelectedAssigneeName(memberName);
  }, []);

  const handleClearAssignee = useCallback(() => {
    setSelectedAssigneeId(undefined);
    setSelectedAssigneeName(undefined);
  }, []);

  const getDueDateSection = useCallback((date: Date): 'today' | 'thisWeek' => {
    const today = dayjs().startOf('day');
    const compareDate = dayjs(date).startOf('day');
    return compareDate.isSame(today, 'day') ? 'today' : 'thisWeek';
  }, []);

  const handleAddChore = useCallback(() => {
    if (!newChoreText.trim() || !selectedDateTime) return;

    const section = getDueDateSection(selectedDateTime);
    const formattedDate = dayjs(selectedDateTime).format('MMM D, YYYY');
    const formattedTime = dayjs(selectedDateTime).format('h:mm A');

    onAddChore?.({
      name: newChoreText.trim(),
      icon: selectedIcon,
      assignee: selectedAssigneeName,
      assigneeId: selectedAssigneeId,
      dueDate: formattedDate,
      dueTime: formattedTime,
      section,
    });

    setNewChoreText('');
    setSelectedIcon('📋');
    setSelectedAssigneeName(undefined);
    setSelectedAssigneeId(undefined);
    setSelectedDateTime(new Date());
    setShowSearchDropdown(false);
    onClose();
  }, [newChoreText, selectedDateTime, selectedIcon, selectedAssigneeName, selectedAssigneeId, getDueDateSection, onAddChore, onClose]);

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      title={t('quickActionModal.title')}
      showActions={false}
    >
      {/* Quick Add Form */}
      <View style={styles.addFormContainer}>
        <View style={styles.addForm}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder={t('quickActionModal.choreNamePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={newChoreText}
            onChangeText={setNewChoreText}
            onSubmitEditing={handleAddChore}
            returnKeyType="done"
          />
          {newChoreText.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setNewChoreText('');
                setShowSearchDropdown(false);
              }}
            >
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            testID="chores-quick-action-add"
            style={[styles.addButton, { backgroundColor: colors.chores }]}
            onPress={handleAddChore}
          >
            <Ionicons name="add" size={24} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Search Results Dropdown */}
        {showSearchDropdown && (
          <View style={styles.searchDropdown}>
            <ScrollView
              style={styles.searchDropdownScroll}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {searchResults.map((chore) => (
                <TouchableOpacity
                  key={chore.id}
                  style={styles.searchResultItem}
                  onPress={() => handleSelectChoreTemplate(chore)}
                >
                  <Text style={styles.searchResultIcon}>{chore.icon}</Text>
                  <View style={styles.searchResultInfo}>
                    <Text style={styles.searchResultName}>{chore.name}</Text>
                    <Text style={styles.searchResultCategory}>{chore.category}</Text>
                  </View>
                  <Ionicons name={getDirectionalIcon('arrow-forward')} size={20} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Due Date & Time Selector */}
      <View style={styles.dueDateSection}>
        <DateTimePicker
          value={selectedDateTime}
          onChange={setSelectedDateTime}
          label="Due Date & Time"
          placeholder="Select date and time..."
          minDate={new Date()}
          accentColor={colors.chores}
          displayFormat="MMM D, YYYY h:mm A"
        />
      </View>

      {/* Assignee Selector */}
      <View style={styles.assigneeSection}>
        <Text style={styles.assigneeLabel}>{t('quickActionModal.assignLabel')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.assigneeScroll}
          contentContainerStyle={styles.assigneeScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.assigneeChip,
              !selectedAssigneeName && styles.assigneeChipSelected,
            ]}
            onPress={handleClearAssignee}
          >
            <Text style={[
              styles.assigneeChipText,
              !selectedAssigneeName && styles.assigneeChipTextSelected,
            ]}>
              {t('quickActionModal.unassigned')}
            </Text>
          </TouchableOpacity>
          {members.map(member => (
            <TouchableOpacity
              key={member.id}
              style={[
                styles.assigneeChip,
                selectedAssigneeName === member.name && styles.assigneeChipSelected,
                { borderColor: member.color || colors.textMuted },
              ]}
              onPress={() => handleSelectAssignee(member.id, member.name)}
            >
              <Text style={[
                styles.assigneeChipText,
                selectedAssigneeName === member.name && styles.assigneeChipTextSelected,
              ]}>
                {member.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.assigneeChip, styles.assigneeChipManage]}
            onPress={() => setShowManageHousehold(true)}
          >
            <Ionicons name="settings-outline" size={16} color={colors.textMuted} />
            <Text style={styles.assigneeChipText}>{t('quickActionModal.manage')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>


      <ManageHouseholdModal
        visible={showManageHousehold}
        onClose={() => setShowManageHousehold(false)}
      />
    </CenteredModal>
  );
}
