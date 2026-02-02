import { api } from '../../../services/api';

/**
 * Household response from the backend
 */
export interface HouseholdResponse {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  members: Array<{
    id: string;
    name?: string;
    email?: string;
    avatarUrl?: string;
    role: 'ADMIN' | 'MEMBER';
  }>;
}

/**
 * Household API service.
 * 
 * Provides typed wrappers around household-related endpoints.
 * All methods require authentication (JWT token must be set on API client).
 * 
 * @example
 * ```typescript
 * // Update household name
 * await householdApi.updateHousehold('My Family');
 * ```
 */
export const householdApi = {
  /**
   * Updates the current user's household name.
   * 
   * Requires the user to be an ADMIN of the household.
   * The household is automatically determined from the authenticated user's
   * household membership.
   * 
   * @param name - New household name (must be 2-40 characters)
   * @returns Promise resolving to the updated household data
   * @throws ApiError with 403 if user is not an admin
   * @throws ApiError with 400 if name validation fails
   * 
   * @example
   * ```typescript
   * try {
   *   const household = await householdApi.updateHousehold('Smith Family');
   *   console.log('Updated household:', household.name);
   * } catch (error) {
   *   // Handle error (e.g., not admin, invalid name)
   * }
   * ```
   */
  updateHousehold: (name: string): Promise<HouseholdResponse> => {
    return api.put<HouseholdResponse>('/household', { name });
  },
};
