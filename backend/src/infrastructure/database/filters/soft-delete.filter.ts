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

/**
 * Helper to build active records filter with additional conditions.
 *
 * @param additionalWhere - Additional where conditions to combine with active filter
 * @returns Combined where clause
 *
 * @example
 * ```typescript
 * const where = buildActiveRecordsFilter({ householdId: 'abc-123' });
 * // Returns: { householdId: 'abc-123', deletedAt: null }
 * ```
 */
export function buildActiveRecordsFilter<T extends Record<string, any>>(
  additionalWhere?: T,
): T & { deletedAt: null } {
  return {
    ...additionalWhere,
    ...ACTIVE_RECORDS_FILTER,
  } as T & { deletedAt: null };
}
