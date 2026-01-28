/**
 * Cache Metadata Utilities
 * 
 * Manages cache metadata (lastSyncedAt) per entity type for signed-in users.
 * Metadata is stored separately from entity data to track cache freshness.
 * 
 * Storage key pattern: @kitchen_hub_cache_meta_${entityType}
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CURRENT_CACHE_METADATA_STORAGE_VERSION } from './cacheStorage.constants';
import type { CacheMetadataFormat } from './cacheStorage.types';

export type SyncEntityType = 'recipes' | 'shoppingLists' | 'chores' | 'shoppingItems';

/**
 * Cache metadata read status indicating the result of reading metadata.
 */
export type CacheMetadataReadStatus = 'ok' | 'migrated' | 'future_version' | 'corrupt';

/**
 * Cache metadata structure
 * Tracks when data was last synced from the server
 */
export interface CacheMetadata {
  /**
   * ISO 8601 timestamp of when data was last synced from the server
   */
  lastSyncedAt: string;
  /**
   * Storage schema version for this cache metadata.
   * - Omitted/null in legacy records (treated as version 1 on read).
   * - Must be a positive integer when written by current code.
   * Version 1 corresponds to the current live schema (pre-change state).
   */
  version?: number;
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
 * Safely parses JSON with error handling
 * 
 * @param raw - Raw JSON string or null
 * @param key - Storage key (for error messages)
 * @returns Parsed value or null if invalid
 */
function safeParseJSON(raw: string | null, key: string): unknown | null {
  if (!raw) {
    return null;
  }
  
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Failed to parse JSON from ${key}:`, error);
    return null;
  }
}

/**
 * Detects the format of cache metadata from raw parsed data.
 * 
 * @param parsed - Parsed JSON value
 * @returns Format detection result
 */
function detectCacheMetadataFormat(parsed: unknown): CacheMetadataFormat {
  if (!parsed || typeof parsed !== 'object') {
    return 'wrong_type';
  }
  
  const obj = parsed as Record<string, unknown>;
  
  // Check if it has version field (versioned format)
  if (typeof obj.version === 'number') {
    const version = obj.version;
    if (version === CURRENT_CACHE_METADATA_STORAGE_VERSION) {
      return 'current';
    } else if (version > CURRENT_CACHE_METADATA_STORAGE_VERSION) {
      return 'future';
    }
    // version < CURRENT is treated as legacy (will be migrated)
    return 'legacy';
  }
  
  // No version field - legacy format
  if (typeof obj.lastSyncedAt === 'string') {
    return 'legacy';
  }
  
  return 'wrong_type';
}

/**
 * Migrates cache metadata from legacy or older versions to current version.
 * 
 * Migration rules:
 * - Pure transform (no storage I/O)
 * - Idempotent (safe if re-run)
 * - Schema-only (not business logic)
 * 
 * @param parsed - Parsed JSON value
 * @returns Migration result with status
 */
function migrateCacheMetadata(parsed: unknown): { result: CacheMetadata; status: CacheMetadataReadStatus } {
  const format = detectCacheMetadataFormat(parsed);
  
  if (format === 'corrupt' || format === 'wrong_type') {
    throw new Error(`Cannot migrate corrupt or invalid metadata format: ${format}`);
  }
  
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid metadata: not an object');
  }
  
  const obj = parsed as Record<string, unknown>;
  
  // Extract lastSyncedAt
  const lastSyncedAt = typeof obj.lastSyncedAt === 'string' ? obj.lastSyncedAt : '';
  
  // Validate lastSyncedAt is valid ISO string
  if (!lastSyncedAt || isNaN(new Date(lastSyncedAt).getTime())) {
    throw new Error('Invalid lastSyncedAt timestamp');
  }
  
  // Determine if migration is needed
  const version = typeof obj.version === 'number' ? obj.version : 1;
  const needsMigration = version < CURRENT_CACHE_METADATA_STORAGE_VERSION || format === 'legacy';
  
  // Build normalized metadata
  const result: CacheMetadata = {
    lastSyncedAt,
    version: CURRENT_CACHE_METADATA_STORAGE_VERSION,
  };
  
  return {
    result,
    status: needsMigration ? 'migrated' : 'ok',
  };
}

/**
 * Reads cache metadata for a given entity type
 * 
 * Handles legacy format (no version), current version, future versions, and corruption.
 * Migrates legacy data and writes back normalized form.
 * 
 * @param entityType - The entity type to get metadata for
 * @returns The cache metadata if it exists, null otherwise
 */
export async function getCacheMetadata(
  entityType: SyncEntityType
): Promise<CacheMetadata | null> {
  const key = getCacheMetadataKey(entityType);
  
  try {
    const raw = await AsyncStorage.getItem(key);
    
    if (!raw) {
      return null;
    }
    
    // Parse JSON safely
    const parsed = safeParseJSON(raw, key);
    if (!parsed) {
      // Corrupt JSON - never write back, never clear
      console.error(`Corrupted cache metadata JSON for ${entityType}`);
      return null;
    }
    
    // Detect format
    const format = detectCacheMetadataFormat(parsed);
    
    // Handle corruption
    if (format === 'corrupt' || format === 'wrong_type') {
      // Never write back corrupt data, never clear
      console.error(`Invalid cache metadata format for ${entityType}: ${format}`);
      return null;
    }
    
    // Handle future version
    if (format === 'future') {
      const obj = parsed as Record<string, unknown>;
      const lastSyncedAt = typeof obj.lastSyncedAt === 'string' ? obj.lastSyncedAt : '';
      
      // Prefer "ignore version" over "return null" if parseable
      if (lastSyncedAt && !isNaN(new Date(lastSyncedAt).getTime())) {
        // Return valid lastSyncedAt but don't write back
        const futureVersion = (obj as { version?: number }).version ?? CURRENT_CACHE_METADATA_STORAGE_VERSION;
        console.warn(
          `[Cache Schema Version] ${entityType} metadata has future version ${futureVersion} (current=${CURRENT_CACHE_METADATA_STORAGE_VERSION}). ` +
          `Preserving lastSyncedAt but not migrating.`
        );
        return {
          lastSyncedAt,
          version: futureVersion,
        };
      }
      
      // Invalid lastSyncedAt in future version - return null
      const futureVersion = (obj as { version?: number }).version ?? CURRENT_CACHE_METADATA_STORAGE_VERSION;
      console.warn(
        `[Cache Schema Version] ${entityType} metadata has future version ${futureVersion} but invalid lastSyncedAt`
      );
      return null;
    }
    
    // Migrate legacy or older version
    try {
      const { result, status } = migrateCacheMetadata(parsed);
      
      // Write back normalized metadata only if migration occurred and blob differs
      if (status === 'migrated') {
        const normalizedJson = JSON.stringify(result);
        if (normalizedJson !== raw) {
          try {
            await AsyncStorage.setItem(key, normalizedJson);
          } catch (writeError) {
            // Log but don't throw - metadata read succeeded even if write-back failed
            console.warn(`Failed to write back normalized metadata for ${entityType}:`, writeError);
          }
        }
      }
      
      return result;
    } catch (migrationError) {
      // Migration failed - return null but don't write back corrupt data
      console.error(`Failed to migrate cache metadata for ${entityType}:`, migrationError);
      return null;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Transient storage errors - log and return null (caller can handle missing metadata)
    console.error(`Failed to read cache metadata for ${entityType}:`, errorMessage);
    return null;
  }
}

/**
 * Updates cache metadata for a given entity type
 * 
 * Always sets version field to CURRENT_CACHE_METADATA_STORAGE_VERSION.
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
    const metadata: CacheMetadata = {
      lastSyncedAt,
      version: CURRENT_CACHE_METADATA_STORAGE_VERSION,
    };
    
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
