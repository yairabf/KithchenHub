import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Secure storage keys for authentication tokens
 */
const ACCESS_TOKEN_KEY = 'kitchen_hub_access_token';
const REFRESH_TOKEN_KEY = 'kitchen_hub_refresh_token';

/**
 * Token storage service that uses platform-appropriate storage.
 * 
 * - **Native (iOS/Android)**: Uses Expo SecureStore (Keychain/EncryptedSharedPreferences)
 * - **Web**: Uses localStorage (SecureStore doesn't work on web)
 * 
 * This service provides secure storage for JWT access and refresh tokens.
 * 
 * @example
 * ```typescript
 * // Save tokens
 * await tokenStorage.saveAccessToken('jwt-token-here');
 * await tokenStorage.saveRefreshToken('refresh-token-here');
 * 
 * // Retrieve tokens
 * const accessToken = await tokenStorage.getAccessToken();
 * 
 * // Clear tokens on sign out
 * await tokenStorage.clearTokens();
 * ```
 */
export const tokenStorage = {
  /**
   * Saves the access token to storage.
   * 
   * @param token - JWT access token
   * @returns Promise that resolves when token is saved
   */
  saveAccessToken: async (token: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
      }
    } else {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    }
  },

  /**
   * Retrieves the access token from storage.
   * 
   * @returns Promise resolving to the access token, or null if not found
   */
  getAccessToken: async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem(ACCESS_TOKEN_KEY);
      }
      return null;
    }
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  },

  /**
   * Saves the refresh token to storage.
   * 
   * @param token - JWT refresh token
   * @returns Promise that resolves when token is saved
   */
  saveRefreshToken: async (token: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
      }
    } else {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    }
  },

  /**
   * Retrieves the refresh token from storage.
   * 
   * @returns Promise resolving to the refresh token, or null if not found
   */
  getRefreshToken: async (): Promise<string | null> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        return window.localStorage.getItem(REFRESH_TOKEN_KEY);
      }
      return null;
    }
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },

  /**
   * Clears both access and refresh tokens from storage.
   * Typically called during sign out.
   * 
   * @returns Promise that resolves when tokens are cleared
   */
  clearTokens: async (): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(ACCESS_TOKEN_KEY);
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } else {
      await Promise.all([
        SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      ]);
    }
  },
};
