import { UserResponse } from '../services/authApi';
import { User } from '../../../contexts/AuthContext';

/**
 * Maximum time window (in minutes) since household creation to consider it "newly created".
 * Used to verify that a household was actually just created and not an existing one.
 */
export const NEW_HOUSEHOLD_VERIFICATION_WINDOW_MINUTES = 2;

/**
 * Verifies if a household was recently created and should show the name screen.
 * 
 * This verification adds an extra layer of security by checking the household's
 * creation timestamp, ensuring we only show the HouseholdName screen for truly
 * new households, not existing ones that might have been incorrectly flagged.
 * 
 * @param isNewHousehold - Backend flag indicating new household
 * @param householdCreatedAt - ISO timestamp of household creation (optional)
 * @param maxMinutesSinceCreation - Maximum minutes since creation to consider "new" (default: 2)
 * @returns True if household is verified as newly created
 * 
 * @example
 * ```typescript
 * const shouldShow = verifyHouseholdIsNewlyCreated(
 *   true,
 *   '2024-01-01T12:00:00Z',
 *   2
 * );
 * ```
 */
export function verifyHouseholdIsNewlyCreated(
  isNewHousehold: boolean,
  householdCreatedAt: string | undefined,
  maxMinutesSinceCreation: number = NEW_HOUSEHOLD_VERIFICATION_WINDOW_MINUTES,
): boolean {
  // Must be flagged as new household
  if (!isNewHousehold) {
    return false;
  }

  // Must have creation timestamp
  if (!householdCreatedAt) {
    return false;
  }

  try {
    const createdAt = new Date(householdCreatedAt);
    const now = new Date();
    const millisecondsSinceCreation = now.getTime() - createdAt.getTime();
    const minutesSinceCreation = millisecondsSinceCreation / (1000 * 60);

    // Only consider it new if created within the time window
    return minutesSinceCreation >= 0 && minutesSinceCreation < maxMinutesSinceCreation;
  } catch (error) {
    // Invalid date format - cannot verify, so don't show screen
    console.warn('Invalid household creation timestamp:', householdCreatedAt, error);
    return false;
  }
}

/**
 * Maps UserResponse from API to User type for application state management.
 * 
 * Handles default values and optional fields, ensuring consistent User object
 * structure throughout the application.
 * 
 * @param userResponse - Full user response from backend API
 * @returns User object for application state
 * 
 * @example
 * ```typescript
 * const userResponse = await authApi.getCurrentUser();
 * const user = mapUserResponseToUser(userResponse);
 * setUser(user);
 * ```
 */
export function mapUserResponseToUser(userResponse: UserResponse): User {
  return {
    id: userResponse.id,
    email: userResponse.email || '',
    name: userResponse.name || 'Kitchen User',
    photoUrl: userResponse.avatarUrl,
    householdId: userResponse.householdId || undefined,
    isGuest: userResponse.isGuest,
  };
}

/**
 * Verifies that a user exists in the database after authentication.
 * 
 * @param userResponse - User response from backend API
 * @throws Error if user is not found or invalid
 */
export function verifyUserExists(userResponse: UserResponse | null | undefined): void {
  if (!userResponse || !userResponse.id) {
    throw new Error('User not found in database after authentication');
  }
}

/**
 * Verifies that household data is present if householdId exists.
 * Logs a warning if householdId is present but household data is missing.
 * 
 * @param userResponse - User response from backend API
 */
export function verifyHouseholdDataConsistency(userResponse: UserResponse): void {
  if (userResponse.householdId && !userResponse.household) {
    console.warn('User has householdId but household data is missing');
  }
}
