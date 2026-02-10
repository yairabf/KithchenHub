import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { LoginScreen } from '../LoginScreen';
import { useAuth } from '../../../contexts/AuthContext';
import { useOnboarding } from '../contexts/OnboardingContext';

// Mock dependencies
jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../contexts/OnboardingContext', () => ({
  useOnboarding: jest.fn(),
}));

jest.mock('../components/GoogleSignInButton', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return {
    GoogleSignInButton: ({ onPress, isLoading }: any) => (
      <TouchableOpacity onPress={onPress} disabled={isLoading} testID="google-sign-in-button">
        <Text>{isLoading ? 'Loading...' : 'Sign in with Google'}</Text>
      </TouchableOpacity>
    ),
  };
});

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

describe('LoginScreen', () => {
  const mockSignInWithGoogle = jest.fn();
  const mockNavigate = jest.fn();
  const mockSetMode = jest.fn();
  const mockSetInviteContext = jest.fn();
  const mockAlert = jest.spyOn(Alert, 'alert').mockImplementation(() => { });

  const navigation = {
    navigate: mockNavigate,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      signInWithGoogle: mockSignInWithGoogle,
      showHouseholdNameScreen: false,
    });
    (useOnboarding as jest.Mock).mockReturnValue({
      mode: 'login_or_signup',
      inviteContext: undefined,
      setMode: mockSetMode,
      setInviteContext: mockSetInviteContext,
    });
  });

  it('renders correctly in default mode', () => {
    const { getByText, getByTestId } = render(<LoginScreen navigation={navigation} />);
    expect(getByText('Kitchen Hub')).toBeTruthy();
    expect(getByText('Join household')).toBeTruthy();
    expect(getByTestId('google-sign-in-button')).toBeTruthy();
  });

  it('calls signInWithGoogle without options when in default mode', async () => {
    const { getByTestId } = render(<LoginScreen navigation={navigation} />);
    fireEvent.press(getByTestId('google-sign-in-button'));

    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalledWith();
    });
  });

  it('navigates to EnterInviteCode when Join household is pressed', () => {
    const { getByText } = render(<LoginScreen navigation={navigation} />);
    fireEvent.press(getByText('Join household'));
    expect(mockNavigate).toHaveBeenCalledWith('EnterInviteCode');
  });

  describe('When in join_by_invite mode', () => {
    beforeEach(() => {
      (useOnboarding as jest.Mock).mockReturnValue({
        mode: 'join_by_invite',
        inviteContext: {
          code: 'ABC12345',
          householdId: 'h123',
          householdName: 'My Family',
        },
        setMode: mockSetMode,
        setInviteContext: mockSetInviteContext,
      });
    });

    it('shows the joining household text', () => {
      const { getByText } = render(<LoginScreen navigation={navigation} />);
      expect(getByText('Joining My Family')).toBeTruthy();
    });

    it('calls signInWithGoogle with invite options', async () => {
      const { getByTestId } = render(<LoginScreen navigation={navigation} />);
      fireEvent.press(getByTestId('google-sign-in-button'));

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalledWith({
          householdId: 'h123',
          inviteCode: 'ABC12345',
        });
      });
    });

    it('clears onboarding state after successful sign-in', async () => {
      mockSignInWithGoogle.mockResolvedValueOnce({ isNewHousehold: false });
      const { getByTestId } = render(<LoginScreen navigation={navigation} />);
      fireEvent.press(getByTestId('google-sign-in-button'));

      await waitFor(() => {
        expect(mockSetMode).toHaveBeenCalledWith('login_or_signup');
        expect(mockSetInviteContext).toHaveBeenCalledWith(undefined);
      });
    });

    it('shows change invite code button', () => {
      const { getByText } = render(<LoginScreen navigation={navigation} />);
      expect(getByText('Change invite code')).toBeTruthy();
    });

    it('clears invite when Change invite code is pressed', () => {
      const { getByText } = render(<LoginScreen navigation={navigation} />);
      fireEvent.press(getByText('Change invite code'));
      expect(mockSetMode).toHaveBeenCalledWith('login_or_signup');
      expect(mockSetInviteContext).toHaveBeenCalledWith(undefined);
      expect(mockNavigate).toHaveBeenCalledWith('EnterInviteCode');
    });

    it('alerts if invite context is missing', async () => {
      (useOnboarding as jest.Mock).mockReturnValue({
        mode: 'join_by_invite',
        inviteContext: undefined,
        setMode: mockSetMode,
        setInviteContext: mockSetInviteContext,
      });

      const { getByTestId } = render(<LoginScreen navigation={navigation} />);
      fireEvent.press(getByTestId('google-sign-in-button'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          'Invite Missing',
          'Please enter a valid invite code to join a household.',
          expect.any(Array)
        );
      });
    });
  });
});
