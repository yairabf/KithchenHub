import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import dayjs from 'dayjs';
import { colors } from '../../../../theme';
import { useHousehold } from '../../../../contexts/HouseholdContext';
import { CenteredModal } from '../../../../common/components/CenteredModal';
import { DateTimePicker } from '../../../../common/components/DateTimePicker';
import { styles } from './styles';
import { ChoreDetailsModalProps, Chore } from './types';
import { CHORE_ICONS } from '../../constants';


export function ChoreDetailsModal({
  visible,
  chore,
  onClose,
  onUpdateAssignee,
  onUpdateChore
}: ChoreDetailsModalProps) {
  const { members } = useHousehold();
  const [selectedAssignee, setSelectedAssignee] = useState<string | undefined>(chore?.assignee);
  const [choreName, setChoreName] = useState<string>(chore?.title || '');
  const [selectedIcon, setSelectedIcon] = useState<string>(chore?.icon || '📋');
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [recurrencePattern, setRecurrencePattern] = useState<string | null>(null);

  // ... existing code ...

  useEffect(() => {
    if (visible && chore) {
      setSelectedAssignee(chore.assignee);
      setChoreName(chore.title);
      setSelectedIcon(chore.icon || '📋');
      setRecurrencePattern(chore.isRecurring ? 'daily' : null); // Default to daily if recurring
      // ... date logic
    }
  }, [visible, chore]);

  const handleSave = () => {
    if (chore) {
      // ... existing code ...

      // Build updates object
      const updates: Partial<Chore> & { assigneeId?: string } = {};

      if (choreName !== chore.title) {
        updates.title = choreName;
      }

      if (selectedIcon !== chore.icon) {
        updates.icon = selectedIcon;
      }

      // Handle recurrence pattern update
      const currentIsRecurring = chore.isRecurring || false;
      const newIsRecurring = recurrencePattern !== null;
      if (currentIsRecurring !== newIsRecurring || recurrencePattern !== null) {
        updates.isRecurring = newIsRecurring;
      }

      // Handle assignee update - send assigneeId instead of name
      if (selectedAssignee !== chore.assignee) {
        // Lookup member by name to get userId
        const member = members.find(m => m.name === selectedAssignee);
        updates.assigneeId = member?.id || undefined;
        updates.assignee = selectedAssignee; // Also update local name for display
      }

      // ... existing date logic ...

      // Update date/time if changed and valid
      if (selectedDateTime && onUpdateChore) {
        const dateObj = dayjs(selectedDateTime);
        updates.dueDate = dateObj.format('MMM D, YYYY');
        updates.dueTime = dateObj.format('h:mm A');
        // FIX: Update originalDate as well so local/guest mode keeps it in sync
        updates.originalDate = selectedDateTime;
      }

      // Apply updates if any
      if (onUpdateChore && Object.keys(updates).length > 0) {
        onUpdateChore(chore.id, updates);
      }
    }
    onClose();
  };

  if (!chore) return null;

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      title="Edit Chore"
      confirmText="Save"
      cancelText="Cancel"
      onConfirm={handleSave}
      confirmColor={colors.chores}
    >
      <View style={styles.choreNameSection}>
        <View style={styles.iconContainer}>
          <Text style={styles.choreIcon}>{selectedIcon}</Text>
        </View>
        <TextInput
          style={styles.choreNameInput}
          value={choreName}
          onChangeText={setChoreName}
          placeholder="Chore name"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.iconSelectionSection}>
        <Text style={styles.sectionLabel}>ICON:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.iconList}
        >
          {CHORE_ICONS.map((icon) => (
            <TouchableOpacity
              key={icon}
              style={[
                styles.iconOption,
                selectedIcon === icon && styles.iconOptionSelected
              ]}
              onPress={() => setSelectedIcon(icon)}
            >
              <Text style={styles.iconOptionText}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.recurrenceSection}>
        <Text style={styles.sectionLabel}>REPEAT:</Text>
        <View style={styles.recurrenceOptions}>
          <TouchableOpacity
            style={[
              styles.recurrenceOption,
              recurrencePattern === null && styles.recurrenceOptionSelected
            ]}
            onPress={() => setRecurrencePattern(null)}
          >
            <Text style={[
              styles.recurrenceOptionText,
              recurrencePattern === null && styles.recurrenceOptionTextSelected
            ]}>
              None
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.recurrenceOption,
              recurrencePattern === 'daily' && styles.recurrenceOptionSelected
            ]}
            onPress={() => setRecurrencePattern('daily')}
          >
            <Text style={[
              styles.recurrenceOptionText,
              recurrencePattern === 'daily' && styles.recurrenceOptionTextSelected
            ]}>
              Daily
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.recurrenceOption,
              recurrencePattern === 'weekly' && styles.recurrenceOptionSelected
            ]}
            onPress={() => setRecurrencePattern('weekly')}
          >
            <Text style={[
              styles.recurrenceOptionText,
              recurrencePattern === 'weekly' && styles.recurrenceOptionTextSelected
            ]}>
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.recurrenceOption,
              recurrencePattern === 'monthly' && styles.recurrenceOptionSelected
            ]}
            onPress={() => setRecurrencePattern('monthly')}
          >
            <Text style={[
              styles.recurrenceOptionText,
              recurrencePattern === 'monthly' && styles.recurrenceOptionTextSelected
            ]}>
              Monthly
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dateTimeSection}>
        <DateTimePicker
          value={selectedDateTime}
          onChange={setSelectedDateTime}
          label="Due Date & Time"
          minDate={new Date()}
          accentColor={colors.chores}
          displayFormat="MMM D, YYYY h:mm A"
        />
      </View>

      <View style={styles.assigneeSection}>
        <Text style={styles.assigneeLabel}>ASSIGN TO:</Text>
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
        </ScrollView>
      </View>
    </CenteredModal>
  );
}
