/**
 * UnitPicker: filter by type, selection callback, None option.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  return {
    ...Reanimated,
    runOnJS: (fn: (arg: any) => void) => fn,
  };
});

const { UnitPicker } = require('../UnitPicker');

describe('UnitPicker', () => {
  const onClose = jest.fn();
  const onSelectUnit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('visibility', () => {
    it('should show modal content when visible', () => {
      const { getByText } = render(
        <UnitPicker
          visible={true}
          onClose={onClose}
          selectedUnit=""
          onSelectUnit={onSelectUnit}
        />
      );
      expect(getByText('form.unitPicker.title')).toBeTruthy();
      expect(getByText('form.unitPicker.filters.weight')).toBeTruthy();
      expect(getByText('form.unitPicker.filters.volume')).toBeTruthy();
      expect(getByText('form.unitPicker.filters.count')).toBeTruthy();
    });

    it('should not show modal content when not visible', () => {
      const { queryByText } = render(
        <UnitPicker
          visible={false}
          onClose={onClose}
          selectedUnit=""
          onSelectUnit={onSelectUnit}
        />
      );
      expect(queryByText('form.unitPicker.title')).toBeNull();
    });
  });

  describe('filter by type', () => {
    it('should show weight units when Weight filter is selected', () => {
      const { getByText } = render(
        <UnitPicker
          visible={true}
          onClose={onClose}
          selectedUnit=""
          onSelectUnit={onSelectUnit}
          initialFilter="weight"
        />
      );
      expect(getByText('form.units.g')).toBeTruthy();
      expect(getByText('form.units.kg')).toBeTruthy();
      expect(getByText('form.units.oz')).toBeTruthy();
      expect(getByText('form.units.lb')).toBeTruthy();
    });

    it('should show volume units when Volume filter is selected', () => {
      const { getByText } = render(
        <UnitPicker
          visible={true}
          onClose={onClose}
          selectedUnit=""
          onSelectUnit={onSelectUnit}
          initialFilter="volume"
        />
      );
      expect(getByText('form.units.ml')).toBeTruthy();
      expect(getByText('form.units.l')).toBeTruthy();
      expect(getByText('form.units.tsp')).toBeTruthy();
      expect(getByText('form.units.tbsp')).toBeTruthy();
      expect(getByText('form.units.cup')).toBeTruthy();
    });

    it('should show count units when Count filter is selected', () => {
      const { getByText } = render(
        <UnitPicker
          visible={true}
          onClose={onClose}
          selectedUnit=""
          onSelectUnit={onSelectUnit}
          initialFilter="count"
        />
      );
      expect(getByText('form.units.piece')).toBeTruthy();
      expect(getByText('form.units.clove')).toBeTruthy();
      expect(getByText('form.units.slice')).toBeTruthy();
      expect(getByText('form.units.bunch')).toBeTruthy();
      expect(getByText('form.units.can')).toBeTruthy();
      expect(getByText('form.units.bottle')).toBeTruthy();
      expect(getByText('form.units.packet')).toBeTruthy();
      expect(getByText('form.units.stick')).toBeTruthy();
    });

    it('should switch list when filter chip is pressed', () => {
      const { getByText } = render(
        <UnitPicker
          visible={true}
          onClose={onClose}
          selectedUnit=""
          onSelectUnit={onSelectUnit}
          initialFilter="weight"
        />
      );
      expect(getByText('form.units.g')).toBeTruthy();
      fireEvent.press(getByText('form.unitPicker.filters.volume'));
      expect(getByText('form.units.ml')).toBeTruthy();
      expect(getByText('form.units.tsp')).toBeTruthy();
      fireEvent.press(getByText('form.unitPicker.filters.count'));
      expect(getByText('form.units.piece')).toBeTruthy();
      expect(getByText('form.units.can')).toBeTruthy();
    });
  });

  describe('selection callback', () => {
    it('should call onSelectUnit with code and close when a unit is tapped', () => {
      const { getByText } = render(
        <UnitPicker
          visible={true}
          onClose={onClose}
          selectedUnit=""
          onSelectUnit={onSelectUnit}
          initialFilter="volume"
        />
      );
      fireEvent.press(getByText('form.units.tbsp'));
      expect(onSelectUnit).toHaveBeenCalledWith('tbsp');
      expect(onSelectUnit).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onSelectUnit with empty string when None is tapped', () => {
      const { getByText } = render(
        <UnitPicker
          visible={true}
          onClose={onClose}
          selectedUnit="tbsp"
          onSelectUnit={onSelectUnit}
          initialFilter="volume"
        />
      );
      fireEvent.press(getByText('form.unitPicker.none'));
      expect(onSelectUnit).toHaveBeenCalledWith('');
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('None option', () => {
    it('should show None in the list', () => {
      const { getByText } = render(
        <UnitPicker
          visible={true}
          onClose={onClose}
          selectedUnit=""
          onSelectUnit={onSelectUnit}
        />
      );
      expect(getByText('form.unitPicker.none')).toBeTruthy();
    });
  });
});
