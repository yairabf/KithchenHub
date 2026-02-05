/**
 * Cache-Aware Repository
 * 
 * Implements cache-first read strategy:
 * - Fetches from API ONLY when cache is missing (first login) or forceRefresh=true (explicit refresh)
 * - Returns cached data for all other cases (fresh/stale/expired)
 * - No background refresh - data is served from cache until explicitly refreshed
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENTITY_TYPES, getSignedInCacheKey } from '../storage/dataModeStorage';
import { EntityTimestamps, toPersistedTimestamps } from '../types/entityMetadata';
import type { SyncEntityType } from '../utils/cacheMetadata';
import { getCacheMetadata, updateCacheMetadata, clearCacheMetadata } from '../utils/cacheMetadata';
import { getCacheState, type CacheState } from '../config/cacheConfig';
import { applyRemoteUpdatesToLocal } from '../utils/syncApplication';
import { cacheEvents } from '../utils/cacheEvents';
import { readCacheArray, writeCacheArray } from '../utils/cacheStorage';

/**
 * Entity type to storage key mapping
 */
const entityTypeToStorageKey: Record<SyncEntityType, string> = {
  recipes: ENTITY_TYPES.recipes,
  shoppingLists: ENTITY_TYPES.shoppingLists,
  shoppingItems: ENTITY_TYPES.shoppingItems,
  chores: ENTITY_TYPES.chores,
};

/**
 * Reads cached entities from storage using versioned cache storage
 * 
 * Handles future_version status appropriately: prefers network fetch but preserves local data.
 * 
 * @param entityType - The entity type to read
 * @returns Array of cached entities, or empty array if none exist
 */
async function readCachedEntities<T extends EntityTimestamps>(
  entityType: SyncEntityType
): Promise<T[]> {
  try {
    const result = await readCacheArray<T>(entityType);

    // Handle future_version status: prefer network but don't blow away local data
    if (result.status === 'future_version') {
      // Log for investigation but return the data (preserve local)
      console.warn(
        `Cache for ${entityType} has future version. ` +
        `Returning cached data but repository should prefer network fetch.`
      );
      return result.data;
    }

    // Handle corrupt status: return empty array (will trigger network fetch)
    if (result.status === 'corrupt') {
      console.error(`Cache for ${entityType} is corrupt. Returning empty array.`);
      return [];
    }

    // Handle ok and migrated statuses: return data normally
    return result.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to read cached ${entityType}:`, errorMessage);
    return [];
  }
}

/**
 * Writes entities to cache and updates metadata
 * 
 * Implements write-through caching: data is written to cache immediately
 * and metadata is updated to mark cache as fresh.
 * Uses versioned cache storage format.
 * 
 * @param entityType - The entity type to write
 * @param entities - Array of entities to cache
 * @param getId - Function to extract entity ID (for validation)
 * @throws Error if storage write fails
 */
async function writeCachedEntities<T extends EntityTimestamps>(
  entityType: SyncEntityType,
  entities: T[],
  getId: (entity: T) => string
): Promise<void> {
  try {
    // Use versioned cache storage (wraps entities in versioned format)
    await writeCacheArray(entityType, entities);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to write cached ${entityType}: ${errorMessage}`, { cause: error });
  }
}

/**
 * Cache-first read strategy
 * 
 * Implements the cache-first strategy:
 * - Fresh: Return cache, no API call
 * - Stale: Return cache, no API call (use refresh() to fetch)
 * - Expired: Return cache, no API call (use refresh() to fetch)
 * - Missing: Fetch from API (first login only)
 * - Future version: Prefer network fetch but preserve local data (don't blow away)
 * 
 * API calls are made ONLY when:
 * 1. Cache is missing (first login)
 * 2. forceRefresh=true (explicit refresh via repository.refresh())
 * 
 * All other cases return cached data without API calls.
 * Use the repository's refresh() method to force a fresh fetch from the API.
 * 
 * @param entityType - The entity type to get
 * @param fetchFn - Function that fetches fresh data from API
 * @param getId - Function to extract entity ID for merging
 * @param isOnline - Whether the device is online
 * @param forceRefresh - If true, force fetch from API even if cache exists (default: false)
 * @returns Array of entities
 */
export async function getCached<T extends EntityTimestamps>(
  entityType: SyncEntityType,
  fetchFn: () => Promise<T[]>,
  getId: (entity: T) => string,
  isOnline: boolean,
  forceRefresh: boolean = false
): Promise<T[]> {
  console.log(`[getCached] Starting for ${entityType}, isOnline: ${isOnline}, forceRefresh: ${forceRefresh}`);

  // If forceRefresh is true, always fetch from API and replace cache entirely
  if (forceRefresh && isOnline) {
    console.log(`[getCached] ${entityType} force refresh requested, fetching from API...`);
    const fresh = await fetchFn();
    console.log(`[getCached] ${entityType} fetched ${fresh.length} items from API`);
    await writeCachedEntities(entityType, fresh, getId);
    await updateCacheMetadata(entityType, new Date().toISOString());
    // Emit cache change event to trigger UI updates
    cacheEvents.emitCacheChange(entityType);
    return fresh;
  }

  // Read cache with status tracking
  const cacheResult = await readCacheArray<T>(entityType);
  const cached = cacheResult.data;
  const metadata = await getCacheMetadata(entityType);
  const state = getCacheState(entityType, metadata?.lastSyncedAt ?? null);
  console.log(`[getCached] ${entityType} cache state: ${state}, cached items: ${cached.length}, status: ${cacheResult.status}`);

  // Handle future_version status: prefer network but preserve local data
  if (cacheResult.status === 'future_version') {
    if (isOnline) {
      // Online: prefer network fetch but don't overwrite local data
      // Fetch from network and merge with local
      try {
        const fresh = await fetchFn();
        // Merge remote updates with local (preserves future version data)
        await applyRemoteUpdatesToLocal(entityType, fresh, getId);
        await updateCacheMetadata(entityType, new Date().toISOString());
        return fresh;
      } catch (error) {
        // Network fetch failed - return local data
        console.warn(`Network fetch failed for ${entityType} with future version cache, returning local data:`, error);
        return cached;
      }
    }
    // Offline: return local data
    return cached;
  }

  // Handle corrupt status: treat as missing
  if (cacheResult.status === 'corrupt') {
    if (!isOnline) {
      // Offline and corrupt cache - return empty array
      return [];
    }
    // Online and corrupt cache - fetch from network
    const fresh = await fetchFn();
    await writeCachedEntities(entityType, fresh, getId);
    // CRITICAL: Update metadata after writing cache to prevent treating it as "missing" on next read
    await updateCacheMetadata(entityType, new Date().toISOString());
    // Emit cache change event to trigger UI updates
    cacheEvents.emitCacheChange(entityType);
    return fresh;
  }

  // Handle missing cache
  if (state === 'missing') {
    if (!isOnline) {
      // Offline and no cache - return empty array
      return [];
    }
    // Online and no cache - fetch from network
    console.log(`[getCached] ${entityType} cache missing, fetching from API...`);
    const fresh = await fetchFn();
    console.log(`[getCached] ${entityType} fetched ${fresh.length} items from API`);
    await writeCachedEntities(entityType, fresh, getId);
    // CRITICAL: Update metadata after writing cache to prevent treating it as "missing" on next read
    await updateCacheMetadata(entityType, new Date().toISOString());
    // Emit cache change event to trigger UI updates
    cacheEvents.emitCacheChange(entityType);
    return fresh;
  }

  // Handle expired cache
  if (state === 'expired') {
    // Return cached data (even if expired) - forceRefresh is handled above
    console.log(`[getCached] ${entityType} cache expired, returning cached data (use refresh() to fetch from API)`);
    return cached;
  }

  // Handle stale cache
  if (state === 'stale') {
    // Return cached data immediately (even if stale)
    // Only fetch from API on explicit refresh (forceRefresh=true) or pull-to-refresh
    console.log(`[getCached] ${entityType} cache is stale, returning cached data (use refresh() to fetch from API)`);
    return cached;
  }

  // Handle fresh cache
  // state === 'fresh'
  return cached;
}

/**
 * Writes entities to cache and updates metadata (write-through)
 * 
 * @param entityType - The entity type to write
 * @param entities - Array of entities to cache
 * @param getId - Function to extract entity ID
 */
export async function setCached<T extends EntityTimestamps>(
  entityType: SyncEntityType,
  entities: T[],
  getId: (entity: T) => string
): Promise<void> {
  // Always deduplicate by ID before writing (defensive - prevent duplicates from race conditions)
  const deduplicated = Array.from(
    new Map(entities.map((entity) => [getId(entity), entity])).values()
  );

  await writeCachedEntities(entityType, deduplicated, getId);

  // Emit cache change event to trigger UI updates
  cacheEvents.emitCacheChange(entityType);
}

/**
 * Reads cached entities for write-through operations
 * 
 * Helper function to read current cache state before updating it.
 * Used by repositories in create/update/delete operations.
 * 
 * This is a thin wrapper around `readCachedEntities` that provides:
 * - A clear, semantic API for repository operations (emphasizes "for update" context)
 * - Future extensibility point if we need to add update-specific logic (e.g., locking, validation)
 * - Consistent interface for repositories to use
 * 
 * @param entityType - The entity type to read
 * @returns Array of currently cached entities
 * @throws Error if storage read fails (unexpected errors only)
 */
export async function readCachedEntitiesForUpdate<T extends EntityTimestamps>(
  entityType: SyncEntityType
): Promise<T[]> {
  return readCachedEntities<T>(entityType);
}

/**
 * Updates cache with a single entity (for create operations)
 * 
 * Helper function that reads current cache, adds new entity, and writes back.
 * Handles errors gracefully - logs but doesn't throw if cache update fails.
 * 
 * @param entityType - The entity type to update
 * @param newEntity - The entity to add to cache
 * @param getId - Function to extract entity ID
 * @throws Error if cache read fails (unexpected errors only)
 */
export async function addEntityToCache<T extends EntityTimestamps>(
  entityType: SyncEntityType,
  newEntity: T,
  getId: (entity: T) => string
): Promise<void> {
  try {
    const current = await readCachedEntitiesForUpdate<T>(entityType);
    const entityId = getId(newEntity);

    // Check if entity already exists (by ID) to prevent duplicates
    const exists = current.some(entity => getId(entity) === entityId);
    if (exists) {
      console.warn(`[addEntityToCache] Entity with ID ${entityId} already exists in cache for ${entityType}, skipping add`);
      return;
    }

    // Deduplicate current array before adding (defensive)
    const deduplicatedCurrent = Array.from(
      new Map(current.map((entity) => [getId(entity), entity])).values()
    );

    await setCached(entityType, [...deduplicatedCurrent, newEntity], getId);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to update cache after create for ${entityType}:`, errorMessage);
    // Don't throw - server operation succeeded, cache update is best-effort
    // Optionally invalidate cache to force refresh on next read
    try {
      await invalidateCache(entityType);
    } catch (invalidateError) {
      // Ignore invalidation errors
      console.error(`Failed to invalidate cache after create error:`, invalidateError);
    }
  }
}

/**
 * Updates cache with a single entity (for update operations)
 * 
 * Helper function that reads current cache, updates matching entity, and writes back.
 * Handles errors gracefully - logs but doesn't throw if cache update fails.
 * 
 * **Known Limitation - Race Condition:**
 * If multiple concurrent updates occur for the same entity type, there's a potential
 * race condition where:
 * 1. Both operations read the same cache state
 * 2. Both apply their updates
 * 3. The second write overwrites the first
 * 
 * This is acceptable for the current use case because:
 * - Updates are typically sequential in user interactions
 * - Server is the source of truth (cache will refresh on next read)
 * - Cache updates are best-effort (server write already succeeded)
 * 
 * Future enhancement: Consider adding optimistic locking or a queue for concurrent updates.
 * 
 * @param entityType - The entity type to update
 * @param updatedEntity - The entity to update in cache
 * @param getId - Function to extract entity ID
 * @param matchFn - Function to match entity in cache
 * @throws Error if cache read fails (unexpected errors only)
 */
export async function updateEntityInCache<T extends EntityTimestamps>(
  entityType: SyncEntityType,
  updatedEntity: T,
  getId: (entity: T) => string,
  matchFn: (entity: T) => boolean
): Promise<void> {
  try {
    // Validate updatedEntity has an ID
    const updatedId = getId(updatedEntity);
    if (!updatedId) {
      console.error(`[updateEntityInCache] Updated entity for ${entityType} is missing ID, cannot update cache`);
      return;
    }

    // Read cache with status check to detect corruption
    const cacheResult = await readCacheArray<T>(entityType);
    const current = cacheResult.data;

    // Detect corrupt cache and log warning
    if (cacheResult.status === 'corrupt') {
      console.error(`[updateEntityInCache] Cache for ${entityType} is corrupt (status: corrupt). This may cause data loss. Invalidating cache and fetching fresh data.`);
      // Invalidate corrupt cache to force fresh fetch
      await invalidateCache(entityType);
      // Still proceed with update - add entity to empty cache
      await setCached(entityType, [updatedEntity], getId);
      console.warn(`[updateEntityInCache] Added entity ${updatedId} to empty cache after corruption. Fresh data should be fetched on next read.`);
      return;
    }

    console.log(`[updateEntityInCache] Updating ${entityType} cache: current count=${current.length}, status=${cacheResult.status}, updating ID=${updatedId}`);

    // Check if any entity matches
    const matchedEntities = current.filter(matchFn);
    if (matchedEntities.length === 0) {
      console.warn(`[updateEntityInCache] No matching entity found for ${entityType} with ID ${updatedId}, adding to cache instead`);
      // If no match found, add the entity to cache (might be a new entity)
      await setCached(entityType, [...current, updatedEntity], getId);
      return;
    }

    if (matchedEntities.length > 1) {
      console.warn(`[updateEntityInCache] Multiple entities matched for ${entityType} with ID ${updatedId}, updating all matches`);
    }

    // Update matched entities
    const updatedCache = current.map(entity => {
      if (matchFn(entity)) {
        // Ensure the updated entity has the same ID as the original
        const entityId = getId(entity);
        if (entityId !== updatedId) {
          console.warn(`[updateEntityInCache] ID mismatch: entity ID=${entityId}, updated ID=${updatedId}, preserving original ID`);
          return { ...updatedEntity, id: entityId } as T;
        }
        return updatedEntity;
      }
      return entity;
    });

    // Validate all entities in updated cache have IDs
    const entitiesWithoutIds = updatedCache.filter(e => !getId(e));
    if (entitiesWithoutIds.length > 0) {
      console.error(`[updateEntityInCache] Found ${entitiesWithoutIds.length} entities without IDs after update, filtering them out`);
      const validCache = updatedCache.filter(e => getId(e));
      await setCached(entityType, validCache, getId);
    } else {
      await setCached(entityType, updatedCache, getId);
    }

    console.log(`[updateEntityInCache] Successfully updated ${entityType} cache: new count=${updatedCache.length}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[updateEntityInCache] Failed to update cache for ${entityType}:`, errorMessage);
    console.error(`[updateEntityInCache] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    // Don't throw - server operation succeeded, cache update is best-effort
    // Don't invalidate cache on error - preserve existing data
  }
}

/**
 * Invalidates cache for an entity type (clears cache and metadata)
 *
 * @param entityType - The entity type to invalidate
 */
export async function invalidateCache(entityType: SyncEntityType): Promise<void> {
  const storageEntity = entityTypeToStorageKey[entityType];
  const storageKey = getSignedInCacheKey(storageEntity);

  try {
    await AsyncStorage.removeItem(storageKey);
    await clearCacheMetadata(entityType);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to invalidate cache for ${entityType}: ${errorMessage}`, { cause: error });
  }
}

/** All entity types that use signed-in cache. */
const SIGNED_IN_ENTITY_TYPES: SyncEntityType[] = [
  'recipes',
  'shoppingLists',
  'shoppingItems',
  'chores',
];

/**
 * Invalidates all signed-in entity caches.
 * Use on web app mount so each tab/refresh fetches fresh data from the server
 * and multiple browser tabs show consistent data.
 */
/**
 * Invalidates all signed-in entity caches.
 * Use on web app mount so each tab/refresh fetches fresh data from the server
 * and multiple browser tabs show consistent data.
 */
export async function invalidateAllSignedInCaches(): Promise<void> {
  await Promise.all(SIGNED_IN_ENTITY_TYPES.map((entityType) => invalidateCache(entityType)));
}

/**
 * Removes an entity from cache
 * 
 * Helper function that reads current cache, removes matching entity, and writes back.
 * Handles errors gracefully - logs but doesn't throw if cache update fails.
 * 
 * @param entityType - The entity type to update
 * @param entityId - The ID of the entity to remove
 * @param getId - Function to extract entity ID
 * @throws Error if cache read fails (unexpected errors only)
 */
export async function removeEntityFromCache<T extends EntityTimestamps>(
  entityType: SyncEntityType,
  entityId: string,
  getId: (entity: T) => string
): Promise<void> {
  try {
    const current = await readCachedEntitiesForUpdate<T>(entityType);

    // Check if entity exists
    const exists = current.some(entity => getId(entity) === entityId);
    if (!exists) {
      console.warn(`[removeEntityFromCache] Entity with ID ${entityId} not found in cache for ${entityType}, skipping remove`);
      return;
    }

    // Filter out the entity
    const updatedCache = current.filter(entity => getId(entity) !== entityId);

    await setCached(entityType, updatedCache, getId);
    console.log(`[removeEntityFromCache] Successfully removed entity ${entityId} from ${entityType} cache`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[removeEntityFromCache] Failed to remove entity from cache for ${entityType}:`, errorMessage);
    // Don't throw - cache update is best-effort
  }
}

