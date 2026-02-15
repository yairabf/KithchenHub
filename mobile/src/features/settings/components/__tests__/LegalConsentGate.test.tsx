/**
 * Tests for LegalConsentGate: storage-driven visibility of the legal consent modal
 * and accept flow. Parameterized over initial AsyncStorage value.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LegalConsentGate } from '../LegalConsentGate';
import { LEGAL_ACCEPTED_STORAGE_KEY } from '../../../../common/constants/legal';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        consentMessage: 'By continuing, you agree to our Privacy Policy and Terms of Service.',
        viewPrivacyPolicy: 'View Privacy Policy',
        viewTerms: 'View Terms',
        acceptContinue: 'Accept & Continue',
        opensInBrowser: 'Opens in browser',
      }[key] ?? key),
    i18n: { language: 'en' },
  }),
}));

jest.mock('../LegalConsentModal/LegalConsentModal', () => {
  const React = require('react');
  const { Text, Pressable } = require('react-native');
  return {
    LegalConsentModal: ({
      visible,
      onAccept,
      onOpenPrivacyPolicy,
      onOpenTerms,
    }: {
      visible: boolean;
      onAccept: () => void;
      onOpenPrivacyPolicy: () => void;
      onOpenTerms: () => void;
    }) => {
      if (!visible) return null;
      return React.createElement(
        React.Fragment,
        null,
        React.createElement(Text, { testID: 'legal-consent-message' }, 'Consent message'),
        React.createElement(Pressable, {
          testID: 'accept-continue',
          onPress: onAccept,
        }, React.createElement(Text, null, 'Accept & Continue')),
        React.createElement(Pressable, {
          testID: 'view-privacy',
          onPress: onOpenPrivacyPolicy,
        }, React.createElement(Text, null, 'View Privacy Policy')),
        React.createElement(Pressable, {
          testID: 'view-terms',
          onPress: onOpenTerms,
        }, React.createElement(Text, null, 'View Terms'))
      );
    },
  };
});

const mockOpenLegalUrl = jest.fn().mockResolvedValue(undefined);
jest.mock('../../../../common/utils/legalLinks', () => ({
  openLegalUrl: (url: string) => mockOpenLegalUrl(url),
}));

describe('LegalConsentGate', () => {
  const childText = 'App content';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    ['already accepted', 'true', false],
    ['never accepted', null, true],
    ['empty string', '', true],
  ])('when storage value is %s', (_, storageValue, expectModalVisible) => {
    it('shows loading then shows or hides modal accordingly', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storageValue);
      const { queryByTestId, queryByText } = render(
        <LegalConsentGate>
          <View><Text>{childText}</Text></View>
        </LegalConsentGate>
      );

      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalledWith(LEGAL_ACCEPTED_STORAGE_KEY);
      });

      if (expectModalVisible) {
        await waitFor(() => {
          expect(queryByTestId('accept-continue')).toBeTruthy();
        });
        expect(queryByText(childText)).toBeTruthy();
      } else {
        await waitFor(() => {
          expect(queryByTestId('accept-continue')).toBeNull();
        });
        expect(queryByText(childText)).toBeTruthy();
      }
    });
  });

  it('when user taps Accept & Continue, writes storage and hides modal', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    const { getByTestId, queryByTestId } = render(
      <LegalConsentGate>
        <View><Text>{childText}</Text></View>
      </LegalConsentGate>
    );

    await waitFor(() => {
      expect(getByTestId('accept-continue')).toBeTruthy();
    });

    fireEvent.press(getByTestId('accept-continue'));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(LEGAL_ACCEPTED_STORAGE_KEY, 'true');
    });

    await waitFor(() => {
      expect(queryByTestId('accept-continue')).toBeNull();
    });
  });

  it('when storage read throws, treats as accepted and does not show modal', async () => {
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

    const { queryByTestId } = render(
      <LegalConsentGate>
        <View><Text>{childText}</Text></View>
      </LegalConsentGate>
    );

    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(LEGAL_ACCEPTED_STORAGE_KEY);
    });

    await waitFor(() => {
      expect(queryByTestId('accept-continue')).toBeNull();
    });
  });
});
