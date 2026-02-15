/**
 * Tests for LegalConsentModal: visibility and button callbacks.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LegalConsentModal } from '../LegalConsentModal/LegalConsentModal';

const mockOnAccept = jest.fn();
const mockOnOpenPrivacyPolicy = jest.fn();
const mockOnOpenTerms = jest.fn();

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

describe('LegalConsentModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    ['visible', true],
    ['hidden', false],
  ])('when visible is %s', (_, visible) => {
    it('renders content when visible and null when not', () => {
      const { queryByText } = render(
        <LegalConsentModal
          visible={visible}
          onAccept={mockOnAccept}
          onOpenPrivacyPolicy={mockOnOpenPrivacyPolicy}
          onOpenTerms={mockOnOpenTerms}
        />
      );
      if (visible) {
        expect(queryByText('By continuing, you agree to our Privacy Policy and Terms of Service.')).toBeTruthy();
        expect(queryByText('View Privacy Policy')).toBeTruthy();
        expect(queryByText('View Terms')).toBeTruthy();
        expect(queryByText('Accept & Continue')).toBeTruthy();
      } else {
        expect(queryByText('Accept & Continue')).toBeNull();
      }
    });
  });

  it('calls onAccept when Accept & Continue is pressed', () => {
    const { getByText } = render(
      <LegalConsentModal
        visible
        onAccept={mockOnAccept}
        onOpenPrivacyPolicy={mockOnOpenPrivacyPolicy}
        onOpenTerms={mockOnOpenTerms}
      />
    );
    fireEvent.press(getByText('Accept & Continue'));
    expect(mockOnAccept).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenPrivacyPolicy when View Privacy Policy is pressed', () => {
    const { getByText } = render(
      <LegalConsentModal
        visible
        onAccept={mockOnAccept}
        onOpenPrivacyPolicy={mockOnOpenPrivacyPolicy}
        onOpenTerms={mockOnOpenTerms}
      />
    );
    fireEvent.press(getByText('View Privacy Policy'));
    expect(mockOnOpenPrivacyPolicy).toHaveBeenCalledTimes(1);
  });

  it('calls onOpenTerms when View Terms is pressed', () => {
    const { getByText } = render(
      <LegalConsentModal
        visible
        onAccept={mockOnAccept}
        onOpenPrivacyPolicy={mockOnOpenPrivacyPolicy}
        onOpenTerms={mockOnOpenTerms}
      />
    );
    fireEvent.press(getByText('View Terms'));
    expect(mockOnOpenTerms).toHaveBeenCalledTimes(1);
  });
});
