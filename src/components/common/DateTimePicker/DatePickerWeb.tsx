import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../../theme';

interface DatePickerWebProps {
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  accentColor: string;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function DatePickerWeb({
  value,
  onChange,
  minDate,
  maxDate,
  accentColor,
}: DatePickerWebProps) {
  const [viewDate, setViewDate] = useState(() => new Date(value));

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const selectedDate = useMemo(() => {
    const d = new Date(value);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [value]);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();

    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Previous month days to show
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean; isDisabled: boolean }[] = [];

    // Add previous month's days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        isDisabled: isDateDisabled(date, minDate, maxDate),
      });
    }

    // Add current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        isDisabled: isDateDisabled(date, minDate, maxDate),
      });
    }

    // Add next month's days to complete the grid (6 rows)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isDisabled: isDateDisabled(date, minDate, maxDate),
      });
    }

    return days;
  }, [viewDate, minDate, maxDate]);

  const handlePrevMonth = useCallback(() => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleDayPress = useCallback((date: Date) => {
    // Preserve the time from the current value
    const newDate = new Date(value);
    newDate.setFullYear(date.getFullYear());
    newDate.setMonth(date.getMonth());
    newDate.setDate(date.getDate());
    onChange(newDate);
  }, [value, onChange]);

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with month/year and navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handlePrevMonth}
          style={styles.navButton}
          accessibilityLabel="Previous month"
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.monthYearText}>
          {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </Text>

        <TouchableOpacity
          onPress={handleNextMonth}
          style={styles.navButton}
          accessibilityLabel="Next month"
        >
          <Ionicons name="chevron-forward" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Days of week header */}
      <View style={styles.weekHeader}>
        {DAYS_OF_WEEK.map((day) => (
          <View key={day} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.daysGrid}>
        {calendarDays.map((dayInfo, index) => {
          const isToday = isSameDay(dayInfo.date, today);
          const isSelected = isSameDay(dayInfo.date, selectedDate);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                isSelected && [styles.dayCellSelected, { backgroundColor: accentColor }],
                isToday && !isSelected && styles.dayCellToday,
              ]}
              onPress={() => !dayInfo.isDisabled && handleDayPress(dayInfo.date)}
              disabled={dayInfo.isDisabled}
              accessibilityLabel={`${dayInfo.date.toDateString()}${isToday ? ', today' : ''}${isSelected ? ', selected' : ''}`}
              accessibilityState={{ disabled: dayInfo.isDisabled, selected: isSelected }}
            >
              <Text
                style={[
                  styles.dayText,
                  !dayInfo.isCurrentMonth && styles.dayTextOtherMonth,
                  dayInfo.isDisabled && styles.dayTextDisabled,
                  isSelected && styles.dayTextSelected,
                  isToday && !isSelected && [styles.dayTextToday, { color: accentColor }],
                ]}
              >
                {dayInfo.date.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function isDateDisabled(date: Date, minDate?: Date, maxDate?: Date): boolean {
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  if (minDate) {
    const min = new Date(minDate);
    min.setHours(0, 0, 0, 0);
    if (compareDate < min) return true;
  }

  if (maxDate) {
    const max = new Date(maxDate);
    max.setHours(0, 0, 0, 0);
    if (compareDate > max) return true;
  }

  return false;
}

const CELL_SIZE = 40;

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  navButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.full,
  },
  monthYearText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekDayCell: {
    width: CELL_SIZE,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  dayTextOtherMonth: {
    color: colors.textMuted,
    opacity: 0.5,
  },
  dayTextDisabled: {
    color: colors.textMuted,
    opacity: 0.3,
  },
  dayTextSelected: {
    color: colors.textLight,
    fontWeight: '700',
  },
  dayTextToday: {
    fontWeight: '700',
  },
});
