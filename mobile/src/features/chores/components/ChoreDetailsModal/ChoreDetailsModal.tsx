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
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);

  // Helper function to parse the chore's date/time strings into a Date object
  const parseChoreDateTime = (dueDate: string, dueTime?: string): Date | null => {
    try {
      // Handle relative dates like "Today", "Tomorrow"
      let baseDate = dayjs();
      const dueDateLower = dueDate.toLowerCase();

      if (dueDateLower === 'today') {
        baseDate = dayjs().startOf('day');
      } else if (dueDateLower === 'tomorrow') {
        baseDate = dayjs().add(1, 'day').startOf('day');
      } else {
        // Try to parse as a date string
        baseDate = dayjs(dueDate);
        if (!baseDate.isValid()) {
          // If it's a weekday name, find the next occurrence
          const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const targetDay = weekdays.indexOf(dueDateLower);
          if (targetDay !== -1) {
            const today = dayjs().day();
            const daysToAdd = targetDay >= today ? targetDay - today : 7 - today + targetDay;
            baseDate = dayjs().add(daysToAdd, 'day').startOf('day');
          } else {
            return null;
          }
        }
      }

      // Parse time if provided
      if (dueTime) {
        const timeMatch = dueTime.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const period = timeMatch[3]?.toUpperCase();

          if (period === 'PM' && hours !== 12) {
            hours += 12;
          } else if (period === 'AM' && hours === 12) {
            hours = 0;
          }

          baseDate = baseDate.hour(hours).minute(minutes);
        }
      }

      return baseDate.toDate();
    } catch (error) {
      console.error('Error parsing chore date/time:', error);
      return null;
    }
  };

  useEffect(() => {
    if (visible && chore) {
      setSelectedAssignee(chore.assignee);
      setChoreName(chore.name);
      setSelectedDateTime(parseChoreDateTime(chore.dueDate, chore.dueTime));
    }
  }, [visible, chore]);

  const handleSave = () => {
    if (chore) {
      // Update assignee using the existing callback
      onUpdateAssignee(chore.id, selectedAssignee);

      // Build updates object
      const updates: Partial<Chore> = {};

      if (choreName !== chore.title) {
        updates.title = choreName;
      }

      // Update date/time if changed and valid
      if (selectedDateTime && onUpdateChore) {
        const dateObj = dayjs(selectedDateTime);
        updates.dueDate = dateObj.format('MMM D, YYYY');
        updates.dueTime = dateObj.format('h:mm A');
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
        <Text style={styles.choreIcon}>{chore.icon || '📋'}</Text>
        <TextInput
          style={styles.choreNameInput}
          value={choreName}
          onChangeText={setChoreName}
          placeholder="Chore name"
          placeholderTextColor={colors.textMuted}
        />
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
