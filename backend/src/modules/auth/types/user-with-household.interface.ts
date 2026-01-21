import { User, Household } from '@prisma/client';

/**
 * User entity with household relationship included.
 */
export interface UserWithHousehold extends User {
  household: Household | null;
}
