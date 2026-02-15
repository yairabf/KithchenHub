import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { useOAuthSignIn } from '../features/auth/hooks/useOAuthSignIn';
import { api, setOnUnauthorizedHandler } from '../services/api';
import { tokenStorage } from '../features/auth/services/tokenStorage';
import { authApi } from '../features/auth/services/authApi';
import { logger } from '../common/utils/logger';
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
  signInWithDemo: () => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
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
      logger.error('Error fetching current user:', error);
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
      logger.error('Error saving user:', error);
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
          logger.warn('Stored token is invalid, clearing session', error);
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
      logger.error('Error loading user:', error);
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
      logger.warn('OAuth callback already in progress, ignoring duplicate');
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
        logger.error('Token was not saved correctly to storage');
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
        logger.warn('Backend reported new household but verification failed - household may already exist');
      }
    } catch (error) {
      logger.error('Error handling OAuth callback:', error);
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
        logger.error('OAuth error:', error, urlParams.get('message'));
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
          logger.debug('[AuthContext] Token verified for authenticated user:', user.email);
        } else {
          // Non-guest user but no token - this shouldn't happen, clear user
          logger.error('[AuthContext] Non-guest user found but no token available - clearing user state');
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
   * @param options - Optional parameters including householdId or inviteCode for joining existing household
   * @returns Object with isNewHousehold flag
   * @throws Error if sign-in fails or user verification fails
   */
  const handleSignInWithGoogle = async (
    options?: { householdId?: string; inviteCode?: string },
  ): Promise<{ isNewHousehold: boolean }> => {
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
        logger.warn('Backend reported new household but verification failed - household may already exist');
      }

      // Return isNewHousehold flag for navigation decisions
      return { isNewHousehold: result.isNewHousehold || false };
    } catch (error) {
      logger.error('Error signing in with Google:', error);
      // Clear tokens on error to force re-authentication
      await tokenStorage.clearTokens();
      api.setAuthToken(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Demo sign-in for development/testing without Supabase.
   * Creates a mock user with a test household.
   */
  const handleSignInWithDemo = async () => {
    try {
      setIsLoading(true);

      logger.debug('[AuthContext] Starting demo sign-in...');

      // Create a demo user with a demo household
      const demoUser: User = {
        id: 'demo-user-id',
        email: 'demo@kitchenhub.app',
        name: 'Demo User',
        avatarUrl: undefined,
        householdId: 'demo-household-id',
        isGuest: true,
        role: 'owner',
      };

      logger.debug('[AuthContext] Demo user created:', demoUser);

      // Save demo user to state and storage
      setUser(demoUser);
      await saveUser(demoUser);

      // Trigger new household creation flow to simulate onboarding
      setShowHouseholdNameScreen(true);

      logger.debug('[AuthContext] Demo user signed in - showing household name screen');
    } catch (error) {
      logger.error('[AuthContext] Error signing in with demo:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Registers a new user with email and password
   */
  const handleSignUpWithEmail = async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);

      const response = await authApi.register({ email, password, name });
      logger.debug('[AuthContext] User registered successfully:', response.message);
    } catch (error) {
      logger.error('[AuthContext] Error registering user:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Signs in a user with email and password
   */
  const handleSignInWithEmail = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      const response = await authApi.login({ email, password });

      // Backend returns tokens directly in response (not wrapped in data)
      if (!response.accessToken) {
        throw new Error('Login failed - no access token received');
      }

      // Store token first (critical operation)
      try {
        await tokenStorage.saveAccessToken(response.accessToken);
      } catch (storageError) {
        logger.error('[AuthContext] Failed to save token:', storageError);
        throw new Error('Failed to save authentication data. Please try again.');
      }

      // Only set on API client after successful storage
      api.setAuthToken(response.accessToken);

      // Map user data
      const userData: User = {
        id: response.user.id,
        email: response.user.email || '',
        name: response.user.name || 'Kitchen User',
        avatarUrl: response.user.avatarUrl,
        householdId: response.user.householdId || undefined,
        isGuest: response.user.isGuest,
        role: response.user.role,
      };

      // Save user data
      try {
        await saveUser(userData);
        setUser(userData);
      } catch (userSaveError) {
        // Rollback token on user save failure
        await tokenStorage.clearTokens();
        api.setAuthToken(null);
        logger.error('[AuthContext] Failed to save user data:', userSaveError);
        throw new Error('Failed to save user information. Please try again.');
      }

      // If user has no household, show household creation flow
      if (!userData.householdId) {
        setShowHouseholdNameScreen(true);
      }

      logger.debug('[AuthContext] User signed in successfully');
    } catch (error) {
      logger.error('[AuthContext] Error signing in:', error);
      // Ensure clean state on any error
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
      logger.warn('[AuthContext] 401 error detected - clearing session');
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
        signInWithDemo: handleSignInWithDemo,
        signUpWithEmail: handleSignUpWithEmail,
        signInWithEmail: handleSignInWithEmail,
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
