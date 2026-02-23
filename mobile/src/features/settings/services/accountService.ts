import { api } from '../../../services/api';

/**
 * Parameters for account deletion operation.
 */
export interface DeleteAccountParams {
  /** Optional reason for account deletion. Will be sent to backend for analytics. */
  reason?: string;
}

/**
 * Formats the endpoint URL for account deletion API call.
 * Trims whitespace and URL-encodes the reason if provided.
 * 
 * @param reason - Optional reason for account deletion
 * @returns Formatted endpoint path with query parameters if reason provided
 * 
 * @example
 * formatDeleteAccountUrl() // "/users/me"
 * formatDeleteAccountUrl("") // "/users/me"
 * formatDeleteAccountUrl("Not needed") // "/users/me?reason=Not+needed"
 * formatDeleteAccountUrl("  Switched  ") // "/users/me?reason=Switched"
 */
function formatDeleteAccountUrl(reason?: string): string {
  if (!reason?.trim()) {
    return '/users/me';
  }

  const query = new URLSearchParams({ reason: reason.trim() });
  return `/users/me?${query.toString()}`;
}

/**
 * Service for managing user account operations.
 * Provides methods for account-level actions like deletion.
 */
export const accountService = {
  /**
   * Deletes the currently authenticated user's account.
   * This operation is irreversible and will remove all user data.
   * 
   * @param params - Optional parameters including deletion reason
   * @throws {NetworkError} If the request fails due to network connectivity issues
   * @throws {ApiError} If the API returns an error response (401, 429, 500+, etc.)
   * 
   * @example
   * // Delete account without reason
   * await accountService.deleteMyAccount();
   * 
   * @example
   * // Delete account with reason
   * await accountService.deleteMyAccount({ reason: "Switching to competitor" });
   */
  async deleteMyAccount(params?: DeleteAccountParams): Promise<void> {
    await api.delete<unknown>(formatDeleteAccountUrl(params?.reason));
  },
};
