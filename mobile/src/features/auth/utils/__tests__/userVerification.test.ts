import {
  verifyHouseholdIsNewlyCreated,
  mapUserResponseToUser,
  verifyUserExists,
  verifyHouseholdDataConsistency,
  NEW_HOUSEHOLD_VERIFICATION_WINDOW_MINUTES,
} from '../userVerification';
import { UserResponse } from '../../services/authApi';

describe('verifyHouseholdIsNewlyCreated', () => {
  describe.each([
    [
      'new household created 30 seconds ago',
      true,
      new Date(Date.now() - 30000).toISOString(),
      true,
    ],
    [
      'new household created 1 minute ago',
      true,
      new Date(Date.now() - 60000).toISOString(),
      true,
    ],
    [
      'new household created 1.5 minutes ago',
      true,
      new Date(Date.now() - 90000).toISOString(),
      true,
    ],
    [
      'new household created exactly 2 minutes ago',
      true,
      new Date(Date.now() - 120000).toISOString(),
      false, // Boundary case - should be false (not < 2)
    ],
    [
      'new household created 3 minutes ago',
      true,
      new Date(Date.now() - 180000).toISOString(),
      false,
    ],
    [
      'not a new household with recent timestamp',
      false,
      new Date(Date.now() - 60000).toISOString(),
      false,
    ],
    ['missing createdAt', true, undefined, false],
    ['null createdAt', true, null as any, false],
    ['empty string createdAt', true, '', false],
    [
      'new household created in the future (clock skew)',
      true,
      new Date(Date.now() + 60000).toISOString(),
      false, // Negative time should return false
    ],
    [
      'new household with invalid date format',
      true,
      'invalid-date',
      false,
    ],
  ])('with %s', (description, isNewHousehold, createdAt, expected) => {
    it(`should return ${expected}`, () => {
      const result = verifyHouseholdIsNewlyCreated(isNewHousehold, createdAt);
      expect(result).toBe(expected);
    });
  });

  it('should use custom maxMinutesSinceCreation when provided', () => {
    const createdAt = new Date(Date.now() - 5 * 60000).toISOString(); // 5 minutes ago
    const result = verifyHouseholdIsNewlyCreated(true, createdAt, 10); // 10 minute window
    expect(result).toBe(true);
  });

  it('should use default NEW_HOUSEHOLD_VERIFICATION_WINDOW_MINUTES when not provided', () => {
    const createdAt = new Date(Date.now() - (NEW_HOUSEHOLD_VERIFICATION_WINDOW_MINUTES - 1) * 60000).toISOString();
    const result = verifyHouseholdIsNewlyCreated(true, createdAt);
    expect(result).toBe(true);
  });
});

describe('mapUserResponseToUser', () => {
  it('should map complete user response to user', () => {
    const userResponse: UserResponse = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      avatarUrl: 'https://example.com/avatar.jpg',
      isGuest: false,
      householdId: 'household-123',
      household: {
        id: 'household-123',
        name: 'Test Household',
        createdAt: '2024-01-01T00:00:00Z',
      },
    };

    const user = mapUserResponseToUser(userResponse);

    expect(user).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      photoUrl: 'https://example.com/avatar.jpg',
      householdId: 'household-123',
      isGuest: false,
    });
  });

  it('should handle missing optional fields with defaults', () => {
    const userResponse: UserResponse = {
      id: 'user-123',
      isGuest: false,
    };

    const user = mapUserResponseToUser(userResponse);

    expect(user).toEqual({
      id: 'user-123',
      email: '',
      name: 'Kitchen User',
      avatarUrl: undefined,
      householdId: undefined,
      isGuest: false,
    });
  });

  it('should convert null householdId to undefined', () => {
    const userResponse: UserResponse = {
      id: 'user-123',
      householdId: null,
      isGuest: false,
    };

    const user = mapUserResponseToUser(userResponse);

    expect(user.householdId).toBeUndefined();
  });
});

describe('verifyUserExists', () => {
  it('should not throw for valid user response', () => {
    const userResponse: UserResponse = {
      id: 'user-123',
      isGuest: false,
    };

    expect(() => verifyUserExists(userResponse)).not.toThrow();
  });

  it('should throw error for null user response', () => {
    expect(() => verifyUserExists(null)).toThrow('User not found in database after authentication');
  });

  it('should throw error for undefined user response', () => {
    expect(() => verifyUserExists(undefined)).toThrow('User not found in database after authentication');
  });

  it('should throw error for user response without id', () => {
    const userResponse = {} as UserResponse;
    expect(() => verifyUserExists(userResponse)).toThrow('User not found in database after authentication');
  });
});

describe('verifyHouseholdDataConsistency', () => {
  it('should not warn when householdId and household are both present', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const userResponse: UserResponse = {
      id: 'user-123',
      householdId: 'household-123',
      household: {
        id: 'household-123',
        name: 'Test Household',
        createdAt: '2024-01-01T00:00:00Z',
      },
      isGuest: false,
    };

    verifyHouseholdDataConsistency(userResponse);

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should not warn when householdId is null and household is missing', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const userResponse: UserResponse = {
      id: 'user-123',
      householdId: null,
      isGuest: false,
    };

    verifyHouseholdDataConsistency(userResponse);

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should warn when householdId exists but household data is missing', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const userResponse: UserResponse = {
      id: 'user-123',
      householdId: 'household-123',
      isGuest: false,
    };

    verifyHouseholdDataConsistency(userResponse);

    expect(consoleSpy).toHaveBeenCalledWith('User has householdId but household data is missing');
    consoleSpy.mockRestore();
  });
});
