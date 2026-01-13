import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CenteredModal } from '../CenteredModal';
import { DatePickerWeb } from './DatePickerWeb';
import { TimePickerWeb } from './TimePickerWeb';
import { colors, spacing, borderRadius } from '../../../theme';
import { DateTimePickerModalProps, ActiveTab } from './types';

export function DateTimePickerModal({
  visible,
  onClose,
  onConfirm,
  value,
  minDate,
  maxDate,
  accentColor,
  timeFormat,
  minuteInterval,
}: DateTimePickerModalProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('date');
  const [tempDate, setTempDate] = useState<Date>(value || new Date());
  const [showAndroidDatePicker, setShowAndroidDatePicker] = useState(false);
  const [showAndroidTimePicker, setShowAndroidTimePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setTempDate(value || new Date());
      setActiveTab('date');
      setShowAndroidDatePicker(false);
      setShowAndroidTimePicker(false);
    }
  }, [visible, value]);

  const handleConfirm = () => {
    onConfirm(tempDate);
  };

  const handleWebDateChange = (date: Date) => {
    setTempDate(date);
    // Auto-advance to time tab after selecting date
    setActiveTab('time');
  };

  const handleNativeDateTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      // Handle dismissal (user pressed cancel)
      if (event.type === 'dismissed') {
        setShowAndroidDatePicker(false);
        setShowAndroidTimePicker(false);
        return;
      }

      if (showAndroidDatePicker) {
        setShowAndroidDatePicker(false);
        if (selectedDate) {
          setTempDate(selectedDate);
        }
      } else if (showAndroidTimePicker) {
        setShowAndroidTimePicker(false);
        if (selectedDate) {
          setTempDate(selectedDate);
        }
      }
    } else if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const handleWebTimeChange = (hours: number, minutes: number) => {
    const newDate = new Date(tempDate);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    setTempDate(newDate);
  };

  const renderTabButton = (tab: ActiveTab, icon: string, label: string) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        style={[
          styles.tab,
          isActive && [styles.tabActive, { borderColor: accentColor }],
        ]}
        onPress={() => setActiveTab(tab)}
        activeOpacity={0.7}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={`${label} tab`}
      >
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={18}
          color={isActive ? accentColor : colors.textSecondary}
        />
        <Text
          style={[
            styles.tabText,
            isActive && [styles.tabTextActive, { color: accentColor }],
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (Platform.OS === 'ios') {
      return (
        <View style={styles.nativePickerContainer}>
          <DateTimePicker
            value={tempDate}
            mode={activeTab === 'date' ? 'date' : 'time'}
            display="spinner"
            onChange={handleNativeDateTimeChange}
            minimumDate={minDate}
            maximumDate={maxDate}
            minuteInterval={minuteInterval}
            textColor={colors.textPrimary}
          />
        </View>
      );
    }

    if (Platform.OS === 'android') {
      return (
        <View style={styles.androidPickerContainer}>
          <Text style={styles.androidPreviewLabel}>Selected:</Text>
          <Text style={styles.androidPreviewText}>
            {tempDate.toLocaleDateString()} {tempDate.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              hour12: timeFormat === '12h'
            })}
          </Text>
          <TouchableOpacity
            style={[styles.androidPickerButton, { borderColor: accentColor }]}
            onPress={() => {
              setShowAndroidTimePicker(false);
              setShowAndroidDatePicker(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Change date"
          >
            <Ionicons name="calendar" size={20} color={accentColor} />
            <Text style={[styles.androidPickerButtonText, { color: accentColor }]}>
              Change Date
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.androidPickerButton, { borderColor: accentColor }]}
            onPress={() => {
              setShowAndroidDatePicker(false);
              setShowAndroidTimePicker(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Change time"
          >
            <Ionicons name="time" size={20} color={accentColor} />
            <Text style={[styles.androidPickerButtonText, { color: accentColor }]}>
              Change Time
            </Text>
          </TouchableOpacity>

          {showAndroidDatePicker && (
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="default"
              onChange={handleNativeDateTimeChange}
              minimumDate={minDate}
              maximumDate={maxDate}
            />
          )}
          {showAndroidTimePicker && (
            <DateTimePicker
              value={tempDate}
              mode="time"
              display="default"
              onChange={handleNativeDateTimeChange}
              minuteInterval={minuteInterval}
            />
          )}
        </View>
      );
    }

    // Web
    if (activeTab === 'date') {
      return (
        <DatePickerWeb
          value={tempDate}
          onChange={handleWebDateChange}
          minDate={minDate}
          maxDate={maxDate}
          accentColor={accentColor}
        />
      );
    }

    return (
      <TimePickerWeb
        hours={tempDate.getHours()}
        minutes={tempDate.getMinutes()}
        onChange={handleWebTimeChange}
        minuteInterval={minuteInterval}
        accentColor={accentColor}
        timeFormat={timeFormat}
      />
    );
  };

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      title="Select Date & Time"
      confirmText="Confirm"
      onConfirm={handleConfirm}
      confirmColor={accentColor}
    >
      {/* Tab Switcher - only show on iOS and Web */}
      {Platform.OS !== 'android' && (
        <View style={styles.tabContainer} accessibilityRole="tablist">
          {renderTabButton('date', 'calendar', 'Date')}
          {renderTabButton('time', 'time', 'Time')}
        </View>
      )}

      {renderContent()}
    </CenteredModal>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  nativePickerContainer: {
    marginVertical: spacing.sm,
  },
  androidPickerContainer: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  androidPreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  androidPreviewText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  androidPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    width: '100%',
    justifyContent: 'center',
  },
  androidPickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
