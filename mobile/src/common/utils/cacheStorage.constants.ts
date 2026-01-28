import type { SyncEntityType } from './cacheMetadata';

/**
 * Current storage schema version for cache entity arrays (global constant).
 * 
 * Version 1 corresponds to the pre-versioned schema that is already in production.
 * All entity types use this version unless overridden in CURRENT_CACHE_ENTITY_STORAGE_VERSION_BY_TYPE.
 */
export const CURRENT_CACHE_ENTITY_STORAGE_VERSION = 1;

/**
 * Optional per-entity type storage schema version overrides.
 * 
 * Allows future per-entity versioning without changing the storage format.
 * If an entity type is not in this map, it uses CURRENT_CACHE_ENTITY_STORAGE_VERSION.
 * 
 * Currently empty - all entity types use the global version.
 */
export const CURRENT_CACHE_ENTITY_STORAGE_VERSION_BY_TYPE: Partial<Record<SyncEntityType, number>> = {};

/**
 * Gets the current storage schema version for a given entity type.
 * 
 * Returns the per-entity override if it exists and is valid, otherwise returns the global version.
 * Validates override values to prevent invalid version numbers.
 * 
 * @param entityType - The entity type to get the version for
 * @returns The current storage schema version for the entity type
 */
export function getCurrentCacheEntityStorageVersion(entityType: SyncEntityType): number {
  const override = CURRENT_CACHE_ENTITY_STORAGE_VERSION_BY_TYPE[entityType];
  if (override !== undefined) {
    // Validate override is a positive integer
    if (!Number.isInteger(override) || override <= 0) {
      console.error(
        `Invalid version override for ${entityType}: ${override}. ` +
        `Must be a positive integer. Using global version ${CURRENT_CACHE_ENTITY_STORAGE_VERSION}.`
      );
      return CURRENT_CACHE_ENTITY_STORAGE_VERSION;
    }
    return override;
  }
  return CURRENT_CACHE_ENTITY_STORAGE_VERSION;
}

/**
 * Current storage schema version for cache metadata.
 * 
 * Version 1 corresponds to the pre-versioned schema that is already in production.
 */
export const CURRENT_CACHE_METADATA_STORAGE_VERSION = 1;
