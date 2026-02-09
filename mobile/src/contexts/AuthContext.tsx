import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { useOAuthSignIn } from '../features/auth/hooks/useOAuthSignIn';
import { api, setOnUnauthorizedHandler } from '../services/api';
import { tokenStorage } from '../features/auth/services/tokenStorage';
import { authApi } from '../features/auth/services/authApi';
import {
  verifyHouseholdIsNewlyCreated,
  mapUserResponseToUser,
  verifyUserExists,
  verifyHouseholdDataConsistency,
} from '../features/auth/utils/userVerification';

WebBrowser.maybeCompleteAuthSession();

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  householdId?: string;
  isGuest: boolean;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: (options?: { householdId?: string; inviteCode?: string }) => Promise<{ isNewHousehold: boolean }>;
  signOut: () => Promise<void>;
  showHouseholdNameScreen: boolean;
  setShowHouseholdNameScreen: (show: boolean) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = '@kitchen_hub_user';
const IS_NEW_HOUSEHOLD_KEY = '@kitchen_hub_is_new_household';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showHouseholdNameScreen, setShowHouseholdNameScreen] = useState(false);
  const isProcessingOAuthRef = useRef(false);

  const { signInWithGoogle: oauthSignIn } = useOAuthSignIn();

  const fetchCurrentUser = useCallback(async (): Promise<User> => {
    try {
      const response = await authApi.getCurrentUser();

      return {
        id: response.id,
        email: response.email || '',
        name: response.name || 'Kitchen User',
        avatarUrl: response.avatarUrl,
        householdId: response.householdId || undefined,
        isGuest: response.isGuest,
        role: response.role,
      };
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw new Error('Failed to fetch user information');
    }
  }, []);

  /**
   * Saves user data to AsyncStorage for persistence.
   * 
   * @param userData - User object to save, or null to clear storage
   */
  const saveUser = useCallback(async (userData: User | null) => {
    try {
      if (userData) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }, []);

  const loadStoredUser = useCallback(async () => {
    try {
      // Try to restore auth session from secure storage
      const storedToken = await tokenStorage.getAccessToken();
      if (storedToken) {
        // CRITICAL: Set token BEFORE any API calls
        api.setAuthToken(storedToken);
        try {
          // Fetch current user from backend to ensure session is valid
          const userData = await authApi.getCurrentUser();
          const userToSet: User = {
            id: userData.id,
            email: userData.email || '',
            name: userData.name || 'Kitchen User',
            avatarUrl: userData.avatarUrl,
            householdId: userData.householdId || undefined,
            isGuest: userData.isGuest,
            role: userData.role,
          };
          setUser(userToSet);
          await saveUser(userToSet);
          // Ensure token is still set after user is loaded
          api.setAuthToken(storedToken);
        } catch (error) {
          // Token is invalid, clear it
          console.warn('Stored token is invalid, clearing session', error);
          await tokenStorage.clearTokens();
          api.setAuthToken(null);
        }
      } else {
        // No token - clear any stored user (guest mode removed; authenticated users require token)
        await AsyncStorage.removeItem(STORAGE_KEY);
        setUser(null);
        api.setAuthToken(null);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handles OAuth callback after successful authentication.
   * Verifies user exists, checks household creation timestamp, and sets up user state.
   * 
   * @param token - JWT access token from backend
   * @param isNewHousehold - Flag indicating if a new household was created
   */
  const handleOAuthCallback = useCallback(async (token: string, isNewHousehold: boolean) => {
    // Prevent race conditions from duplicate callbacks
    if (isProcessingOAuthRef.current) {
      console.warn('OAuth callback already in progress, ignoring duplicate');
      return;
    }

    isProcessingOAuthRef.current = true;

    try {
      setIsLoading(true);

      // Store the JWT token in secure storage
      await tokenStorage.saveAccessToken(token);

      // Set API auth token for subsequent requests
      api.setAuthToken(token);

      // Verify token was saved (for debugging)
      const verifyToken = await tokenStorage.getAccessToken();
      if (!verifyToken || verifyToken !== token) {
        console.error('Token was not saved correctly to storage');
      }

      // Fetch full user data from backend to verify user exists and get household info
      const userResponse = await authApi.getCurrentUser();

      // Verify user exists in database
      verifyUserExists(userResponse);

      // Verify household data consistency
      verifyHouseholdDataConsistency(userResponse);

      // Verify it's truly a new household by checking creation timestamp
      const shouldShowHouseholdName = verifyHouseholdIsNewlyCreated(
        isNewHousehold,
        userResponse.household?.createdAt,
      );

      // Map to User type for state
      const userData = mapUserResponseToUser(userResponse);

      setUser(userData);
      await saveUser(userData);

      // Ensure token is set on API client (defensive check)
      const currentToken = await tokenStorage.getAccessToken();
      if (currentToken) {
        api.setAuthToken(currentToken);
      }

      // Only show HouseholdName screen if verified as new household
      if (shouldShowHouseholdName) {
        setShowHouseholdNameScreen(true);
        await AsyncStorage.setItem(IS_NEW_HOUSEHOLD_KEY, 'true');
      } else if (isNewHousehold) {
        // Log warning if backend says new household but verification failed
        console.warn('Backend reported new household but verification failed - household may already exist');
      }
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      // Clear tokens on error to force re-authentication
      await tokenStorage.clearTokens();
      api.setAuthToken(null);
    } finally {
      setIsLoading(false);
      isProcessingOAuthRef.current = false;
    }
  }, [saveUser]);

  useEffect(() => {
    // On web, check for OAuth callback in URL
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const error = urlParams.get('error');
      const isNewHousehold = urlParams.get('isNewHousehold') === 'true';

      if (token) {
        // Handle OAuth success callback
        handleOAuthCallback(token, isNewHousehold);
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (error) {
        // Handle OAuth error callback
        console.error('OAuth error:', error, urlParams.get('message'));
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        // No OAuth callback, proceed with normal load
        loadStoredUser();
      }
    } else {
      // Native platform - normal load
      loadStoredUser();
    }
  }, [handleOAuthCallback, loadStoredUser]);

  // Ensure token is set whenever we have a non-guest user (defensive check)
  useEffect(() => {
    const ensureTokenForAuthenticatedUser = async () => {
      if (user && !user.isGuest && !isLoading) {
        const token = await tokenStorage.getAccessToken();
        if (token) {
          // Double-check token is set (defensive)
          api.setAuthToken(token);
          console.log('[AuthContext] Token verified for authenticated user:', user.email);
        } else {
          // Non-guest user but no token - this shouldn't happen, clear user
          console.error('[AuthContext] Non-guest user found but no token available - clearing user state');
          setUser(null);
          await AsyncStorage.removeItem(STORAGE_KEY);
          api.setAuthToken(null);
        }
      } else if (!user && !isLoading) {
        // No user - ensure token is cleared
        api.setAuthToken(null);
      }
    };

    ensureTokenForAuthenticatedUser();
  }, [user, isLoading]);

  /**
   * Handles Google sign-in flow for native platforms.
   * Verifies user exists, checks household creation timestamp, and sets up user state.
   * 
   * @param options - Optional parameters including householdId for joining existing household
   * @returns Object with isNewHousehold flag
   * @throws Error if sign-in fails or user verification fails
   */
  const handleSignInWithGoogle = async (options?: { householdId?: string }): Promise<{ isNewHousehold: boolean }> => {
    try {
      setIsLoading(true);

      // Perform OAuth sign-in via backend
      const result = await oauthSignIn(options);

      if (!result.success) {
        throw new Error(result.message || 'Sign in failed');
      }

      // Store the JWT token in secure storage
      await tokenStorage.saveAccessToken(result.token!);

      // Set API auth token for subsequent requests
      api.setAuthToken(result.token!);

      // Fetch full user data from backend to verify user exists and get household info
      const userResponse = await authApi.getCurrentUser();

      // Verify user exists in database
      verifyUserExists(userResponse);

      // Verify household data consistency
      verifyHouseholdDataConsistency(userResponse);

      // Verify it's truly a new household by checking creation timestamp
      const shouldShowHouseholdName = verifyHouseholdIsNewlyCreated(
        result.isNewHousehold || false,
        userResponse.household?.createdAt,
      );

      // Map to User type for state
      const userData = mapUserResponseToUser(userResponse);

      // Ensure token is set on API client (defensive check)
      const currentToken = await tokenStorage.getAccessToken();
      if (currentToken) {
        api.setAuthToken(currentToken);
      }

      setUser(userData);
      await saveUser(userData);

      // Only show HouseholdName screen if verified as new household
      if (shouldShowHouseholdName) {
        setShowHouseholdNameScreen(true);
      } else if (result.isNewHousehold) {
        // Log warning if backend says new household but verification failed
        console.warn('Backend reported new household but verification failed - household may already exist');
      }

      // Return isNewHousehold flag for navigation decisions
      return { isNewHousehold: result.isNewHousehold || false };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      // Clear tokens on error to force re-authentication
      await tokenStorage.clearTokens();
      api.setAuthToken(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    // Clear stored user
    await saveUser(null);

    // Clear tokens from secure storage
    await tokenStorage.clearTokens();

    // Clear API auth token
    api.setAuthToken(null);

    // Clear household name screen flag
    setShowHouseholdNameScreen(false);

    setUser(null);
  };

  // Set up handler for 401 errors to automatically sign out
  useEffect(() => {
    const handleUnauthorized = async () => {
      console.warn('[AuthContext] 401 error detected - clearing session');
      // Clear stored user
      await saveUser(null);
      // Clear tokens from secure storage
      await tokenStorage.clearTokens();
      // Clear API auth token
      api.setAuthToken(null);
      // Clear household name screen flag
      setShowHouseholdNameScreen(false);
      setUser(null);
    };

    setOnUnauthorizedHandler(handleUnauthorized);

    return () => {
      setOnUnauthorizedHandler(null);
    };
  }, [saveUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithGoogle: handleSignInWithGoogle,
        signOut: handleSignOut,
        showHouseholdNameScreen,
        setShowHouseholdNameScreen,
        refreshUser: loadStoredUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
