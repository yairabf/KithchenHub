import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../../theme';
import { useHousehold } from '../../../../contexts/HouseholdContext';
import { EntityFormModal } from '../../../../common/components/EntityFormModal';
import { ManageHouseholdModal } from '../../../settings/components/ManageHouseholdModal';
import { DateTimePicker } from '../../../../common/components/DateTimePicker';
import { CHORE_ICONS } from '../../constants';
import { styles } from './styles';
import type { Chore } from '../../../../mocks/chores';
import type { ChoreDetailsModalProps } from './types';

/** Auto-focus delay (ms) to allow modal entrance animation to complete first. */
const AUTOFOCUS_DELAY_MS = 150;

/**
 * Determines which section bucket a due date falls into.
 *
 * Section values are constrained by the min-date picker to be today or later,
 * so any non-today date is treated as "thisWeek" in the UI's two-bucket model.
 * Recurring chores bypass date-based bucketing entirely.
 *
 * @param date - The selected due date
 * @param isRecurring - Whether the chore repeats on a schedule
 */
function getDueDateSection(date: Date, isRecurring: boolean): 'today' | 'thisWeek' | 'recurring' {
  if (isRecurring) return 'recurring';

  const today = dayjs().startOf('day');
  const selectedDay = dayjs(date).startOf('day');

  if (selectedDay.isSame(today, 'day')) return 'today';

  return 'thisWeek';
}

function coerceDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

export function ChoreDetailsModal(props: ChoreDetailsModalProps) {
  const { visible, mode, onClose } = props;
  const { t, i18n } = useTranslation('chores');
  const isRtlLayout = i18n.dir() === 'rtl' || I18nManager.isRTL;
  const { members } = useHousehold();

  const [choreName, setChoreName] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState<string | undefined>(undefined);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(new Date());
  const [selectedIcon, setSelectedIcon] = useState<string>('📋');
  const [showManageHousehold, setShowManageHousehold] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<'daily' | 'weekly' | 'monthly' | null>(null);

  const inputRef = useRef<TextInput>(null);

  // Populate form fields when the modal opens.
  // In edit mode, seed with the existing chore's values.
  // In add mode, reset to defaults.
  useEffect(() => {
    if (!visible) return;

    if (mode === 'edit' && props.chore) {
      setChoreName(props.chore.title);
      setSelectedAssignee(props.chore.assignee);
      setSelectedIcon(props.chore.icon || '📋');
      setSelectedDateTime(coerceDate(props.chore.originalDate));
      setRecurrencePattern(props.chore.recurrencePattern ?? null);
      return;
    }

    setChoreName('');
    setSelectedIcon('📋');
    setSelectedAssignee(undefined);
    setSelectedDateTime(new Date());
    setRecurrencePattern(null);
  }, [visible, mode, props.chore]);

  // Auto-focus the name input when opening in add mode.
  // The delay allows the modal's entrance animation to settle first.
  useEffect(() => {
    if (!visible || mode !== 'add') return;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, AUTOFOCUS_DELAY_MS);

    return () => clearTimeout(timer);
  }, [visible, mode]);

  const handleAdd = () => {
    if (mode !== 'add' || !choreName.trim() || !selectedDateTime) return;

    const isRecurring = recurrencePattern !== null;

    props.onAddChore({
      title: choreName.trim(),
      icon: selectedIcon,
      assignee: selectedAssignee,
      dueDate: dayjs(selectedDateTime).format('MMM D, YYYY'),
      dueTime: dayjs(selectedDateTime).format('h:mm A'),
      section: getDueDateSection(selectedDateTime, isRecurring),
      isRecurring,
      recurrencePattern,
    });

    onClose();
  };

  const handleSave = () => {
    if (mode !== 'edit' || !props.chore || !choreName.trim()) {
      onClose();
      return;
    }

    const updates: Partial<Chore> & { assigneeId?: string } = {};

    if (choreName !== props.chore.title) {
      updates.title = choreName;
    }

    if (selectedIcon !== props.chore.icon) {
      updates.icon = selectedIcon;
    }

    const newIsRecurring = recurrencePattern !== null;
    if ((props.chore.isRecurring || false) !== newIsRecurring) {
      updates.isRecurring = newIsRecurring;
      if (newIsRecurring) {
        updates.section = 'recurring';
      }
    }

    if (selectedAssignee !== props.chore.assignee) {
      const member = members.find((m) => m.name === selectedAssignee);
      updates.assigneeId = member?.id || undefined;
      updates.assignee = selectedAssignee;
    }

    if (selectedDateTime) {
      updates.dueDate = dayjs(selectedDateTime).format('MMM D, YYYY');
      updates.dueTime = dayjs(selectedDateTime).format('h:mm A');
      updates.originalDate = selectedDateTime;
      updates.section = getDueDateSection(selectedDateTime, newIsRecurring);
    }

    if (Object.keys(updates).length > 0) {
      props.onUpdateChore(props.chore.id, updates);
    }

    onClose();
  };

  if (mode === 'edit' && !props.chore) {
    return null;
  }

  const submitDisabled = !choreName.trim();
  const handleSubmit = mode === 'add' ? handleAdd : handleSave;

  const modalTitle = mode === 'add' ? t('modal.addTitle') : t('modal.editTitle');
  const submitText = mode === 'add' ? t('modal.submitAdd') : t('modal.submitSave');

  const recurrenceOptions: Array<{ value: 'daily' | 'weekly' | 'monthly' | null; labelKey: string }> = [
    { value: null, labelKey: 'modal.recurrence.none' },
    { value: 'daily', labelKey: 'modal.recurrence.daily' },
    { value: 'weekly', labelKey: 'modal.recurrence.weekly' },
    { value: 'monthly', labelKey: 'modal.recurrence.monthly' },
  ];

  return (
    <EntityFormModal
      visible={visible}
      onClose={onClose}
      title={modalTitle}
      submitText={submitText}
      cancelText={t('modal.cancel')}
      onSubmit={handleSubmit}
      submitColor={colors.chores}
      submitDisabled={submitDisabled}
    >
      <View style={[styles.addFormContainer, isRtlLayout && styles.modalSectionRtl]}>
        <View style={[styles.addForm, isRtlLayout && styles.addFormRtl]}>
          <TextInput
            ref={inputRef}
            style={[styles.input, isRtlLayout && styles.inputRtl, isRtlLayout && styles.modalTextRtl]}
            placeholder={t('modal.choreNamePlaceholder')}
            placeholderTextColor={colors.textMuted}
            value={choreName}
            onChangeText={setChoreName}
            onSubmitEditing={handleSubmit}
            returnKeyType="done"
          />
          {choreName.length > 0 && (
            <TouchableOpacity
              style={[styles.clearButton, isRtlLayout && styles.clearButtonRtl]}
              onPress={() => setChoreName('')}
            >
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.iconSelectionSection, isRtlLayout && styles.modalSectionRtl]}>
        <View style={isRtlLayout ? styles.rtlTextRow : undefined}>
          <Text style={[styles.assigneeLabel, isRtlLayout && styles.modalTextRtl]}>{t('modal.iconLabel')}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.iconList, isRtlLayout && styles.pickerContentRtl]}>
          {CHORE_ICONS.map((icon) => (
            <TouchableOpacity
              key={icon}
              style={[styles.iconOption, selectedIcon === icon && styles.iconOptionSelected]}
              onPress={() => setSelectedIcon(icon)}
            >
              <Text style={styles.iconOptionText}>{icon}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.recurrenceSection, isRtlLayout && styles.modalSectionRtl]}>
        <View style={isRtlLayout ? styles.rtlTextRow : undefined}>
          <Text style={[styles.assigneeLabel, isRtlLayout && styles.modalTextRtl]}>{t('modal.repeatLabel')}</Text>
        </View>
        <View style={[styles.recurrenceOptions, isRtlLayout && styles.recurrenceOptionsRtl]}>
          {recurrenceOptions.map(({ value, labelKey }) => (
            <TouchableOpacity
              key={labelKey}
              style={[styles.recurrenceOption, isRtlLayout && styles.recurrenceOptionRtl, recurrencePattern === value && styles.recurrenceOptionSelected]}
              onPress={() => setRecurrencePattern(value)}
            >
              <View style={isRtlLayout ? styles.rtlTextRow : undefined}>
                <Text
                  style={[
                    styles.recurrenceOptionText,
                    isRtlLayout && styles.modalTextRtl,
                    recurrencePattern === value && styles.recurrenceOptionTextSelected,
                  ]}
                >
                  {t(labelKey)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.dueDateSection}>
        <DateTimePicker
          value={selectedDateTime}
          onChange={setSelectedDateTime}
          label={t('modal.dueDateLabel')}
          placeholder={t('modal.dueDatePlaceholder')}
          minDate={new Date()}
          accentColor={colors.chores}
          displayFormat="MMM D, YYYY h:mm A"
        />
      </View>

      <View style={[styles.assigneeSection, isRtlLayout && styles.modalSectionRtl]}>
        <View style={isRtlLayout ? styles.rtlTextRow : undefined}>
          <Text style={[styles.assigneeLabel, isRtlLayout && styles.modalTextRtl]}>{t('modal.assignLabel')}</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.assigneeScroll}
          contentContainerStyle={[styles.assigneeScrollContent, isRtlLayout && styles.pickerContentRtl]}
        >
          <TouchableOpacity
            style={[styles.assigneeChip, !selectedAssignee && styles.assigneeChipSelected]}
            onPress={() => setSelectedAssignee(undefined)}
          >
            <Text style={[styles.assigneeChipText, isRtlLayout && styles.modalTextRtl, !selectedAssignee && styles.assigneeChipTextSelected]}>
              {t('modal.assigneeUnassigned')}
            </Text>
          </TouchableOpacity>
          {members.map((member) => (
            <TouchableOpacity
              key={member.id}
              style={[
                styles.assigneeChip,
                selectedAssignee === member.name && styles.assigneeChipSelected,
                { borderColor: member.color || colors.textMuted },
              ]}
              onPress={() => setSelectedAssignee(member.name)}
            >
              <Text
                style={[
                  styles.assigneeChipText,
                  isRtlLayout && styles.modalTextRtl,
                  selectedAssignee === member.name && styles.assigneeChipTextSelected,
                ]}
              >
                {member.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.assigneeChip, styles.assigneeChipManage]}
            onPress={() => setShowManageHousehold(true)}
          >
            <Ionicons name="settings-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.assigneeChipText, isRtlLayout && styles.modalTextRtl]}>{t('modal.assigneeManage')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ManageHouseholdModal visible={showManageHousehold} onClose={() => setShowManageHousehold(false)} />
    </EntityFormModal>
  );
}
