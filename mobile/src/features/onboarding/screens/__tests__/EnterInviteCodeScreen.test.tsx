import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { EnterInviteCodeScreen } from '../EnterInviteCodeScreen';

// Navigation mocks
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
}));

// Auth & onboarding context mocks
const mockSetInvite = jest.fn();
const mockSignInWithGoogle = jest.fn();
jest.mock('../../../../contexts/OnboardingContext', () => ({
  useOnboarding: () => ({
    setInvite: mockSetInvite,
    invite: null,
  }),
}));
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    signInWithGoogle: mockSignInWithGoogle,
  }),
}));

// Google ID token hook
const mockGetGoogleIdToken = jest.fn();
jest.mock('../../../auth/hooks/useGoogleIdToken', () => ({
  useGoogleIdToken: () => ({
    getGoogleIdToken: mockGetGoogleIdToken,
    isReady: true,
    isClientIdMissing: false,
  }),
}));

// API mock
jest.mock('../../../../services/inviteApi', () => ({
  validateInviteCode: jest.fn(),
}));
import { validateInviteCode } from '../../../../services/inviteApi';

// UI mocks
jest.mock('../../../auth/components/GoogleSignInButton', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return {
    GoogleSignInButton: ({ onPress, disabled }: { onPress: () => void; disabled: boolean }) => (
      <TouchableOpacity onPress={onPress} disabled={disabled} testID="google-sign-in-btn">
        <Text>Continue with Google</Text>
      </TouchableOpacity>
    ),
  };
});

describe('EnterInviteCodeScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('initial render', () => {
    it('shows the code input and Continue button', () => {
      const { getByPlaceholderText, getByText } = render(<EnterInviteCodeScreen />);
      expect(getByPlaceholderText('Invite code')).toBeTruthy();
      expect(getByText('Continue')).toBeTruthy();
    });

    it('disables Continue button when input is empty', () => {
      const { getByText } = render(<EnterInviteCodeScreen />);
      const button = getByText('Continue');
      expect(button.props.accessibilityState?.disabled ?? false).toBeFalsy();
    });
  });

  describe('invite code validation', () => {
    it('shows validation error when empty code is submitted', async () => {
      const { getByText } = render(<EnterInviteCodeScreen />);
      fireEvent.press(getByText('Continue'));
      await waitFor(() => {
        expect(getByText('Please enter an invite code')).toBeTruthy();
      });
    });

    it('calls validateInviteCode and calls setInvite on success', async () => {
      (validateInviteCode as jest.Mock).mockResolvedValue({
        householdId: 'hh-1',
        householdName: 'The Smiths',
      });

      const { getByPlaceholderText, getByText } = render(<EnterInviteCodeScreen />);
      fireEvent.changeText(getByPlaceholderText('Invite code'), 'ABC123');
      fireEvent.press(getByText('Continue'));

      await waitFor(() => {
        expect(validateInviteCode).toHaveBeenCalledWith('ABC123');
        expect(mockSetInvite).toHaveBeenCalledWith({
          code: 'ABC123',
          householdId: 'hh-1',
          householdName: 'The Smiths',
        });
      });
    });

    it('shows error message when validateInviteCode rejects', async () => {
      (validateInviteCode as jest.Mock).mockRejectedValue(new Error('Invalid code'));

      const { getByPlaceholderText, getByText } = render(<EnterInviteCodeScreen />);
      fireEvent.changeText(getByPlaceholderText('Invite code'), 'BADCODE');
      fireEvent.press(getByText('Continue'));

      await waitFor(() => {
        expect(getByText('Invalid code')).toBeTruthy();
      });
    });

    it('shows generic error when validateInviteCode throws non-Error', async () => {
      (validateInviteCode as jest.Mock).mockRejectedValue('unknown error');

      const { getByPlaceholderText, getByText } = render(<EnterInviteCodeScreen />);
      fireEvent.changeText(getByPlaceholderText('Invite code'), 'CODE');
      fireEvent.press(getByText('Continue'));

      await waitFor(() => {
        expect(getByText('Invalid or expired code')).toBeTruthy();
      });
    });
  });
});
