/**
 * Entity types for audit log categorization.
 */
export const ENTITY_TYPES = {
  USER: 'USER',
  HOUSEHOLD: 'HOUSEHOLD',
  RECIPE: 'RECIPE',
  SHOPPING_LIST: 'SHOPPING_LIST',
  CHORE: 'CHORE',
} as const;

export type EntityType = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES];
