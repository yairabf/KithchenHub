import React, { useState, useCallback, useMemo } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/he';
import 'dayjs/locale/ar';
import { useTranslation } from 'react-i18next';
import { DateTimePickerButton } from './DateTimePickerButton';
import { DateTimePickerModal } from './DateTimePickerModal';
import { DateTimePickerProps } from './types';
import { colors } from '../../../theme';

export function DateTimePicker({
  value,
  onChange,
  label,
  placeholder,
  minDate,
  maxDate,
  accentColor = colors.primary,
  disabled = false,
  displayFormat = 'MMM D, YYYY h:mm A',
  timeFormat = '12h',
  minuteInterval = 1,
}: DateTimePickerProps) {
  const { t, i18n } = useTranslation('common');
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

  const locale = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
  const placeholderText = placeholder ?? t('dateTimePicker.placeholder');

  const formattedValue = useMemo(() => {
    if (!value) return null;
    return dayjs(value).locale(locale).format(displayFormat);
  }, [value, locale, displayFormat]);

  return (
    <>
      <DateTimePickerButton
        label={label}
        value={formattedValue}
        placeholder={placeholderText}
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
