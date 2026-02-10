import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { config } from '../../../config';

/**
 * Result from OAuth sign-in flow
 */
export interface OAuthResult {
  /** Whether sign-in was successful */
  success: boolean;
  /** JWT access token (only present on success) */
  token?: string;
  /** Whether a new household was created for the user */
  isNewHousehold?: boolean;
  /** Error code (only present on failure) */
  error?: string;
  /** Human-readable error message (only present on failure) */
  message?: string;
}

/**
 * Options for OAuth sign-in
 */
export interface OAuthSignInOptions {
  /** Optional household ID to join during sign-in */
  householdId?: string;
  /** Optional invite code to join existing household during sign-in */
  inviteCode?: string;
}

/**
 * Hook for OAuth-based authentication (Google, Apple, etc.)
 * 
 * This hook implements backend-driven OAuth flows where all OAuth secrets
 * and token exchanges happen on the server. The mobile app simply opens
 * a WebBrowser session to the backend's OAuth start endpoint and receives
 * a JWT via deep link callback.
 * 
 * Flow:
 * 1. Call signInWithGoogle() or signInWithApple()
 * 2. WebBrowser opens backend OAuth start endpoint
 * 3. Backend redirects to provider (Google/Apple)
 * 4. User authenticates with provider
 * 5. Provider redirects back to backend callback
 * 6. Backend validates, creates/finds user, generates JWT
 * 7. Backend redirects to app deep link: kitchen-hub://auth/callback?token=JWT
 * 8. WebBrowser closes and returns deep link URL
 * 9. Hook parses URL and returns result
 * 
 * @example
 * ```typescript
 * const { signInWithGoogle, isLoading } = useOAuthSignIn();
 * 
 * // Normal sign in
 * const result = await signInWithGoogle();
 * if (result.success) {
 *   console.log('Token:', result.token);
 * }
 * 
 * // Join household during sign in
 * const result = await signInWithGoogle({ householdId: 'abc-123' });
 * ```
 */
export function useOAuthSignIn() {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Signs in with Google using backend-driven OAuth flow.
   * 
   * @param options - Optional sign-in options (e.g., householdId to join)
   * @returns OAuth result with token or error
   */
  const signInWithGoogle = useCallback(
    async (options?: OAuthSignInOptions): Promise<OAuthResult> => {
      setIsLoading(true);
      try {
        // Build backend OAuth start URL
        const startUrl = new URL(
          `${config.api.baseUrl}/api/v${config.api.version}/auth/google/start`
        );

        // Add householdId or inviteCode query param if provided
        if (options?.householdId) {
          startUrl.searchParams.set('householdId', options.householdId);
        }
        if (options?.inviteCode) {
          startUrl.searchParams.set('inviteCode', options.inviteCode);
        }

        // For web platform, use window.location redirect with web callback URL
        if (Platform.OS === 'web') {
          const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
          const webCallbackUrl = `${currentOrigin}/auth/callback`;
          startUrl.searchParams.set('redirect_uri', webCallbackUrl);

          // Redirect to OAuth start - the backend will redirect back to webCallbackUrl
          window.location.href = startUrl.toString();

          // This will redirect away, so we return a pending state
          // The actual result will be handled by checking window.location.search after redirect
          return {
            success: false,
            error: 'web_redirect',
            message: 'Redirecting to OAuth...',
          };
        }

        // For native platforms, use WebBrowser with deep link callback
        const result = await WebBrowser.openAuthSessionAsync(
          startUrl.toString(),
          `${config.auth.redirectScheme}://auth/callback`
        );

        // Check if user cancelled
        if (result.type === 'cancel') {
          return {
            success: false,
            error: 'cancelled',
            message: 'Sign in was cancelled',
          };
        }

        // Check for success with URL
        if (result.type === 'success' && result.url) {
          return parseCallbackUrl(result.url);
        }

        // Unknown result type
        return {
          success: false,
          error: 'unknown',
          message: 'Unexpected response from sign in',
        };
      } catch (error) {
        console.error('Google sign in error:', error);
        return {
          success: false,
          error: 'exception',
          message:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred',
        };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Signs in with Apple using backend-driven OAuth flow.
   * 
   * @returns OAuth result with token or error
   * @throws Error - Not yet implemented
   */
  const signInWithApple = useCallback(async (): Promise<OAuthResult> => {
    throw new Error('Apple sign-in not yet implemented');
  }, []);

  return {
    signInWithGoogle,
    signInWithApple,
    isLoading,
  };
}

/**
 * Parses the OAuth callback URL to extract token or error.
 * 
 * Success format: kitchen-hub://auth/callback?token=JWT&isNewHousehold=true
 * Error format: kitchen-hub://auth/callback?error=code&message=description
 * 
 * @param url - Deep link URL from WebBrowser
 * @returns Parsed OAuth result
 */
function parseCallbackUrl(url: string): OAuthResult {
  try {
    const parsedUrl = new URL(url);
    const params = parsedUrl.searchParams;

    // Check for error
    const error = params.get('error');
    if (error) {
      return {
        success: false,
        error,
        message: params.get('message') || 'Authentication failed',
      };
    }

    // Check for success with token
    const token = params.get('token');
    if (token) {
      const isNewHouseholdStr = params.get('isNewHousehold');
      const isNewHousehold = isNewHouseholdStr === 'true';

      return {
        success: true,
        token,
        isNewHousehold,
      };
    }

    // Missing expected parameters
    return {
      success: false,
      error: 'invalid_callback',
      message: 'Invalid callback URL: missing token',
    };
  } catch (error) {
    console.error('Failed to parse callback URL:', error);
    return {
      success: false,
      error: 'parse_error',
      message: 'Failed to parse callback URL',
    };
  }
}
