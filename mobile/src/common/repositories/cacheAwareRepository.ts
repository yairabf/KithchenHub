/**
 * Cache-Aware Repository
 * 
 * Implements cache-first read strategy with background refresh for stale data.
 * Handles cache state (fresh/stale/expired) and network-aware behavior.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENTITY_TYPES, getSignedInCacheKey } from '../storage/dataModeStorage';
import { EntityTimestamps, toPersistedTimestamps } from '../types/entityMetadata';
import type { SyncEntityType } from '../utils/cacheMetadata';
import { getCacheMetadata, updateCacheMetadata, clearCacheMetadata } from '../utils/cacheMetadata';
import { getCacheState, type CacheState } from '../config/cacheConfig';
import { queueRefresh } from '../utils/backgroundRefresh';
import { applyRemoteUpdatesToLocal } from '../utils/syncApplication';
import { normalizePersistedArray } from '../utils/storageHelpers';

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
 * Reads cached entities from storage
 * 
 * @param entityType - The entity type to read
 * @returns Array of cached entities, or empty array if none exist
 * @throws Error if storage read fails (unexpected errors only)
 */
async function readCachedEntities<T extends EntityTimestamps>(
  entityType: SyncEntityType
): Promise<T[]> {
  const storageEntity = entityTypeToStorageKey[entityType];
  const storageKey = getSignedInCacheKey(storageEntity);
  
  try {
    const raw = await AsyncStorage.getItem(storageKey);
    return normalizePersistedArray<T>(raw, storageKey);
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
  const storageEntity = entityTypeToStorageKey[entityType];
  const storageKey = getSignedInCacheKey(storageEntity);
  
  try {
    const serialized = entities.map(toPersistedTimestamps);
    await AsyncStorage.setItem(storageKey, JSON.stringify(serialized));
    await updateCacheMetadata(entityType, new Date().toISOString());
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to write cached ${entityType}: ${errorMessage}`, { cause: error });
  }
}

/**
 * Cache-first read with background refresh
 * 
 * Implements the cache-first strategy:
 * - Fresh: Return cache, no refresh
 * - Stale: Return cache immediately, refresh in background if online
 * - Expired: Block for network if online, return cache if offline
 * - Missing: Fetch from network
 * 
 * @param entityType - The entity type to get
 * @param fetchFn - Function that fetches fresh data from API
 * @param getId - Function to extract entity ID for merging
 * @param isOnline - Whether the device is online
 * @returns Array of entities
 */
export async function getCached<T extends EntityTimestamps>(
  entityType: SyncEntityType,
  fetchFn: () => Promise<T[]>,
  getId: (entity: T) => string,
  isOnline: boolean
): Promise<T[]> {
  // Read cache and metadata
  const cached = await readCachedEntities<T>(entityType);
  const metadata = await getCacheMetadata(entityType);
  const state = getCacheState(entityType, metadata?.lastSyncedAt ?? null);

  // Handle missing cache
  if (state === 'missing') {
    if (!isOnline) {
      // Offline and no cache - return empty array
      return [];
    }
    // Online and no cache - fetch from network
    const fresh = await fetchFn();
    await writeCachedEntities(entityType, fresh, getId);
    return fresh;
  }

  // Handle expired cache
  if (state === 'expired') {
    if (!isOnline) {
      // Offline - return cached data (better than nothing)
      return cached;
    }
    // Online - block for network fetch
    const fresh = await fetchFn();
    await applyRemoteUpdatesToLocal(entityType, fresh, getId);
    await updateCacheMetadata(entityType, new Date().toISOString());
    return fresh;
  }

  // Handle stale cache
  if (state === 'stale') {
    if (isOnline) {
      // Trigger background refresh (non-blocking)
      queueRefresh(entityType, fetchFn, getId).catch((error) => {
        // Background refresh errors are already logged in queueRefresh
        console.error(`Background refresh error for ${entityType}:`, error);
      });
    }
    // Return cached data immediately (even if stale)
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
  await writeCachedEntities(entityType, entities, getId);
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
