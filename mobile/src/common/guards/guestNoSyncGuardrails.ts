/**
 * Guest No-Sync Guardrails
 * 
 * Provides runtime assertions to prevent guest data from syncing remotely.
 * These guardrails enforce the principle that guest data is local-only.
 * 
 * Guardrails check user state at boundaries, not thread mode through every function.
 */

import type { User } from '../../contexts/AuthContext';

/**
 * Formats user information for error messages.
 * 
 * @param user - The user object or null
 * @returns Formatted user info string for inclusion in error messages
 */
function formatUserInfoForError(user: User | null): string {
  return user ? ` (user: ${user.id})` : ' (no user)';
}

/**
 * Asserts that the user is in signed-in mode (not guest).
 * Throws an error if user is guest or null.
 * 
 * @param user - The current user (from AuthContext)
 * @param operation - Description of the operation being prevented
 * @throws Error if user is null or user.isGuest is true
 */
export function assertSignedInMode(
  user: User | null,
  operation: string = 'Sync operation'
): asserts user is User & { isGuest: false } {
  if (!user || user.isGuest) {
    throw new Error(
      `${operation} is not allowed in guest mode${formatUserInfoForError(user)}. Guest data is local-only and never synced remotely.`
    );
  }
}

/**
 * Asserts that the user is not in guest mode.
 * Throws an error if user is guest.
 * 
 * @param user - The current user (from AuthContext)
 * @param operation - Description of the operation being prevented
 * @throws Error if user is null or user.isGuest is true
 */
export function assertNoGuestMode(
  user: User | null,
  operation: string = 'Remote operation'
): void {
  if (!user || user.isGuest) {
    throw new Error(
      `${operation} is not allowed in guest mode${formatUserInfoForError(user)}. Guest data is local-only and never synced remotely.`
    );
  }
}
