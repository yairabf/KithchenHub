/**
 * Test file for SettingsScreen
 * 
 * Setup required:
 * 1. Install testing dependencies:
 *    npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-expo
 * 
 * 2. Mock dependencies:
 *    - AuthContext
 *    - Toast component
 *    - CenteredModal
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Mock dependencies
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('../../../../contexts/HouseholdContext', () => ({
  useHousehold: jest.fn(() => ({
    members: [],
    isLoading: false,
    addMember: jest.fn(),
    removeMember: jest.fn(),
    getMemberById: jest.fn(),
  })),
}));
const manageHouseholdModalPath = require.resolve('../../components/ManageHouseholdModal');
jest.mock(manageHouseholdModalPath, () => ({
  ManageHouseholdModal: () => null,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        title: 'Settings',
        language: 'Language',
        privacyPolicy: 'Privacy Policy',
        termsOfService: 'Terms of Service',
        opensExternalLink: '(opens external link)',
      }[key] ?? key),
    i18n: { language: 'en' },
  }),
}));

const mockOpenLegalUrl = jest.fn().mockResolvedValue(undefined);
jest.mock('../../../../common/utils/legalLinks', () => ({
  openLegalUrl: (url: string) => mockOpenLegalUrl(url),
}));

const mockSetAppLanguage = jest.fn().mockResolvedValue(undefined);
jest.mock('../../../../i18n', () => ({
  i18n: { language: 'en' },
  setAppLanguage: mockSetAppLanguage,
}));

jest.mock('../../components/LanguageSelectorModal', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  const { setAppLanguage } = require('../../../../i18n');
  return {
    LanguageSelectorModal: ({
      visible,
      onClose,
    }: {
      visible: boolean;
      onClose: () => void;
    }) => {
      if (!visible) return null;
      return React.createElement(
        View,
        { testID: 'language-selector-modal' },
        React.createElement(Text, null, 'English'),
        React.createElement(TouchableOpacity, {
          testID: 'select-english',
          onPress: async () => {
            await setAppLanguage('en');
            onClose();
          },
        }, React.createElement(Text, null, 'Select'))
      );
    },
  };
});

const { SettingsScreen } = require('../SettingsScreen');
const { useAuth } = require('../../../../contexts/AuthContext');

describe('SettingsScreen', () => {
  const mockSignOut = jest.fn();
  const originalWarn = console.warn;
  const consoleWarnSpy = jest.spyOn(console, 'warn');

  const defaultAuthContext = {
    user: { id: '1', email: 'test@example.com', name: 'Test User', isGuest: false },
    signOut: mockSignOut,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue(defaultAuthContext);
    consoleWarnSpy.mockImplementation((message, ...args) => {
      if (typeof message === 'string' && message.includes('SafeAreaView has been deprecated')) {
        return;
      }
      originalWarn(message, ...args);
    });
  });

  afterAll(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('Language selector', () => {
    it('renders Language row with current language native name (English)', () => {
      const { getAllByText, getByText } = render(<SettingsScreen />);
      expect(getAllByText('Language').length).toBeGreaterThanOrEqual(1);
      expect(getByText('English')).toBeTruthy();
    });

    it('opens language selector modal when Language row is pressed', async () => {
      const { getByText, queryByTestId } = render(<SettingsScreen />);
      fireEvent.press(getByText('English'));
      await waitFor(() => {
        expect(queryByTestId('language-selector-modal')).toBeTruthy();
      });
    });

    it('calls setAppLanguage and closes modal when selecting English in modal', async () => {
      const { getByText, getByTestId, queryByTestId } = render(<SettingsScreen />);
      fireEvent.press(getByText('English'));
      await waitFor(() => {
        expect(queryByTestId('language-selector-modal')).toBeTruthy();
      });
      fireEvent.press(getByTestId('select-english'));
      await waitFor(() => {
        expect(mockSetAppLanguage).toHaveBeenCalledWith('en');
      });
      await waitFor(() => {
        expect(queryByTestId('language-selector-modal')).toBeNull();
      });
    });
  });

  describe('Legal links', () => {
    it('calls openLegalUrl with privacy URL when Privacy Policy row is pressed', () => {
      const { PRIVACY_POLICY_URL } = require('../../../../common/constants/legal');
      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText('Privacy Policy'));
      expect(mockOpenLegalUrl).toHaveBeenCalledWith(PRIVACY_POLICY_URL);
    });

    it('calls openLegalUrl with terms URL when Terms of Service row is pressed', () => {
      const { TERMS_OF_SERVICE_URL } = require('../../../../common/constants/legal');
      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText('Terms of Service'));
      expect(mockOpenLegalUrl).toHaveBeenCalledWith(TERMS_OF_SERVICE_URL);
    });
  });
});
