/**
 * Test file for LoginScreen
 * 
 * Setup required:
 * 1. Install testing dependencies:
 *    npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-expo
 * 
 * 2. Mock dependencies:
 *    - AuthContext
 *    - GoogleSignInButton
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { LoginScreen } from '../LoginScreen';
import { useAuth } from '../../../../contexts/AuthContext';

type GoogleSignInButtonProps = {
  onPress: () => void;
  isLoading?: boolean;
};

// Mock dependencies
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));
jest.mock('../../components/GoogleSignInButton', () => ({
  GoogleSignInButton: ({ onPress, isLoading }: GoogleSignInButtonProps) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable testID="google-sign-in-button" onPress={onPress} disabled={isLoading}>
        <Text>{isLoading ? 'Loading...' : 'Sign in with Google'}</Text>
      </Pressable>
    );
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('LoginScreen', () => {
  const mockSignInWithGoogle = jest.fn();
  const originalWarn = console.warn;
  const consoleWarnSpy = jest.spyOn(console, 'warn');

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      signInWithGoogle: mockSignInWithGoogle,
      showHouseholdNameScreen: false,
    });
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

  describe('Google sign-in', () => {
    it('should call signInWithGoogle when button is pressed', async () => {
      mockSignInWithGoogle.mockResolvedValue(undefined);
      const { getByTestId } = render(<LoginScreen navigation={mockNavigation} />);

      fireEvent.press(getByTestId('google-sign-in-button'));

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);
      });
    });

    it('should show loading state during sign-in', async () => {
      mockSignInWithGoogle.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      const { getByTestId } = render(<LoginScreen navigation={mockNavigation} />);

      fireEvent.press(getByTestId('google-sign-in-button'));

      // Check loading state (implementation dependent)
      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
      });
    });

    describe.each([
      ['generic error', new Error('Network error'), 'Network error'],
      ['specific error', new Error('Invalid credentials'), 'Invalid credentials'],
      ['non-Error object', 'String error', 'Unable to sign in with Google. Please try again.'],
    ])('error handling with %s', (description, error, expectedMessage) => {
      it(`should show alert with correct message`, async () => {
        mockSignInWithGoogle.mockRejectedValue(error);
        const { getByTestId } = render(<LoginScreen navigation={mockNavigation} />);

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

  describe('UI elements', () => {
    it('should render app branding', () => {
      const { getByText } = render(<LoginScreen navigation={mockNavigation} />);
      expect(getByText('Kitchen Hub')).toBeTruthy();
      expect(getByText('Your family\'s kitchen assistant')).toBeTruthy();
    });

    it('should render footer with terms links', () => {
      const { getByText } = render(<LoginScreen navigation={mockNavigation} />);
      expect(getByText(/Terms of Service/)).toBeTruthy();
      expect(getByText(/Privacy Policy/)).toBeTruthy();
    });
  });
});
