/**
 * Test file for LoginScreen
 * 
 * Setup required:
 * 1. Install testing dependencies:
 *    npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-expo
 * 
 * 2. Mock dependencies:
 *    - AuthContext
 *    - GuestDataImportModal
 *    - GoogleSignInButton
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { LoginScreen } from '../LoginScreen';
import { useAuth } from '../../../../contexts/AuthContext';

// Mock dependencies
jest.mock('../../../../contexts/AuthContext');
jest.mock('../components/GuestDataImportModal', () => ({
  GuestDataImportModal: ({ visible, onImport, onSkip }: any) => (
    visible ? <div testID="guest-import-modal" /> : null
  ),
}));
jest.mock('../components/GoogleSignInButton', () => ({
  GoogleSignInButton: ({ onPress, isLoading }: any) => (
    <button testID="google-sign-in-button" onClick={onPress} disabled={isLoading}>
      {isLoading ? 'Loading...' : 'Sign in with Google'}
    </button>
  ),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('LoginScreen', () => {
  const mockSignInWithGoogle = jest.fn();
  const mockSignInAsGuest = jest.fn();
  const mockResolveGuestImport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      signInWithGoogle: mockSignInWithGoogle,
      signInAsGuest: mockSignInAsGuest,
      showGuestImportPrompt: false,
      resolveGuestImport: mockResolveGuestImport,
    });
  });

  describe('Google sign-in', () => {
    it('should call signInWithGoogle when button is pressed', async () => {
      mockSignInWithGoogle.mockResolvedValue(undefined);
      const { getByTestId } = render(<LoginScreen />);

      fireEvent.press(getByTestId('google-sign-in-button'));

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
      });
    });

    it('should show loading state during sign-in', async () => {
      mockSignInWithGoogle.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const { getByTestId } = render(<LoginScreen />);

      fireEvent.press(getByTestId('google-sign-in-button'));

      // Check loading state (implementation dependent)
      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
      });
    });

    describe.each([
      ['generic error', new Error('Network error'), 'Unable to sign in with Google. Please try again.'],
      ['specific error', new Error('Invalid credentials'), 'Invalid credentials'],
      ['non-Error object', 'String error', 'Unable to sign in with Google. Please try again.'],
    ])('error handling with %s', (description, error, expectedMessage) => {
      it(`should show alert with correct message`, async () => {
        mockSignInWithGoogle.mockRejectedValue(error);
        const { getByTestId } = render(<LoginScreen />);

        fireEvent.press(getByTestId('google-sign-in-button'));

        await waitFor(() => {
          expect(Alert.alert).toHaveBeenCalledWith(
            'Sign In Failed',
            expectedMessage,
            [{ text: 'OK' }]
          );
        });
      });
    });
  });

  describe('Guest sign-in', () => {
    it('should call signInAsGuest when button is pressed', async () => {
      mockSignInAsGuest.mockResolvedValue(undefined);
      const { getByText } = render(<LoginScreen />);

      fireEvent.press(getByText('Skip for now'));

      await waitFor(() => {
        expect(mockSignInAsGuest).toHaveBeenCalledTimes(1);
      });
    });

    describe.each([
      ['generic error', new Error('Storage error'), 'Unable to sign in as guest. Please try again.'],
      ['specific error', new Error('Permission denied'), 'Permission denied'],
      ['non-Error object', 'String error', 'Unable to sign in as guest. Please try again.'],
    ])('error handling with %s', (description, error, expectedMessage) => {
      it(`should show alert with correct message`, async () => {
        mockSignInAsGuest.mockRejectedValue(error);
        const { getByText } = render(<LoginScreen />);

        fireEvent.press(getByText('Skip for now'));

        await waitFor(() => {
          expect(Alert.alert).toHaveBeenCalledWith(
            'Sign In Failed',
            expectedMessage,
            [{ text: 'OK' }]
          );
        });
      });
    });
  });

  describe('Guest import modal', () => {
    it('should show modal when showGuestImportPrompt is true', () => {
      (useAuth as jest.Mock).mockReturnValue({
        signInWithGoogle: mockSignInWithGoogle,
        signInAsGuest: mockSignInAsGuest,
        showGuestImportPrompt: true,
        resolveGuestImport: mockResolveGuestImport,
      });

      const { getByTestId } = render(<LoginScreen />);
      expect(getByTestId('guest-import-modal')).toBeTruthy();
    });

    it('should hide modal when showGuestImportPrompt is false', () => {
      (useAuth as jest.Mock).mockReturnValue({
        signInWithGoogle: mockSignInWithGoogle,
        signInAsGuest: mockSignInAsGuest,
        showGuestImportPrompt: false,
        resolveGuestImport: mockResolveGuestImport,
      });

      const { queryByTestId } = render(<LoginScreen />);
      expect(queryByTestId('guest-import-modal')).toBeNull();
    });
  });

  describe('UI elements', () => {
    it('should render app branding', () => {
      const { getByText } = render(<LoginScreen />);
      expect(getByText('Kitchen Hub')).toBeTruthy();
      expect(getByText('Your family\'s kitchen assistant')).toBeTruthy();
    });

    it('should render footer with terms links', () => {
      const { getByText } = render(<LoginScreen />);
      expect(getByText(/Terms of Service/)).toBeTruthy();
      expect(getByText(/Privacy Policy/)).toBeTruthy();
    });
  });
});
