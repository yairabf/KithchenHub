/**
 * Test file for AuthContext
 * 
 * Setup required:
 * 1. Install testing dependencies:
 *    npm install --save-dev jest @testing-library/react-native @testing-library/jest-native jest-expo @react-native-async-storage/async-storage
 * 
 * 2. Mock AsyncStorage:
 *    jest.mock('@react-native-async-storage/async-storage', () =>
 *      require('@react-native-async-storage/async-storage/jest/async-storage-mock')
 *    );
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid'),
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn().mockResolvedValue({ type: 'cancel' }),
}));

const mockSignInWithGoogle = jest.fn();
jest.mock('../../features/auth/hooks/useOAuthSignIn', () => ({
  useOAuthSignIn: () => ({
    signInWithGoogle: mockSignInWithGoogle,
    isLoading: false,
  }),
}));

const mockGetCurrentUser = jest.fn();
jest.mock('../../features/auth/services/authApi', () => ({
  authApi: {
    getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
  },
}));

/** Minimal shape for useSupabaseAuth callback in tests; matches AuthContext usage */
type MockAuthUser = { id: string; email: string; name: string; avatarUrl?: string; householdId?: string } | null;

/** Storage keys used by AuthContext; must match AuthContext internal constants for tests to be valid */
const HAS_GUEST_DATA_KEY = '@kitchen_hub_has_guest_data';
const GUEST_PROMPT_KEY = '@kitchen_hub_guest_import_prompt_shown';

jest.mock('../../hooks/useSupabaseAuth', () => ({
  useSupabaseAuth: (onUserChange: (user: MockAuthUser) => void) => ({
    signInWithGoogle: jest.fn(async () => {
      onUserChange({
        id: 'supabase-id',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: undefined,
        householdId: 'house-1',
      });
    }),
    signOut: jest.fn(async () => {
      onUserChange(null);
    }),
  }),
}));

jest.mock('../../features/auth/services/tokenStorage', () => ({
  tokenStorage: {
    saveAccessToken: jest.fn().mockResolvedValue(undefined),
    getAccessToken: jest.fn().mockResolvedValue('test-token'),
    clearTokens: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../services/api', () => ({
  api: {
    setAuthToken: jest.fn(),
  },
  setOnUnauthorizedHandler: jest.fn(),
}));

describe('AuthContext', () => {
  beforeEach(() => {
    AsyncStorage.clear();
    mockSignInWithGoogle.mockResolvedValue({
      success: true,
      token: 'test-token',
      isNewHousehold: false,
    });
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      avatarUrl: undefined,
      householdId: 'house-1',
      household: { id: 'house-1', name: 'Home', createdAt: new Date().toISOString() },
      isGuest: false,
    });
  });

  describe('importGuestData', () => {
    it('should successfully import guest data', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      await AsyncStorage.setItem(HAS_GUEST_DATA_KEY, 'true');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.importGuestData();
      });

      const hasGuestData = await AsyncStorage.getItem(HAS_GUEST_DATA_KEY);
      expect(hasGuestData).toBeNull();
      expect(result.current.hasGuestData).toBe(false);
    });

    it('should throw error when AsyncStorage fails', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      const removeItemSpy = jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('Storage error'));

      await expect(
        act(async () => {
          await result.current.importGuestData();
        })
      ).rejects.toThrow('Storage error');

      removeItemSpy.mockRestore();
    });
  });

  describe('clearGuestData', () => {
    it('should successfully clear guest data', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      await AsyncStorage.setItem(HAS_GUEST_DATA_KEY, 'true');

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load to complete
      await waitFor(() => {
        expect(result.current.hasGuestData).toBe(true);
      });

      await act(async () => {
        await result.current.clearGuestData();
      });

      await waitFor(() => {
        expect(result.current.hasGuestData).toBe(false);
      }, { timeout: 3000 });
    });

    it('should throw error when AsyncStorage fails', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      const removeItemSpy = jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('Storage error'));

      await expect(
        act(async () => {
          await result.current.clearGuestData();
        })
      ).rejects.toThrow('Storage error');

      removeItemSpy.mockRestore();
    });
  });

  describe('resolveGuestImport', () => {
    it('should import data when shouldImport is true', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Set up guest user and pending user
      await act(async () => {
        await result.current.signInAsGuest();
      });

      await AsyncStorage.setItem(HAS_GUEST_DATA_KEY, 'true');
      await AsyncStorage.removeItem(GUEST_PROMPT_KEY);

      // Trigger Google sign-in to set pending user
      await act(async () => {
        await result.current.signInWithGoogle();
      });

      await act(async () => {
        await result.current.resolveGuestImport(true);
      });

      await waitFor(() => {
        expect(result.current.showGuestImportPrompt).toBe(false);
      });
    });

    it('should skip import when shouldImport is false', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Set up guest user
      await act(async () => {
        await result.current.signInAsGuest();
      });

      await AsyncStorage.setItem(HAS_GUEST_DATA_KEY, 'true');
      await AsyncStorage.removeItem(GUEST_PROMPT_KEY);

      // Trigger Google sign-in to set pending user
      await act(async () => {
        await result.current.signInWithGoogle();
      });

      await act(async () => {
        await result.current.resolveGuestImport(false);
      });

      // Guest data should still exist
      const hasGuestData = await AsyncStorage.getItem(HAS_GUEST_DATA_KEY);
      expect(hasGuestData).toBe('true'); // key still present when shouldImport is false
      expect(result.current.showGuestImportPrompt).toBe(false);
    });

    it('should do nothing when no pending user', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.resolveGuestImport(true);
      });

      // Should not throw error
      expect(result.current.showGuestImportPrompt).toBe(false);
    });
  });

  describe('signInWithGoogle guest import prompt', () => {
    it('should show prompt when user is guest and prompt not shown', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load so a later loadStoredUser doesn't overwrite guest
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Sign in as guest first
      await act(async () => {
        await result.current.signInAsGuest();
      });

      // Wait for guest state so handleSignInWithGoogle closes over user=guest
      await waitFor(() => {
        expect(result.current.user?.isGuest).toBe(true);
      });

      // Ensure prompt hasn't been shown
      await AsyncStorage.removeItem(GUEST_PROMPT_KEY);

      // Attempt Google sign-in (handler will see isCurrentlyGuest and set prompt)
      await act(async () => {
        await result.current.signInWithGoogle();
      });

      await waitFor(() => {
        expect(result.current.showGuestImportPrompt).toBe(true);
      });
    });

    it('should not show prompt when prompt already shown', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Sign in as guest first
      await act(async () => {
        await result.current.signInAsGuest();
      });

      // Mark prompt as shown
      await AsyncStorage.setItem(GUEST_PROMPT_KEY, 'true');

      // Attempt Google sign-in
      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(result.current.showGuestImportPrompt).toBe(false);
    });
  });
});
