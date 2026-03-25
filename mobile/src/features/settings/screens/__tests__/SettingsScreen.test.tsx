import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, ActivityIndicator } from 'react-native';

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

const mockDeleteMyAccount = jest.fn();
jest.mock('../../services/accountService', () => ({
  accountService: {
    deleteMyAccount: () => mockDeleteMyAccount(),
  },
}));

jest.mock('../../utils/errorMessages', () => ({
  getDeleteAccountErrorMessage: jest.fn((error: any, t: any) => {
    if (error?.name === 'NetworkError') {
      return t('deleteAccountErrorOffline');
    }
    if (error?.name === 'ApiError') {
      if (error.statusCode === 401) {
        return t('deleteAccountErrorUnauthorized');
      }
      if (error.statusCode === 429) {
        return t('deleteAccountErrorRateLimit');
      }
      if (error.statusCode >= 500) {
        return t('deleteAccountErrorServer');
      }
    }
    return t('deleteAccountErrorGeneric');
  }),
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
        deleteAccount: 'Delete account',
        deleteAccountConfirmTitle: 'Delete account?',
        deleteAccountConfirmMessage:
          'This permanently deletes your account and data. This action cannot be undone.',
        deleteAccountCancel: 'Cancel',
        deleteAccountConfirmButton: 'Delete permanently',
        deleteAccountRetry: 'Retry',
        deleteAccountErrorTitle: 'Unable to delete account',
        deleteAccountErrorOffline: 'You are offline. Connect to the internet and try again.',
        deleteAccountErrorUnauthorized: 'Your session expired. Please sign in again and retry.',
        deleteAccountErrorRateLimit: 'Too many attempts. Please wait a moment and try again.',
        deleteAccountErrorServer: 'Server error while deleting your account. Please try again shortly.',
        deleteAccountErrorGeneric: 'Something went wrong while deleting your account. Please try again.',
      }[key] ?? key),
    i18n: { language: 'en', dir: () => 'ltr' },
  }),
}));

const mockLegalLinks = {
  privacyPolicyUrl: 'https://api.example.com/privacy',
  termsOfServiceUrl: 'https://api.example.com/terms',
};
jest.mock('../../../../contexts/LegalLinksContext', () => ({
  useLegalLinks: () => mockLegalLinks,
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
        React.createElement(
          TouchableOpacity,
          {
            testID: 'select-english',
            onPress: async () => {
              await setAppLanguage('en');
              onClose();
            },
          },
          React.createElement(Text, null, 'Select')
        )
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
  const alertSpy = jest.spyOn(Alert, 'alert');

  const defaultAuthContext = {
    user: { id: '1', email: 'test@example.com', name: 'Test User', isGuest: false, role: 'Admin' },
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
    alertSpy.mockImplementation(() => { });
  });

  afterAll(() => {
    consoleWarnSpy.mockRestore();
    alertSpy.mockRestore();
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
      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText('Privacy Policy'));
      expect(mockOpenLegalUrl).toHaveBeenCalledWith(mockLegalLinks.privacyPolicyUrl);
    });

    it('calls openLegalUrl with terms URL when Terms of Service row is pressed', () => {
      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText('Terms of Service'));
      expect(mockOpenLegalUrl).toHaveBeenCalledWith(mockLegalLinks.termsOfServiceUrl);
    });
  });

  describe('Delete account', () => {
    it('opens confirmation alert when Delete account row is pressed', () => {
      const { getByText } = render(<SettingsScreen />);

      fireEvent.press(getByText('Delete account'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete account?',
        'This permanently deletes your account and data. This action cannot be undone.',
        expect.any(Array)
      );
    });

    it('deletes account and signs out after confirmation', async () => {
      mockDeleteMyAccount.mockResolvedValueOnce(undefined);

      const { getByText } = render(<SettingsScreen />);
      fireEvent.press(getByText('Delete account'));

      const buttons = (Alert.alert as jest.Mock).mock.calls[0][2] as Array<{
        text: string;
        onPress?: () => void;
      }>;
      const confirmButton = buttons.find((button) => button.text === 'Delete permanently');

      expect(confirmButton?.onPress).toBeDefined();
      await act(async () => {
        confirmButton?.onPress?.();
      });

      await waitFor(() => {
        expect(mockDeleteMyAccount).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });
    });

    describe('error handling', () => {
      class NetworkError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'NetworkError';
        }
      }

      class ApiError extends Error {
        constructor(message: string, public statusCode: number) {
          super(message);
          this.name = 'ApiError';
        }
      }

      describe.each([
        ['NetworkError', new NetworkError('Offline'), 'You are offline. Connect to the internet and try again.'],
        ['ApiError 401', new ApiError('Unauthorized', 401), 'Your session expired. Please sign in again and retry.'],
        ['ApiError 429', new ApiError('Rate limit', 429), 'Too many attempts. Please wait a moment and try again.'],
        ['ApiError 500', new ApiError('Server error', 500), 'Server error while deleting your account. Please try again shortly.'],
        ['ApiError 502', new ApiError('Bad gateway', 502), 'Server error while deleting your account. Please try again shortly.'],
        ['Unknown error', new Error('Unknown'), 'Something went wrong while deleting your account. Please try again.'],
      ])('with %s', (description, error, expectedMessage) => {
        it('shows correct error message', async () => {
          mockDeleteMyAccount.mockRejectedValueOnce(error);

          const { getByText } = render(<SettingsScreen />);
          fireEvent.press(getByText('Delete account'));

          const confirmButtons = (Alert.alert as jest.Mock).mock.calls[0][2] as Array<{
            text: string;
            onPress?: () => void;
          }>;
          const confirmButton = confirmButtons.find((button) => button.text === 'Delete permanently');

          await act(async () => {
            confirmButton?.onPress?.();
          });

          await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith(
              'Unable to delete account',
              expectedMessage,
              expect.any(Array)
            );
          });

          expect(mockSignOut).not.toHaveBeenCalled();
        });
      });

      it('provides retry button on error', async () => {
        mockDeleteMyAccount.mockRejectedValueOnce(new Error('Network failed'));

        const { getByText } = render(<SettingsScreen />);
        fireEvent.press(getByText('Delete account'));

        const confirmButtons = (Alert.alert as jest.Mock).mock.calls[0][2] as Array<{
          text: string;
          onPress?: () => void;
        }>;
        const confirmButton = confirmButtons.find((button) => button.text === 'Delete permanently');

        await act(async () => {
          confirmButton?.onPress?.();
        });

        await waitFor(() => {
          const errorButtons = (Alert.alert as jest.Mock).mock.calls[1][2] as Array<{
            text: string;
            onPress?: () => void;
          }>;
          const retryButton = errorButtons.find((button) => button.text === 'Retry');
          const cancelButton = errorButtons.find((button) => button.text === 'Cancel');

          expect(retryButton).toBeDefined();
          expect(cancelButton).toBeDefined();
        });
      });

      it('retries deletion when retry button is pressed', async () => {
        mockDeleteMyAccount
          .mockRejectedValueOnce(new Error('Network failed'))
          .mockResolvedValueOnce(undefined);

        const { getByText } = render(<SettingsScreen />);
        fireEvent.press(getByText('Delete account'));

        const confirmButtons = (Alert.alert as jest.Mock).mock.calls[0][2] as Array<{
          text: string;
          onPress?: () => void;
        }>;
        const confirmButton = confirmButtons.find((button) => button.text === 'Delete permanently');

        await act(async () => {
          confirmButton?.onPress?.();
        });

        await waitFor(() => {
          expect(Alert.alert).toHaveBeenCalledTimes(2);
        });

        const errorButtons = (Alert.alert as jest.Mock).mock.calls[1][2] as Array<{
          text: string;
          onPress?: () => void;
        }>;
        const retryButton = errorButtons.find((button) => button.text === 'Retry');

        await act(async () => {
          retryButton?.onPress?.();
        });

        await waitFor(() => {
          expect(mockDeleteMyAccount).toHaveBeenCalledTimes(2);
        });
      });
    });

    describe('loading state', () => {
      it('shows activity indicator while deleting', async () => {
        let resolveDelete: () => void;
        const deletePromise = new Promise<void>((resolve) => {
          resolveDelete = resolve;
        });
        mockDeleteMyAccount.mockReturnValueOnce(deletePromise);

        const { getByText, UNSAFE_queryByType } = render(<SettingsScreen />);
        fireEvent.press(getByText('Delete account'));

        const confirmButtons = (Alert.alert as jest.Mock).mock.calls[0][2] as Array<{
          text: string;
          onPress?: () => void;
        }>;
        const confirmButton = confirmButtons.find((button) => button.text === 'Delete permanently');

        act(() => {
          confirmButton?.onPress?.();
        });

        await waitFor(() => {
          expect(UNSAFE_queryByType(ActivityIndicator)).toBeTruthy();
        });

        act(() => {
          resolveDelete!();
        });
      });

      it('prevents multiple delete attempts while loading', async () => {
        let resolveDelete: () => void;
        const deletePromise = new Promise<void>((resolve) => {
          resolveDelete = resolve;
        });
        mockDeleteMyAccount.mockReturnValueOnce(deletePromise);

        const { getByText } = render(<SettingsScreen />);
        
        // First press
        fireEvent.press(getByText('Delete account'));
        const confirmButtons = (Alert.alert as jest.Mock).mock.calls[0][2] as Array<{
          text: string;
          onPress?: () => void;
        }>;
        const confirmButton = confirmButtons.find((button) => button.text === 'Delete permanently');

        act(() => {
          confirmButton?.onPress?.();
        });

        // Try to press delete button again while first request is in progress
        fireEvent.press(getByText('Delete account'));

        // Should only show one confirmation dialog
        expect(Alert.alert).toHaveBeenCalledTimes(1);

        act(() => {
          resolveDelete!();
        });
      });
    });
  });
});
