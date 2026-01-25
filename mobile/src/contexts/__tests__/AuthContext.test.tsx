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
}));

jest.mock('../../hooks/useSupabaseAuth', () => ({
  useSupabaseAuth: (onUserChange: (user: any) => void) => ({
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

describe('AuthContext', () => {
  beforeEach(() => {
    AsyncStorage.clear();
  });

  describe('importGuestData', () => {
    it('should successfully import guest data', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      await AsyncStorage.setItem('@kitchen_hub_has_guest_data', 'true');

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await result.current.importGuestData();
      });

      const hasGuestData = await AsyncStorage.getItem('@kitchen_hub_has_guest_data');
      expect(hasGuestData).toBeNull();
      expect(result.current.hasGuestData).toBe(false);
    });

    it('should throw error when AsyncStorage fails', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Mock AsyncStorage to throw error
      jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('Storage error'));

      await expect(
        act(async () => {
          await result.current.importGuestData();
        })
      ).rejects.toThrow('Storage error');
    });
  });

  describe('clearGuestData', () => {
    it('should successfully clear guest data', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      await AsyncStorage.setItem('@kitchen_hub_has_guest_data', 'true');

      const { result, rerender } = renderHook(() => useAuth(), { wrapper });

      // Wait for initial load to complete
      await waitFor(() => {
        expect(result.current.hasGuestData).toBe(true);
      });

      await act(async () => {
        await result.current.clearGuestData();
      });

      const hasGuestData = await AsyncStorage.getItem('@kitchen_hub_has_guest_data');
      expect(hasGuestData).toBeNull();
      
      // Wait for state to update after clearGuestData
      await waitFor(() => {
        expect(result.current.hasGuestData).toBe(false);
      }, { timeout: 3000 });
    });

    it('should throw error when AsyncStorage fails', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Mock AsyncStorage to throw error
      jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('Storage error'));

      await expect(
        act(async () => {
          await result.current.clearGuestData();
        })
      ).rejects.toThrow('Storage error');
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

      await AsyncStorage.setItem('@kitchen_hub_has_guest_data', 'true');
      await AsyncStorage.removeItem('@kitchen_hub_guest_import_prompt_shown');

      // Trigger Google sign-in to set pending user
      await act(async () => {
        await result.current.signInWithGoogle();
      });

      await act(async () => {
        await result.current.resolveGuestImport(true);
      });

      const hasGuestData = await AsyncStorage.getItem('@kitchen_hub_has_guest_data');
      expect(hasGuestData).toBeNull();
      expect(result.current.showGuestImportPrompt).toBe(false);
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

      await AsyncStorage.setItem('@kitchen_hub_has_guest_data', 'true');
      await AsyncStorage.removeItem('@kitchen_hub_guest_import_prompt_shown');

      // Trigger Google sign-in to set pending user
      await act(async () => {
        await result.current.signInWithGoogle();
      });

      await act(async () => {
        await result.current.resolveGuestImport(false);
      });

      // Guest data should still exist
      const hasGuestData = await AsyncStorage.getItem('@kitchen_hub_has_guest_data');
      expect(hasGuestData).toBe('true');
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

      // Sign in as guest first
      await act(async () => {
        await result.current.signInAsGuest();
      });

      // Ensure prompt hasn't been shown
      await AsyncStorage.removeItem('@kitchen_hub_guest_import_prompt_shown');

      // Attempt Google sign-in
      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(result.current.showGuestImportPrompt).toBe(true);
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
      await AsyncStorage.setItem('@kitchen_hub_guest_import_prompt_shown', 'true');

      // Attempt Google sign-in
      await act(async () => {
        await result.current.signInWithGoogle();
      });

      expect(result.current.showGuestImportPrompt).toBe(false);
    });
  });
});
