import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { colors } from '../../../../theme';
import { CenteredModal } from '../../../../common/components/CenteredModal';
import { useHousehold } from '../../../../contexts/HouseholdContext';
import { ManageHouseholdModal } from '../../../settings/components/ManageHouseholdModal';
import { DateTimePicker } from '../../../../common/components/DateTimePicker';
import { styles } from './styles';
import { ChoresQuickActionModalProps, ChoreTemplate } from './types';
import { createChoresService } from '../../services/choresService';
import { config } from '../../../../config';
import { useAuth } from '../../../../contexts/AuthContext';
import { getDirectionalIcon } from '../../../../common/utils/rtlIcons';
import { mockChoresDB } from '../../../../mocks/chores';

export function ChoresQuickActionModal({ visible, onClose, onAddChore }: ChoresQuickActionModalProps) {
  const { members } = useHousehold();
  const { user } = useAuth();
  const [newChoreText, setNewChoreText] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string | undefined>(undefined);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(new Date());
  const [showManageHousehold, setShowManageHousehold] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<string>('📋');
  const [searchResults, setSearchResults] = useState<ChoreTemplate[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [choreTemplates, setChoreTemplates] = useState<ChoreTemplate[]>([]);
  const inputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMockDataEnabled = config.mockData.enabled;
  const shouldUseMockData = isMockDataEnabled || !user || user.isGuest;
  const choresService = useMemo(
    () => createChoresService(shouldUseMockData),
    [shouldUseMockData]
  );

  const getDueDateSection = (date: Date): 'today' | 'thisWeek' => {
    const today = dayjs().startOf('day');
    const compareDate = dayjs(date).startOf('day');

    if (compareDate.isSame(today, 'day')) {
      return 'today';
    }
    return 'thisWeek';
  };

  useEffect(() => {
    let isMounted = true;

    const loadChoreTemplates = async () => {
      if (shouldUseMockData) {
        setChoreTemplates(mockChoresDB);
        return;
      }

      try {
        const chores = await choresService.getChores();
        if (isMounted) {
          const templates = chores.map((chore) => ({
            id: chore.id,
            name: chore.title,
            icon: chore.icon ?? '🧹',
            category: chore.section === 'today' ? 'Today' : 'Upcoming',
          }));
          setChoreTemplates(templates);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to load chore templates:', error);
          setChoreTemplates([]);
        }
      }
    };

    if (visible) {
      loadChoreTemplates();
    }

    return () => {
      isMounted = false;
    };
  }, [choresService, shouldUseMockData, visible]);

  // Search functionality with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (newChoreText.trim().length > 0) {
      searchTimeoutRef.current = setTimeout(() => {
        const query = newChoreText.toLowerCase().trim();
        const results = choreTemplates.filter(chore =>
          chore.name.toLowerCase().startsWith(query)
        );
        setSearchResults(results);
        setShowSearchDropdown(results.length > 0);
      }, 300);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [newChoreText, choreTemplates]);

  const handleSelectChoreTemplate = (choreTemplate: ChoreTemplate) => {
    setNewChoreText(choreTemplate.name);
    setSelectedIcon(choreTemplate.icon);
    setShowSearchDropdown(false);
  };

  const handleAddChore = () => {
    if (!newChoreText.trim() || !selectedDateTime) return;

    const section = getDueDateSection(selectedDateTime);

    // Format the date and time
    const formattedDate = dayjs(selectedDateTime).format('MMM D, YYYY');
    const formattedTime = dayjs(selectedDateTime).format('h:mm A');

    // Call the callback to add chore to parent state
    if (onAddChore) {
      onAddChore({
        title: newChoreText.trim(),
        icon: selectedIcon,
        assignee: selectedAssignee,
        dueDate: formattedDate,
        dueTime: formattedTime,
        section: section,
      });
    }

    // Reset form
    setNewChoreText('');
    setSelectedIcon('📋');
    setSelectedAssignee(undefined);
    setSelectedDateTime(new Date());
    setShowSearchDropdown(false);

    // Close modal after adding
    onClose();
  };

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      title="Quick Chores"
      showActions={false}
    >
      {/* Quick Add Form */}
      <View style={styles.addFormContainer}>
        <View style={styles.addForm}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Add a chore..."
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
        <Text style={styles.assigneeLabel}>Assign to:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.assigneeScroll}
          contentContainerStyle={styles.assigneeScrollContent}
        >
          <TouchableOpacity
            style={[
              styles.assigneeChip,
              !selectedAssignee && styles.assigneeChipSelected,
            ]}
            onPress={() => setSelectedAssignee(undefined)}
          >
            <Text style={[
              styles.assigneeChipText,
              !selectedAssignee && styles.assigneeChipTextSelected,
            ]}>
              Unassigned
            </Text>
          </TouchableOpacity>
          {members.map(member => (
            <TouchableOpacity
              key={member.id}
              style={[
                styles.assigneeChip,
                selectedAssignee === member.name && styles.assigneeChipSelected,
                { borderColor: member.color || colors.textMuted },
              ]}
              onPress={() => setSelectedAssignee(member.name)}
            >
              <Text style={[
                styles.assigneeChipText,
                selectedAssignee === member.name && styles.assigneeChipTextSelected,
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
            <Text style={styles.assigneeChipText}>Manage</Text>
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
