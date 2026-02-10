import { api } from '../../../services/api';

/**
 * User response from the backend
 */
export interface UserResponse {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  isGuest: boolean;
  role: string;
  householdId?: string | null;
  household?: {
    id: string;
    name: string;
    createdAt: string;
  };
}

/**
 * Google authentication response from the backend
 */
export interface GoogleAuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: UserResponse;
  householdId?: string | null;
  isNewUser?: boolean;
  isNewHousehold?: boolean;
  household?: {
    id: string;
    name: string;
  };
}

/**
 * Authentication API service.
 * 
 * Provides typed wrappers around authentication endpoints.
 * All methods use the global API client which automatically includes
 * the JWT token when available.
 * 
 * @example
 * ```typescript
 * // Fetch current user
 * const user = await authApi.getCurrentUser();
 * ```
 */
export const authApi = {
  /**
   * Fetches the current authenticated user's information.
   * Requires a valid JWT token to be set on the API client.
   * 
   * @returns Promise resolving to the user data
   * @throws ApiError if the request fails or user is not authenticated
   * 
   * @example
   * ```typescript
   * try {
   *   const user = await authApi.getCurrentUser();
   *   console.log('User:', user.name);
   * } catch (error) {
   *   // Handle error (e.g., token expired)
   * }
   * ```
   */
  getCurrentUser: (): Promise<UserResponse> => {
    return api.get<UserResponse>('/auth/me');
  },
};
