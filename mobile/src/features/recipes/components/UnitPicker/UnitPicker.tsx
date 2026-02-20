import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { CenteredModal } from '../../../../common/components/CenteredModal';
import {
  UNITS_BY_TYPE,
  getUnitLabel,
  type UnitType,
} from '../../constants';
import { styles } from './styles';
import type { UnitPickerProps } from './UnitPicker.types';
import { useTranslation } from 'react-i18next';

const UNIT_TYPE_ORDER: UnitType[] = ['weight', 'volume', 'count'];
/**
 * Modal unit picker with filter by type (Weight / Volume / Count).
 * Tapping a unit selects it and closes the picker. "None" clears the unit.
 */
export function UnitPicker({
  visible,
  onClose,
  selectedUnit,
  onSelectUnit,
  initialFilter = 'weight',
}: UnitPickerProps) {
  const { t } = useTranslation('recipes');
  const [filter, setFilter] = useState<UnitType>(initialFilter);

  const unitTypeLabels: Record<UnitType, string> = {
    weight: t('form.unitPicker.filters.weight'),
    volume: t('form.unitPicker.filters.volume'),
    count: t('form.unitPicker.filters.count'),
  };

  useEffect(() => {
    if (visible) {
      setFilter(initialFilter);
    }
  }, [visible, initialFilter]);

  const units = UNITS_BY_TYPE[filter];

  const handleSelect = (code: string) => {
    onSelectUnit(code);
    onClose();
  };

  return (
    <CenteredModal
      visible={visible}
      onClose={onClose}
      title={t('form.unitPicker.title')}
      showActions={false}
    >
      <View style={styles.filterRow}>
        {UNIT_TYPE_ORDER.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterChip, filter === type && styles.filterChipSelected]}
            onPress={() => setFilter(type)}
            accessibilityRole="button"
            accessibilityLabel={t('form.unitPicker.filterByTypeAccessibilityLabel', {
              type: unitTypeLabels[type],
            })}
            accessibilityState={{ selected: filter === type }}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === type && styles.filterChipTextSelected,
              ]}
            >
              {unitTypeLabels[type]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView
        style={styles.unitList}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {units.map((code) => {
          const isSelected = selectedUnit === code;
          return (
            <TouchableOpacity
              key={code}
              style={[styles.unitRow, isSelected && styles.unitRowSelected]}
              onPress={() => handleSelect(code)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={getUnitLabel(code, t)}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.unitRowText,
                  isSelected && styles.unitRowTextSelected,
                ]}
              >
                {getUnitLabel(code, t)}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={[styles.unitRow, styles.noneRow, !selectedUnit && styles.unitRowSelected]}
          onPress={() => handleSelect('')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('form.unitPicker.none')}
          accessibilityState={{ selected: !selectedUnit }}
        >
          <Text
            style={[
              styles.unitRowText,
              !selectedUnit && styles.unitRowTextSelected,
            ]}
          >
            {t('form.unitPicker.none')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </CenteredModal>
  );
}
