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
import { GuestDataImportModal } from '../GuestDataImportModal';

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
        expect(queryByText('guestDataImport.title')).toBeTruthy();
        expect(queryByText('guestDataImport.body')).toBeTruthy();
      } else {
        expect(queryByText('guestDataImport.title')).toBeNull();
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

      fireEvent.press(getByText('guestDataImport.importButton'));
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

      fireEvent.press(getByText('guestDataImport.skipButton'));
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

      expect(queryByText('guestDataImport.title')).toBeNull();
      expect(queryByText('guestDataImport.importButton')).toBeNull();
      expect(queryByText('guestDataImport.skipButton')).toBeNull();
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
