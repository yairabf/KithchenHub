import React, { useRef, useEffect, useCallback, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { colors, spacing, borderRadius } from '../../../theme';
import { TimePickerWebProps } from './types';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface WheelPickerProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  accentColor: string;
}

const WheelPicker = memo(function WheelPicker({ items, selectedIndex, onSelect, accentColor }: WheelPickerProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const isScrolling = useRef(false);

  useEffect(() => {
    if (scrollViewRef.current && !isScrolling.current) {
      scrollViewRef.current.scrollTo({
        y: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
    }
  }, [selectedIndex]);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isScrolling.current = false;
      const offsetY = event.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
      if (clampedIndex !== selectedIndex) {
        onSelect(clampedIndex);
      }
    },
    [items.length, selectedIndex, onSelect]
  );

  const handleScrollBegin = useCallback(() => {
    isScrolling.current = true;
  }, []);

  return (
    <View style={styles.wheelContainer}>
      <View
        style={[
          styles.selectionHighlight,
          { backgroundColor: `${accentColor}20` },
        ]}
      />
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScrollBeginDrag={handleScrollBegin}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled
      >
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <View key={index} style={styles.wheelItem}>
              <Text
                style={[
                  styles.wheelItemText,
                  isSelected && { color: accentColor, fontWeight: '700' },
                ]}
              >
                {item}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
});

export function TimePickerWeb({
  hours,
  minutes,
  onChange,
  minuteInterval,
  accentColor,
  timeFormat,
}: TimePickerWebProps) {
  const is12Hour = timeFormat === '12h';
  const isPM = hours >= 12;
  const displayHours = is12Hour ? (hours % 12 || 12) : hours;

  const hourItems = is12Hour
    ? Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i).toString().padStart(2, '0'))
    : Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

  const minuteItems = Array.from(
    { length: 60 / minuteInterval },
    (_, i) => (i * minuteInterval).toString().padStart(2, '0')
  );

  const hourIndex = is12Hour
    ? (displayHours === 12 ? 0 : displayHours)
    : hours;

  const minuteIndex = Math.floor(minutes / minuteInterval);

  const handleHourChange = useCallback(
    (index: number) => {
      let newHours: number;
      if (is12Hour) {
        const selectedHour = index === 0 ? 12 : index;
        newHours = isPM
          ? (selectedHour === 12 ? 12 : selectedHour + 12)
          : (selectedHour === 12 ? 0 : selectedHour);
      } else {
        newHours = index;
      }
      onChange(newHours, minutes);
    },
    [is12Hour, isPM, minutes, onChange]
  );

  const handleMinuteChange = useCallback(
    (index: number) => {
      const newMinutes = index * minuteInterval;
      onChange(hours, newMinutes);
    },
    [hours, minuteInterval, onChange]
  );

  const handlePeriodChange = useCallback(
    (newIsPM: boolean) => {
      let newHours: number;
      if (newIsPM && !isPM) {
        newHours = hours + 12;
      } else if (!newIsPM && isPM) {
        newHours = hours - 12;
      } else {
        return;
      }
      onChange(newHours, minutes);
    },
    [hours, isPM, minutes, onChange]
  );

  return (
    <View style={styles.container}>
      <View style={styles.pickersRow}>
        <WheelPicker
          items={hourItems}
          selectedIndex={hourIndex}
          onSelect={handleHourChange}
          accentColor={accentColor}
        />
        <Text style={styles.separator}>:</Text>
        <WheelPicker
          items={minuteItems}
          selectedIndex={minuteIndex}
          onSelect={handleMinuteChange}
          accentColor={accentColor}
        />
        {is12Hour && (
          <View style={styles.periodContainer}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                !isPM && { backgroundColor: `${accentColor}20` },
              ]}
              onPress={() => handlePeriodChange(false)}
              accessibilityRole="button"
              accessibilityLabel="AM"
              accessibilityState={{ selected: !isPM }}
            >
              <Text
                style={[
                  styles.periodText,
                  !isPM && { color: accentColor, fontWeight: '700' },
                ]}
              >
                AM
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                isPM && { backgroundColor: `${accentColor}20` },
              ]}
              onPress={() => handlePeriodChange(true)}
              accessibilityRole="button"
              accessibilityLabel="PM"
              accessibilityState={{ selected: isPM }}
            >
              <Text
                style={[
                  styles.periodText,
                  isPM && { color: accentColor, fontWeight: '700' },
                ]}
              >
                PM
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  pickersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelContainer: {
    height: PICKER_HEIGHT,
    width: 70,
    overflow: 'hidden',
    position: 'relative',
  },
  selectionHighlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderRadius: borderRadius.md,
    zIndex: 0,
  },
  scrollContent: {
    paddingVertical: ITEM_HEIGHT * 2,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelItemText: {
    fontSize: 22,
    color: colors.textMuted,
    fontWeight: '500',
  },
  separator: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginHorizontal: spacing.sm,
  },
  periodContainer: {
    marginLeft: spacing.md,
    gap: spacing.xs,
  },
  periodButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    cursor: 'pointer',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
