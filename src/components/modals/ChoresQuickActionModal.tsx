import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { colors, spacing, borderRadius } from '../../theme';
import { CenteredModal } from '../common/CenteredModal';
import { useHousehold } from '../../contexts/HouseholdContext';
import { ManageHouseholdModal } from './ManageHouseholdModal';
import { DateTimePicker } from '../common/DateTimePicker';

interface Chore {
  id: string;
  name: string;
  completed: boolean;
  assignee?: string;
}

interface ChoreTemplate {
  id: string;
  name: string;
  icon: string;
  category: string;
}

interface ChoresQuickActionModalProps {
  visible: boolean;
  onClose: () => void;
  onAddChore?: (chore: {
    name: string;
    icon: string;
    assignee?: string;
    dueDate: string;
    dueTime?: string;
    section: 'today' | 'thisWeek';
  }) => void;
}

const initialChores: Chore[] = [
  { id: '1', name: 'Wash dishes', completed: false, assignee: 'Mom' },
  { id: '2', name: 'Take out trash', completed: true, assignee: 'Dad' },
  { id: '3', name: 'Vacuum living room', completed: false },
  { id: '4', name: 'Clean bathroom', completed: false, assignee: 'Kids' },
];

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
  const { members } = useHousehold();
  const [newChoreText, setNewChoreText] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string | undefined>(undefined);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(new Date());
  const [showManageHousehold, setShowManageHousehold] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<string>('📋');
  const [searchResults, setSearchResults] = useState<ChoreTemplate[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getDueDateSection = (date: Date): 'today' | 'thisWeek' => {
    const today = dayjs().startOf('day');
    const compareDate = dayjs(date).startOf('day');

    if (compareDate.isSame(today, 'day')) {
      return 'today';
    }
    return 'thisWeek';
  };

  // Search functionality with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (newChoreText.trim().length > 0) {
      searchTimeoutRef.current = setTimeout(() => {
        const query = newChoreText.toLowerCase().trim();
        const results = mockChoresDB.filter(chore =>
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
  }, [newChoreText]);

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
        name: newChoreText.trim(),
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
                  <Ionicons name="arrow-forward" size={20} color={colors.textMuted} />
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

const styles = StyleSheet.create({
  addFormContainer: {
    marginBottom: spacing.md,
    position: 'relative',
    zIndex: 1000,
  },
  addForm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingRight: spacing.xl,
    fontSize: 16,
    color: colors.textPrimary,
  },
  clearButton: {
    position: 'absolute',
    right: 60,
    top: 14,
    padding: spacing.xs,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchDropdown: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 60,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    maxHeight: 240,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  searchDropdownScroll: {
    maxHeight: 240,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  searchResultIcon: {
    fontSize: 24,
    marginRight: spacing.sm,
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  searchResultCategory: {
    fontSize: 12,
    color: colors.textMuted,
  },
  dueDateSection: {
    marginBottom: spacing.md,
  },
  assigneeSection: {
    marginBottom: spacing.md,
  },
  assigneeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  assigneeScroll: {
    maxHeight: 40,
  },
  assigneeScrollContent: {
    gap: spacing.sm,
  },
  assigneeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.divider,
  },
  assigneeChipSelected: {
    backgroundColor: colors.chores,
    borderColor: colors.chores,
  },
  assigneeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  assigneeChipTextSelected: {
    color: colors.textLight,
  },
  assigneeChipManage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  choreAssigneeScroll: {
    marginTop: spacing.xs,
    maxHeight: 30,
  },
  choreAssigneeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.divider,
    marginRight: spacing.xs,
  },
  choreAssigneeChipSelected: {
    backgroundColor: colors.chores,
    borderColor: colors.chores,
  },
  choreAssigneeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  choreAssigneeChipTextSelected: {
    color: colors.textLight,
  },
});
