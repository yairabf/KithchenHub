/**
 * Test file for GuestDataImportModal component
 * 
 * Setup required:
 * 1. Install testing dependencies:
 *    npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-expo
 * 
 * 2. Add to package.json:
 *    "jest": {
 *      "preset": "jest-expo",
 *      "transformIgnorePatterns": [
 *        "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
 *      ]
 *    }
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
    runOnJS: (fn: any) => fn,
  };
});

const { GuestDataImportModal } = require('../../GuestDataImportModal');

describe('GuestDataImportModal', () => {
  describe.each([
    ['visible true', true, true],
    ['visible false', false, false],
  ])('when %s', (description, visible, expectedVisible) => {
    it(`should ${expectedVisible ? 'show' : 'hide'} modal`, () => {
      const onImport = jest.fn();
      const onSkip = jest.fn();
      const { queryByText } = render(
        <GuestDataImportModal
          visible={visible}
          onImport={onImport}
          onSkip={onSkip}
        />
      );

      if (expectedVisible) {
        expect(queryByText('Found existing data')).toBeTruthy();
        expect(queryByText('We found recipes or plans from your guest session. Would you like to import them to your account?')).toBeTruthy();
      } else {
        expect(queryByText('Found existing data')).toBeNull();
      }
    });
  });

  describe('onImport callback', () => {
    it('should call onImport when import button is pressed', () => {
      const onImport = jest.fn();
      const onSkip = jest.fn();
      const { getByText } = render(
        <GuestDataImportModal
          visible={true}
          onImport={onImport}
          onSkip={onSkip}
        />
      );

      fireEvent.press(getByText('Import local data'));
      expect(onImport).toHaveBeenCalledTimes(1);
      expect(onSkip).not.toHaveBeenCalled();
    });
  });

  describe('onSkip callback', () => {
    it('should call onSkip when skip button is pressed', () => {
      const onImport = jest.fn();
      const onSkip = jest.fn();
      const { getByText } = render(
        <GuestDataImportModal
          visible={true}
          onImport={onImport}
          onSkip={onSkip}
        />
      );

      jest.useFakeTimers();
      const cancelText = getByText('Not now');
      fireEvent.press((cancelText.parent as any) ?? cancelText);
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
      expect(onSkip).toHaveBeenCalledTimes(1);
      expect(onImport).not.toHaveBeenCalled();
    });
  });

  describe('modal visibility edge cases', () => {
    it('should not render modal content when not visible', () => {
      const onImport = jest.fn();
      const onSkip = jest.fn();
      const { queryByText } = render(
        <GuestDataImportModal
          visible={false}
          onImport={onImport}
          onSkip={onSkip}
        />
      );

      expect(queryByText('Found existing data')).toBeNull();
      expect(queryByText('Import local data')).toBeNull();
      expect(queryByText('Not now')).toBeNull();
    });
  });

  describe('callback behavior', () => {
    it('should not call callbacks when modal is not visible', () => {
      const onImport = jest.fn();
      const onSkip = jest.fn();
      const { queryByText } = render(
        <GuestDataImportModal
          visible={false}
          onImport={onImport}
          onSkip={onSkip}
        />
      );

      // Even if buttons exist (they shouldn't), callbacks shouldn't fire
      expect(onImport).not.toHaveBeenCalled();
      expect(onSkip).not.toHaveBeenCalled();
    });
  });
});
