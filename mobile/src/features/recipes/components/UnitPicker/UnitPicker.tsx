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

const UNIT_TYPE_ORDER: UnitType[] = ['weight', 'volume', 'count'];
const UNIT_TYPE_LABELS: Record<UnitType, string> = {
  weight: 'Weight',
  volume: 'Volume',
  count: 'Count',
};

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
  const [filter, setFilter] = useState<UnitType>(initialFilter);

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
      title="Choose unit"
      showActions={false}
    >
      <View style={styles.filterRow}>
        {UNIT_TYPE_ORDER.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterChip, filter === type && styles.filterChipSelected]}
            onPress={() => setFilter(type)}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${UNIT_TYPE_LABELS[type]}`}
            accessibilityState={{ selected: filter === type }}
          >
            <Text
              style={[
                styles.filterChipText,
                filter === type && styles.filterChipTextSelected,
              ]}
            >
              {UNIT_TYPE_LABELS[type]}
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
              accessibilityLabel={getUnitLabel(code)}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.unitRowText,
                  isSelected && styles.unitRowTextSelected,
                ]}
              >
                {getUnitLabel(code)}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={[styles.unitRow, styles.noneRow, !selectedUnit && styles.unitRowSelected]}
          onPress={() => handleSelect('')}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="None"
          accessibilityState={{ selected: !selectedUnit }}
        >
          <Text
            style={[
              styles.unitRowText,
              !selectedUnit && styles.unitRowTextSelected,
            ]}
          >
            None
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </CenteredModal>
  );
}
