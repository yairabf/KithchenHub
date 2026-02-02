import { api } from '../../../services/api';

/**
 * Invite validation response from the backend
 */
export interface InviteValidationResponse {
  householdId: string;
  householdName: string;
}

/**
 * Invite API service.
 * 
 * Provides typed wrappers around invite-related endpoints.
 * These endpoints are public and do not require authentication.
 * 
 * @example
 * ```typescript
 * // Validate an invite code
 * try {
 *   const invite = await inviteApi.validateInviteCode('ABC123');
 *   console.log('Joining household:', invite.householdName);
 * } catch (error) {
 *   console.error('Invalid or expired invite code');
 * }
 * ```
 */
export const inviteApi = {
  /**
   * Validates an invite code and returns household information.
   * 
   * This is a public endpoint that does not require authentication.
   * Used during the onboarding flow when a user wants to join an
   * existing household via invite code.
   * 
   * @param code - The invite code to validate (e.g., "ABC123")
   * @returns Promise resolving to household ID and name
   * @throws ApiError with 400 status if code is invalid or expired
   * 
   * @example
   * ```typescript
   * const result = await inviteApi.validateInviteCode('ABC123');
   * // result: { householdId: 'uuid', householdName: 'Smith Family' }
   * ```
   */
  validateInviteCode: (code: string): Promise<InviteValidationResponse> => {
    return api.get<InviteValidationResponse>(`/invite/validate?code=${encodeURIComponent(code)}`);
  },
};
