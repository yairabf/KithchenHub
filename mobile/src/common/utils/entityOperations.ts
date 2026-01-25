/**
 * Entity Operations Utilities
 * 
 * Shared helper functions for common entity operations in local services.
 * These utilities reduce code duplication and ensure consistent behavior
 * across different service implementations.
 */

/**
 * Finds the index of an entity in an array by ID or localId.
 * 
 * @param entities - Array of entities to search
 * @param entityId - ID or localId to find
 * @param entityType - Type name for error messages (e.g., "Shopping item")
 * @returns Index of the entity
 * @throws Error if entity not found
 */
export function findEntityIndex<T extends { id: string; localId: string }>(
  entities: T[],
  entityId: string,
  entityType: string
): number {
  const index = entities.findIndex(e => e.id === entityId || e.localId === entityId);
  if (index === -1) {
    throw new Error(`${entityType} not found: ${entityId}`);
  }
  return index;
}

/**
 * Updates an entity in an array and saves it using the provided save function.
 * 
 * @param entities - Array of entities
 * @param index - Index of the entity to update
 * @param updater - Function that takes the existing entity and returns the updated entity
 * @param saveFn - Function to save the updated entities array
 * @returns The updated entity
 */
export async function updateEntityInStorage<T extends { id: string; localId: string }>(
  entities: T[],
  index: number,
  updater: (entity: T) => T,
  saveFn: (entities: T[]) => Promise<void>
): Promise<T> {
  const updated = updater(entities[index]);
  const updatedEntities = [...entities];
  updatedEntities[index] = updated;
  await saveFn(updatedEntities);
  return updated;
}
