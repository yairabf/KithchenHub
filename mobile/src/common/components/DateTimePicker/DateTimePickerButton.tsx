import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, spacing, borderRadius } from '../../../theme';
import { DateTimePickerButtonProps } from './types';

export function DateTimePickerButton({
  label,
  value,
  placeholder,
  accentColor,
  disabled,
  onPress,
}: DateTimePickerButtonProps) {
  const { t } = useTranslation('common');
  const pickerLabel = label || t('dateTimePicker.defaultLabel');
  const displayValue = value || placeholder;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t('dateTimePicker.accessibility.picker', { value: `${pickerLabel}, ${displayValue}` })}
        accessibilityHint={t('dateTimePicker.accessibility.hint')}
        accessibilityState={{ disabled }}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="calendar-outline" size={20} color={accentColor} />
          {value && (
            <Ionicons
              name="time-outline"
              size={16}
              color={accentColor}
              style={styles.timeIcon}
            />
          )}
        </View>
        <Text
          style={[styles.buttonText, !value && styles.buttonPlaceholder]}
          numberOfLines={1}
        >
          {displayValue}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.divider,
    gap: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginStart: 4,
  },
  buttonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  buttonPlaceholder: {
    color: colors.textMuted,
    fontWeight: '400',
  },
});
