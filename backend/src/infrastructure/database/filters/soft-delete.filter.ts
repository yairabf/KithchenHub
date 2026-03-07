/**
 * Soft-delete filter constants for querying active (non-deleted) records.
 *
 * Usage:
 * ```typescript
 * await prisma.recipe.findMany({
 *   where: {
 *     householdId,
 *     ...ACTIVE_RECORDS_FILTER,
 *   }
 * });
 * ```
 */

/**
 * Filter for active records (non-soft-deleted).
 * Includes records where deletedAt is NULL.
 */
export const ACTIVE_RECORDS_FILTER = { deletedAt: null } as const;
