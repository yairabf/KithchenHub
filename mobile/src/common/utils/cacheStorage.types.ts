/**
 * Cache Storage Types
 * 
 * Defines types for versioned cache array storage schema.
 * Mirrors the pattern from syncQueueStorage.types.ts for consistency.
 */

/**
 * Versioned cache array wrapper format.
 * 
 * Cache arrays are stored as a wrapper object containing:
 * - version: Storage schema version (positive integer)
 * - entities: Array of cached entities
 * 
 * Version 1 corresponds to the current live schema (pre-change state).
 */
export interface VersionedCacheArray<T> {
  /**
   * Storage schema version for this cache array.
   * - Omitted/null in legacy records (treated as version 1 on read).
   * - Must be a positive integer when written by current code.
   */
  version: number;
  /**
   * Array of cached entities.
   */
  entities: T[];
}

/**
 * Cache read status indicating the result of reading cache data.
 */
export type CacheReadStatus = 'ok' | 'migrated' | 'future_version' | 'corrupt';

/**
 * Cache array format detection result.
 * Used internally to determine how to handle raw cache data.
 */
export type CacheArrayFormat = 'legacy' | 'current_wrapper' | 'future_wrapper' | 'corrupt' | 'wrong_type';

/**
 * Cache metadata format detection result.
 * Used internally to determine how to handle raw metadata.
 */
export type CacheMetadataFormat = 'legacy' | 'current' | 'future' | 'corrupt' | 'wrong_type';
