import { BadRequestException } from '@nestjs/common';
import { HouseholdUtils } from './household.utils';

describe('HouseholdUtils', () => {
  describe('validateHouseholdMembership', () => {
    describe.each([
      ['valid household ID', 'household-123', false, 'should not throw error'],
      [
        'undefined household ID',
        undefined,
        true,
        'should throw BadRequestException',
      ],
      ['null household ID', null, true, 'should throw BadRequestException'],
      [
        'empty string household ID',
        '',
        true,
        'should throw BadRequestException',
      ],
    ])('with %s', (_description, householdId, shouldThrow, testDescription) => {
      it(testDescription, () => {
        if (shouldThrow) {
          expect(() =>
            HouseholdUtils.validateHouseholdMembership(householdId as any),
          ).toThrow(BadRequestException);
          expect(() =>
            HouseholdUtils.validateHouseholdMembership(householdId as any),
          ).toThrow('User must belong to a household to import data');
        } else {
          expect(() =>
            HouseholdUtils.validateHouseholdMembership(householdId as any),
          ).not.toThrow();
        }
      });
    });
  });
});
