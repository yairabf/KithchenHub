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
}
