/**
 * Sync entity type constants.
 *
 * Used to ensure type safety and prevent typos when referencing
 * entity types in idempotency key processing.
 */
export const SYNC_ENTITY_TYPES = {
  RECIPE: 'recipe',
  SHOPPING_LIST: 'shoppingList',
  SHOPPING_ITEM: 'shoppingItem',
  CHORE: 'chore',
} as const;

/**
 * Type representing valid sync entity types.
 */
export type SyncEntityType =
  (typeof SYNC_ENTITY_TYPES)[keyof typeof SYNC_ENTITY_TYPES];
