/**
 * Cache Metadata Utilities
 * 
 * Manages cache metadata (lastSyncedAt) per entity type for signed-in users.
 * Metadata is stored separately from entity data to track cache freshness.
 * 
 * Storage key pattern: @kitchen_hub_cache_meta_${entityType}
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type SyncEntityType = 'recipes' | 'shoppingLists' | 'chores' | 'shoppingItems';

/**
 * Cache metadata structure
 * Tracks when data was last synced from the server
 */
export interface CacheMetadata {
  lastSyncedAt: string; // ISO 8601 timestamp
}

/**
 * Storage key prefix for cache metadata
 */
const CACHE_META_PREFIX = '@kitchen_hub_cache_meta_';

/**
 * Gets the storage key for cache metadata of a given entity type
 * 
 * @param entityType - The entity type to get metadata for
 * @returns The storage key for the metadata
 */
function getCacheMetadataKey(entityType: SyncEntityType): string {
  return `${CACHE_META_PREFIX}${entityType}`;
}

/**
 * Reads cache metadata for a given entity type
 * 
 * @param entityType - The entity type to get metadata for
 * @returns The cache metadata if it exists, null otherwise
 * @throws Error if storage read fails
 */
export async function getCacheMetadata(
  entityType: SyncEntityType
): Promise<CacheMetadata | null> {
  try {
    const key = getCacheMetadataKey(entityType);
    const raw = await AsyncStorage.getItem(key);
    
    if (!raw) {
      return null;
    }
    
    const parsed = JSON.parse(raw) as CacheMetadata;
    
    // Validate structure
    if (!parsed || typeof parsed.lastSyncedAt !== 'string') {
      console.error(`Invalid cache metadata format for ${entityType}`);
      return null;
    }
    
    return parsed;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Distinguish between data corruption (JSON parse errors) and transient storage errors
    if (error instanceof SyntaxError) {
      // Data corruption - clear corrupted metadata to prevent repeated parse attempts
      console.error(`Corrupted cache metadata for ${entityType}: ${errorMessage}`);
      try {
        await AsyncStorage.removeItem(key);
      } catch (clearError) {
        // Log but don't throw - we're already in error handling
        console.error(`Failed to clear corrupted metadata for ${entityType}:`, clearError);
      }
      return null;
    }
    
    // Transient storage errors - log and return null (caller can handle missing metadata)
    console.error(`Failed to read cache metadata for ${entityType}:`, errorMessage);
    return null;
  }
}

/**
 * Updates cache metadata for a given entity type
 * 
 * @param entityType - The entity type to update metadata for
 * @param lastSyncedAt - ISO 8601 timestamp of when data was last synced
 * @throws Error if storage write fails
 */
export async function updateCacheMetadata(
  entityType: SyncEntityType,
  lastSyncedAt: string
): Promise<void> {
  try {
    const key = getCacheMetadataKey(entityType);
    const metadata: CacheMetadata = { lastSyncedAt };
    
    await AsyncStorage.setItem(key, JSON.stringify(metadata));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to update cache metadata for ${entityType}: ${errorMessage}`, { cause: error });
  }
}

/**
 * Clears cache metadata for a given entity type
 * 
 * @param entityType - The entity type to clear metadata for
 * @throws Error if storage delete fails
 */
export async function clearCacheMetadata(entityType: SyncEntityType): Promise<void> {
  try {
    const key = getCacheMetadataKey(entityType);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to clear cache metadata for ${entityType}: ${errorMessage}`, { cause: error });
  }
}
