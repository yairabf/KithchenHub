import React, { useState, useCallback } from 'react';
import dayjs from 'dayjs';
import { DateTimePickerButton } from './DateTimePickerButton';
import { DateTimePickerModal } from './DateTimePickerModal';
import { DateTimePickerProps } from './types';
import { colors } from '../../../theme';

export function DateTimePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date & time',
  minDate,
  maxDate,
  accentColor = colors.primary,
  disabled = false,
  displayFormat = 'MMM D, YYYY h:mm A',
  timeFormat = '12h',
  minuteInterval = 1,
}: DateTimePickerProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleConfirm = useCallback(
    (date: Date) => {
      onChange(date);
      setModalVisible(false);
    },
    [onChange]
  );

  const handleClose = useCallback(() => {
    setModalVisible(false);
  }, []);

  const handleOpen = useCallback(() => {
    setModalVisible(true);
  }, []);

  const formattedValue = value ? dayjs(value).format(displayFormat) : null;

  return (
    <>
      <DateTimePickerButton
        label={label}
        value={formattedValue}
        placeholder={placeholder}
        accentColor={accentColor}
        disabled={disabled}
        onPress={handleOpen}
      />

      <DateTimePickerModal
        visible={modalVisible}
        onClose={handleClose}
        onConfirm={handleConfirm}
        value={value}
        minDate={minDate}
        maxDate={maxDate}
        accentColor={accentColor}
        timeFormat={timeFormat}
        minuteInterval={minuteInterval}
      />
    </>
  );
}
