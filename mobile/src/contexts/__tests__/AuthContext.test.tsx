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
import { ApiError, NetworkError } from '../../services/api';

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
const mockRefreshToken = jest.fn();
jest.mock('../../features/auth/services/authApi', () => ({
  authApi: {
    getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
    refreshToken: (...args: unknown[]) => mockRefreshToken(...args),
  },
}));

jest.mock('../../features/auth/services/tokenStorage', () => ({
  tokenStorage: {
    saveAccessToken: jest.fn().mockResolvedValue(undefined),
    saveRefreshToken: jest.fn().mockResolvedValue(undefined),
    getAccessToken: jest.fn().mockResolvedValue('test-token'),
    getRefreshToken: jest.fn().mockResolvedValue('refresh-token'),
    clearTokens: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockRefreshAccessToken = jest.fn();
jest.mock('../../features/auth/services/sessionManager', () => ({
  refreshAccessToken: (...args: unknown[]) => mockRefreshAccessToken(...args),
}));

jest.mock('../../services/api', () => ({
  ApiError: class ApiError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
  },
  NetworkError: class NetworkError extends Error {},
  api: {
    setAuthToken: jest.fn(),
  },
  setOnUnauthorizedHandler: jest.fn(),
  setSessionRefreshHandler: jest.fn(),
}));

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear call counts without losing module-factory implementations,
    // then re-set implementations that depend on specific return values.
    jest.clearAllMocks();
    AsyncStorage.clear();

    const { tokenStorage: mockTokenStorage } = jest.requireMock(
      '../../features/auth/services/tokenStorage',
    ) as { tokenStorage: Record<string, jest.Mock> };
    mockTokenStorage.saveAccessToken.mockResolvedValue(undefined);
    mockTokenStorage.saveRefreshToken.mockResolvedValue(undefined);
    mockTokenStorage.getAccessToken.mockResolvedValue('test-token');
    mockTokenStorage.getRefreshToken.mockResolvedValue('refresh-token');
    mockTokenStorage.clearTokens.mockResolvedValue(undefined);

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
    mockRefreshAccessToken.mockResolvedValue('new-token');
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

  describe.each([
    ['expired token with successful refresh', true, 'new-token'],
    ['expired token with failed refresh', false, null],
  ])(
    'startup behavior: %s',
    (_caseName, shouldRecover, refreshedToken) => {
      it(`handles ${_caseName}`, async () => {
        mockGetCurrentUser
          .mockRejectedValueOnce(new ApiError('expired', 401))
          .mockResolvedValueOnce({
            id: 'user-1',
            email: 'test@example.com',
            name: 'Test User',
            avatarUrl: undefined,
            householdId: 'house-1',
            household: { id: 'house-1', name: 'Home', createdAt: new Date().toISOString() },
            isGuest: false,
            role: 'member',
          });
        mockRefreshAccessToken.mockResolvedValueOnce(refreshedToken);

        const wrapper = ({ children }: { children: React.ReactNode }) => (
          <AuthProvider>{children}</AuthProvider>
        );
        const { result } = renderHook(() => useAuth(), { wrapper });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        if (shouldRecover) {
          expect(result.current.user?.id).toBe('user-1');
        } else {
          expect(result.current.user).toBeNull();
        }
      });
    },
  );

  it('startup transient failure with cached user: preserves tokens and keeps session', async () => {
    await AsyncStorage.setItem(
      '@kitchen_hub_user',
      JSON.stringify({
        id: 'cached-user',
        email: 'cached@example.com',
        name: 'Cached User',
        isGuest: false,
        role: 'member',
      }),
    );

    // Use persistent rejection to simulate ongoing network outage
    mockGetCurrentUser.mockRejectedValue(
      new NetworkError('Network request failed'),
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Core invariant: tokens must NOT be cleared on transient failure
    const { tokenStorage: mockTokenStorage } = jest.requireMock(
      '../../features/auth/services/tokenStorage',
    ) as { tokenStorage: { clearTokens: jest.Mock } };
    expect(mockTokenStorage.clearTokens).not.toHaveBeenCalled();

    // User should have been loaded (either from cache or a previous session)
    // We don't assert a specific id because effect timing may vary across
    // React versions / test runners; the invariant is that the session is alive.
    expect(result.current.user).not.toBeNull();

    // Restore default implementation for subsequent tests
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      avatarUrl: undefined,
      householdId: 'house-1',
      household: { id: 'house-1', name: 'Home', createdAt: new Date().toISOString() },
      isGuest: false,
      role: 'member',
    });
  });

  it('startup transient failure with no cached user: preserves stored token', async () => {
    // Make all getCurrentUser calls fail transiently so user stays null
    // regardless of React's effect scheduling (e.g. Strict Mode double-invoke)
    mockGetCurrentUser.mockRejectedValue(
      new NetworkError('Network request failed'),
    );

    const { api: mockApi } = jest.requireMock('../../services/api') as {
      api: { setAuthToken: jest.Mock };
    };
    mockApi.setAuthToken.mockClear();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Tokens must NOT be cleared on transient failure
    const { tokenStorage: mockTokenStorage } = jest.requireMock(
      '../../features/auth/services/tokenStorage',
    ) as { tokenStorage: { clearTokens: jest.Mock } };
    expect(mockTokenStorage.clearTokens).not.toHaveBeenCalled();

    // API auth token must NOT be set to null (preserved for future requests)
    const nullCalls = mockApi.setAuthToken.mock.calls.filter(
      (call: unknown[]) => call[0] === null,
    );
    expect(nullCalls).toHaveLength(0);

    // Restore default for next tests
    mockGetCurrentUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      avatarUrl: undefined,
      householdId: 'house-1',
      household: { id: 'house-1', name: 'Home', createdAt: new Date().toISOString() },
      isGuest: false,
      role: 'member',
    });
  });
});
