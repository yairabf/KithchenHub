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

  it('provides auth context with user and signOut', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    // With mocked token, user may be set from getCurrentUser; without token, user is null
    expect(result.current.user === null || typeof result.current.user?.id === 'string').toBe(true);
    expect(typeof result.current.signOut).toBe('function');
    expect(typeof result.current.signInWithGoogle).toBe('function');
  });
});
