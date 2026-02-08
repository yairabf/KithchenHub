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
      expect(getByText('Choose unit')).toBeTruthy();
      expect(getByText('Weight')).toBeTruthy();
      expect(getByText('Volume')).toBeTruthy();
      expect(getByText('Count')).toBeTruthy();
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
      expect(queryByText('Choose unit')).toBeNull();
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
      expect(getByText('gram')).toBeTruthy();
      expect(getByText('kilogram')).toBeTruthy();
      expect(getByText('ounce')).toBeTruthy();
      expect(getByText('pound')).toBeTruthy();
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
      expect(getByText('milliliter')).toBeTruthy();
      expect(getByText('liter')).toBeTruthy();
      expect(getByText('teaspoon')).toBeTruthy();
      expect(getByText('tablespoon')).toBeTruthy();
      expect(getByText('cup')).toBeTruthy();
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
      expect(getByText('piece')).toBeTruthy();
      expect(getByText('clove')).toBeTruthy();
      expect(getByText('slice')).toBeTruthy();
      expect(getByText('bunch')).toBeTruthy();
      expect(getByText('can')).toBeTruthy();
      expect(getByText('bottle')).toBeTruthy();
      expect(getByText('packet')).toBeTruthy();
      expect(getByText('stick')).toBeTruthy();
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
      expect(getByText('gram')).toBeTruthy();
      fireEvent.press(getByText('Volume'));
      expect(getByText('milliliter')).toBeTruthy();
      expect(getByText('teaspoon')).toBeTruthy();
      fireEvent.press(getByText('Count'));
      expect(getByText('piece')).toBeTruthy();
      expect(getByText('can')).toBeTruthy();
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
      fireEvent.press(getByText('tablespoon'));
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
      fireEvent.press(getByText('None'));
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
      expect(getByText('None')).toBeTruthy();
    });
  });
});
