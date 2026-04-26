import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

const mockDeferred = (() => {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
})();

const mockSyncI18nToDetectedLocale = jest.fn().mockResolvedValue(undefined);
const mockI18n = {
  on: jest.fn(),
  off: jest.fn(),
};

jest.mock('../src/i18n/storage', () => ({
  getStoredLanguage: jest.fn().mockResolvedValue('he'),
}));

jest.mock('../src/i18n/localize', () => ({
  getLocales: jest.fn().mockReturnValue([]),
}));

jest.mock('../src/i18n/rtl', () => ({
  isRtlLanguage: jest.fn().mockImplementation((locale: string) => locale === 'he' || locale === 'ar' || locale === 'fa'),
}));

jest.mock('../src/i18n/localeNormalization', () => ({
  normalizeLocale: jest.fn().mockImplementation((locale: string) => locale.toLowerCase()),
}));

jest.mock('../src/i18n/syncI18nToDetectedLocale', () => ({
  syncI18nToDetectedLocale: (...args: unknown[]) => mockSyncI18nToDetectedLocale(...args),
}));

jest.mock('../src/i18n', () => ({
  i18n: mockI18n,
  i18nInitialization: mockDeferred.promise,
}));

jest.mock('../src/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../src/contexts/HouseholdContext', () => ({
  HouseholdProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../src/contexts/LegalLinksContext', () => ({
  LegalLinksProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../src/features/auth/contexts/OnboardingContext', () => ({
  OnboardingProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../src/features/settings/components/LegalConsentGate', () => ({
  LegalConsentGate: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../src/navigation/RootNavigator', () => ({
  RootNavigator: () => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, null, 'root navigator');
  },
}));

jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: ({ children, style }: { children: React.ReactNode; style?: unknown }) => {
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'gesture-root', style }, children);
  },
}));

jest.mock('react-native-paper', () => ({
  Provider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('react-native-reanimated', () => ({
  configureReanimatedLogger: jest.fn(),
  ReanimatedLogLevel: { warn: 'warn' },
}));

describe('App bootstrap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSyncI18nToDetectedLocale.mockResolvedValue(undefined);
    mockI18n.language = 'en';

    const { getStoredLanguage } = jest.requireMock('../src/i18n/storage') as {
      getStoredLanguage: jest.Mock;
    };
    getStoredLanguage.mockResolvedValue('he');
  });

  it('waits for i18n initialization to finish before rendering the app tree', async () => {
    const App = require('../App').default;

    const { queryByText } = render(<App />);

    expect(queryByText('root navigator')).toBeNull();

    mockDeferred.resolve();

    await waitFor(() => {
      expect(mockSyncI18nToDetectedLocale).toHaveBeenCalledWith(mockI18n, 'he');
    });

    await waitFor(() => {
      expect(queryByText('root navigator')).not.toBeNull();
    });
  });

  it('uses the resolved i18n language for layout direction after bootstrap fallback', async () => {
    const { getStoredLanguage } = jest.requireMock('../src/i18n/storage') as {
      getStoredLanguage: jest.Mock;
    };
    getStoredLanguage.mockResolvedValueOnce('fa');
    mockSyncI18nToDetectedLocale.mockImplementationOnce(async () => {
      mockI18n.language = 'en';
    });

    const App = require('../App').default;
    const { getByTestId } = render(<App />);

    mockDeferred.resolve();

    await waitFor(() => {
      expect(getByTestId('gesture-root')).toHaveStyle({ direction: 'ltr' });
    });
  });
});
