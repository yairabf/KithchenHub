import { BadRequestException } from '@nestjs/common';

/**
 * Utility functions for household-related operations
 */
export class HouseholdUtils {
  /**
   * Validates that a user belongs to a household
   * @param householdId - The household ID to validate
   * @throws BadRequestException if householdId is missing or invalid
   */
  static validateHouseholdMembership(
    householdId: string | undefined,
  ): asserts householdId is string {
    if (!householdId) {
      throw new BadRequestException(
        'User must belong to a household to import data',
      );
    }
  }

  /**
   * Generates a random 8-character alphanumeric invite code (e.g. ABC12D34)
   */
  static generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars like 0, O, I, 1
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
