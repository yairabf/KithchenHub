/**
 * Cache Storage Utilities
 * 
 * Thin wrapper layer for safe cache access with TTL support.
 * Uses existing cache infrastructure (cacheMetadata, cacheConfig) without duplicating logic.
 * Provides minimal, practical validation for safe read/write operations.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENTITY_TYPES, getSignedInCacheKey } from '../storage/dataModeStorage';
import { toPersistedTimestamps } from '../types/entityMetadata';
import type { SyncEntityType, CacheMetadata } from './cacheMetadata';
import { getCacheMetadata, updateCacheMetadata } from './cacheMetadata';
import { getCacheState as getCacheStateFromConfig, type CacheState } from '../config/cacheConfig';
import {
  getCurrentCacheEntityStorageVersion,
  CURRENT_CACHE_ENTITY_STORAGE_VERSION,
} from './cacheStorage.constants';
import type {
  VersionedCacheArray,
  CacheReadStatus,
  CacheArrayFormat,
} from './cacheStorage.types';

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
 * Cache read result with state and validation information
 */
export interface CacheReadResult<T> {
  /** Array of cached entities */
  data: T[];
  /** Cache state: 'fresh', 'stale', 'expired', or 'missing' */
  state: CacheState;
  /** Cache age in milliseconds, or null if missing */
  age: number | null;
  /** ISO timestamp of last sync, or null if missing */
  lastSyncedAt: string | null;
  /** True if cache data is valid, false if corrupted or invalid */
  isValid: boolean;
  /** Cache read status indicating migration/future version/corruption */
  status: CacheReadStatus;
}

/**
 * Cache state result with age and timestamp information
 */
export interface CacheStateResult {
  /** Cache state: 'fresh', 'stale', 'expired', or 'missing' */
  state: CacheState;
  /** Cache age in milliseconds, or null if missing */
  age: number | null;
  /** ISO timestamp of last sync, or null if missing */
  lastSyncedAt: string | null;
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
 * Normalizes storage version from unknown value.
 * 
 * @param version - Version value (may be undefined, null, or invalid)
 * @returns Normalized version number (defaults to 1)
 */
function normalizeCacheArrayVersion(version: unknown): number {
  if (typeof version !== 'number' || !Number.isInteger(version) || version <= 0) {
    return 1;
  }
  return version;
}

/**
 * Validates that an entity has a valid ID field.
 * 
 * Centralized validation logic used in multiple places to avoid duplication.
 * 
 * @param item - Entity item to validate
 * @returns True if item has a valid string ID
 */
function validateEntityHasId(item: unknown): item is Record<string, unknown> {
  if (item === null || typeof item !== 'object') {
    return false;
  }
  const recordItem = item as Record<string, unknown>;
  return typeof recordItem.id === 'string' && recordItem.id.trim() !== '';
}

/**
 * Filters entities to only those with valid IDs.
 * 
 * @param entities - Array of entities to filter
 * @param storageKey - Storage key for error messages
 * @returns Filtered array of entities with valid IDs
 */
function filterEntitiesWithValidIds<T>(entities: unknown[], storageKey: string): T[] {
  return entities.filter((item): item is Record<string, unknown> => {
    if (!validateEntityHasId(item)) {
      console.warn(`Skipping entity in ${storageKey}: missing or invalid id`);
      return false;
    }
    return true;
  }) as T[];
}

/**
 * Formats warning message for future version cache data.
 * 
 * Centralized error message formatting for consistency.
 * 
 * @param entityType - Entity type
 * @param version - Future version number
 * @param currentVersion - Current supported version
 * @param context - Additional context message
 * @returns Formatted warning message
 */
function formatFutureVersionWarning(
  entityType: SyncEntityType,
  version: number,
  currentVersion: number,
  context: string
): string {
  return `[Cache Schema Version] ${entityType} has future version ${version} (current=${currentVersion}). ${context}`;
}

/**
 * Detects the format of cache array from raw parsed data.
 * 
 * Distinguishes between:
 * - legacy: no wrapper, just an array
 * - current_wrapper: has wrapper with version === CURRENT
 * - future_wrapper: has wrapper with version > CURRENT
 * - corrupt: unparseable JSON (handled before this function)
 * - wrong_type: parsed but not array or wrapper object
 * 
 * @param parsed - Parsed JSON value
 * @param entityType - Entity type (for version lookup)
 * @returns Format detection result
 */
function detectCacheArrayFormat(parsed: unknown, entityType: SyncEntityType): CacheArrayFormat {
  // Check if it's an array (legacy format)
  if (Array.isArray(parsed)) {
    return 'legacy';
  }
  
  // Check if it's an object (versioned wrapper format)
  if (!parsed || typeof parsed !== 'object') {
    return 'wrong_type';
  }
  
  const obj = parsed as Record<string, unknown>;
  
  // Check if it has version and entities fields (versioned wrapper)
  if ('version' in obj && 'entities' in obj) {
    const version = normalizeCacheArrayVersion(obj.version);
    const currentVersion = getCurrentCacheEntityStorageVersion(entityType);
    
    if (version === currentVersion) {
      return 'current_wrapper';
    } else if (version > currentVersion) {
      return 'future_wrapper';
    }
    // version < currentVersion is treated as legacy (will be migrated)
    return 'legacy';
  }
  
  // Has some structure but not the expected wrapper format
  return 'wrong_type';
}

/**
 * Migration function type for cache entity arrays.
 * 
 * Migration rules:
 * - Pure transform (no storage I/O)
 * - Idempotent (safe if re-run)
 * - Schema-only (not business logic)
 */
type CacheArrayMigrationFn<T> = (data: VersionedCacheArray<T>) => VersionedCacheArray<T>;

/**
 * Migration registry for cache entity arrays.
 * 
 * Maps from version to migration function that transforms data to next version.
 * Migrations are applied sequentially from fromVersion to toVersion.
 */
const CACHE_ENTITY_MIGRATIONS: Record<number, CacheArrayMigrationFn<unknown>> = {
  // Version 1 migration: normalizes legacy arrays (no wrapper) to versioned format
  // This is a no-op for arrays that already have version 1 wrapper
  1: <T>(data: VersionedCacheArray<T>): VersionedCacheArray<T> => {
    // Already in versioned format, just ensure version is set
    return {
      version: CURRENT_CACHE_ENTITY_STORAGE_VERSION,
      entities: data.entities,
    };
  },
};

/**
 * Migrates cache array from legacy or older versions to current version.
 * 
 * @param parsed - Parsed JSON value (may be legacy array or versioned wrapper)
 * @param entityType - Entity type for version lookup
 * @returns Migration result with status
 */
function migrateCacheArray<T>(
  parsed: unknown,
  entityType: SyncEntityType
): { result: VersionedCacheArray<T>; status: CacheReadStatus } {
  const format = detectCacheArrayFormat(parsed, entityType);
  const currentVersion = getCurrentCacheEntityStorageVersion(entityType);
  
  if (format === 'corrupt' || format === 'wrong_type') {
    throw new Error(`Cannot migrate corrupt or invalid cache array format: ${format}`);
  }
  
  // Handle legacy format (no wrapper, just array)
  if (format === 'legacy') {
    if (!Array.isArray(parsed)) {
      // Legacy format but not array - this shouldn't happen if detectCacheArrayFormat is correct
      throw new Error('Legacy format detected but data is not an array');
    }
    
    // Normalize to versioned format
    const result: VersionedCacheArray<T> = {
      version: currentVersion,
      entities: parsed as T[],
    };
    
    return {
      result,
      status: 'migrated',
    };
  }
  
  // Handle versioned wrapper format
  if (format === 'current_wrapper' || format === 'future_wrapper') {
    const wrapper = parsed as VersionedCacheArray<T>;
    const version = normalizeCacheArrayVersion(wrapper.version);
    
    // Future version - don't migrate, just return as-is
    if (version > currentVersion) {
      return {
        result: wrapper,
        status: 'future_version',
      };
    }
    
    // Current or older version - apply migrations sequentially
    let migrated = wrapper;
    let needsMigration = version < currentVersion;
    
    // Apply migrations from current version to target version
    for (let v = version; v < currentVersion; v++) {
      const migrationFn = CACHE_ENTITY_MIGRATIONS[v + 1];
      if (migrationFn) {
        migrated = migrationFn(migrated) as VersionedCacheArray<T>;
      } else {
        // No migration function - assume schema is compatible, just bump version
        migrated = {
          ...migrated,
          version: v + 1,
        };
      }
    }
    
    // Ensure final version matches current
    migrated = {
      ...migrated,
      version: currentVersion,
    };
    
    return {
      result: migrated,
      status: needsMigration ? 'migrated' : 'ok',
    };
  }
  
  // Should not reach here
  throw new Error(`Unexpected cache array format: ${format}`);
}

/**
 * Validates that parsed data is an array
 * 
 * @param parsed - Parsed JSON value
 * @param key - Storage key (for error messages)
 * @returns True if parsed value is an array
 */
function isValidArray(parsed: unknown, key: string): parsed is unknown[] {
  if (!Array.isArray(parsed)) {
    console.error(`Invalid cached data format in ${key}: expected array, got ${typeof parsed}`);
    return false;
  }
  return true;
}

/**
 * Filters array items using optional validator callback
 * 
 * @param items - Array of items to filter
 * @param validator - Optional type guard function
 * @returns Filtered array of valid items
 */
function filterValidItems<T>(items: unknown[], validator?: (x: unknown) => x is T): T[] {
  if (!validator) {
    // No validator - return items as-is (basic validation done by normalizePersistedArray)
    return items as T[];
  }
  
  return items.filter(validator);
}

/**
 * Calculates cache age from lastSyncedAt timestamp
 * 
 * @param lastSyncedAt - ISO 8601 timestamp or null
 * @returns Age in milliseconds, or null if timestamp is invalid or missing
 */
function calculateCacheAge(lastSyncedAt: string | null): number | null {
  if (!lastSyncedAt) {
    return null;
  }
  
  const syncTime = new Date(lastSyncedAt).getTime();
  if (isNaN(syncTime)) {
    return null;
  }
  
  return Date.now() - syncTime;
}

/**
 * Creates a base cache read result with common fields.
 * 
 * @param state - Cache state
 * @param age - Cache age in milliseconds
 * @param lastSyncedAt - Last sync timestamp
 * @param data - Cached entities
 * @param isValid - Whether data is valid
 * @param status - Read status
 * @returns Cache read result
 */
function createCacheReadResult<T>(
  state: CacheState,
  age: number | null,
  lastSyncedAt: string | null,
  data: T[],
  isValid: boolean,
  status: CacheReadStatus
): CacheReadResult<T> {
  return {
    data,
    state,
    age,
    lastSyncedAt,
    isValid,
    status,
  };
}

/**
 * Handles missing cache scenario.
 * 
 * @param entityType - Entity type
 * @returns Cache read result for missing cache
 */
function handleMissingCache<T>(entityType: SyncEntityType): CacheReadResult<T> {
  return createCacheReadResult<T>(
    'missing',
    null,
    null,
    [],
    true, // Missing cache is valid (not corrupted)
    'ok'
  );
}

/**
 * Handles corrupt cache scenario.
 * 
 * Never writes back or clears corrupt data.
 * 
 * @param state - Cache state from metadata
 * @param age - Cache age
 * @param lastSyncedAt - Last sync timestamp
 * @returns Cache read result for corrupt cache
 */
function handleCorruptCache<T>(
  state: CacheState,
  age: number | null,
  lastSyncedAt: string | null
): CacheReadResult<T> {
  return createCacheReadResult<T>(
    state,
    age,
    lastSyncedAt,
    [],
    false,
    'corrupt'
  );
}

/**
 * Handles future version cache scenario.
 * 
 * Never migrates, writes back, or clears future versions.
 * Returns entities if parseable to avoid cache miss loops.
 * 
 * @param wrapper - Versioned cache array wrapper
 * @param entityType - Entity type
 * @param storageKey - Storage key for error messages
 * @param state - Cache state
 * @param age - Cache age
 * @param lastSyncedAt - Last sync timestamp
 * @param validator - Optional validator callback
 * @returns Cache read result for future version
 */
function handleFutureVersionCache<T>(
  wrapper: VersionedCacheArray<T>,
  entityType: SyncEntityType,
  storageKey: string,
  state: CacheState,
  age: number | null,
  lastSyncedAt: string | null,
  validator?: (x: unknown) => x is T
): CacheReadResult<T> {
  const version = normalizeCacheArrayVersion(wrapper.version);
  const currentVersion = getCurrentCacheEntityStorageVersion(entityType);
  
  // Empty array is valid - return empty array with future_version status
  if (!Array.isArray(wrapper.entities)) {
    // Future version but entities is not an array - treat as corrupt
    return handleCorruptCache<T>(state, age, lastSyncedAt);
  }
  
  // Filter out invalid items using centralized validation
  const validItems = filterEntitiesWithValidIds<T>(wrapper.entities, storageKey);
  const filteredItems = filterValidItems<T>(validItems, validator);
  
  // Log warning using centralized formatting
  console.warn(formatFutureVersionWarning(entityType, version, currentVersion, 'Preserving data but not migrating.'));
  
  return createCacheReadResult<T>(
    state,
    age,
    lastSyncedAt,
    filteredItems,
    true,
    'future_version'
  );
}

/**
 * Handles legacy or current version cache scenario.
 * 
 * Migrates if needed and writes back normalized form.
 * 
 * @param parsed - Parsed cache data
 * @param raw - Raw JSON string for comparison
 * @param entityType - Entity type
 * @param storageKey - Storage key
 * @param state - Cache state
 * @param age - Cache age
 * @param lastSyncedAt - Last sync timestamp
 * @param validator - Optional validator callback
 * @returns Cache read result for legacy/current version
 */
async function handleLegacyOrCurrentVersionCache<T>(
  parsed: unknown,
  raw: string,
  entityType: SyncEntityType,
  storageKey: string,
  state: CacheState,
  age: number | null,
  lastSyncedAt: string | null,
  validator?: (x: unknown) => x is T
): Promise<CacheReadResult<T>> {
  try {
    const { result, status } = migrateCacheArray<T>(parsed, entityType);
    
    // Extract entities from versioned wrapper
    const entities = result.entities;
    
    // Validate entities is an array
    if (!Array.isArray(entities)) {
      return handleCorruptCache<T>(state, age, lastSyncedAt);
    }
    
    // Filter out items without required fields using centralized validation
    const validItems = filterEntitiesWithValidIds<T>(entities, storageKey);
    
    // Apply optional validator callback
    const filteredItems = filterValidItems<T>(validItems, validator);
    
    // Write back normalized data only if migration occurred and blob differs
    if (status === 'migrated') {
      const normalizedJson = JSON.stringify(result);
      if (normalizedJson !== raw) {
        try {
          await AsyncStorage.setItem(storageKey, normalizedJson);
        } catch (writeError) {
          // Log but don't throw - cache read succeeded even if write-back failed
          console.warn(`Failed to write back normalized cache for ${entityType}:`, writeError);
        }
      }
    }
    
    return createCacheReadResult<T>(
      state,
      age,
      lastSyncedAt,
      filteredItems,
      true,
      status
    );
  } catch (migrationError) {
    // Migration failed - return corrupt status but don't write back
    console.error(`Failed to migrate cache array for ${entityType}:`, migrationError);
    return handleCorruptCache<T>(state, age, lastSyncedAt);
  }
}

/**
 * Reads cached array from storage with safe error handling and migration support
 * 
 * Uses existing cacheMetadata and cacheConfig utilities to determine cache state.
 * Handles corruption, missing data, parse errors, legacy format, and future versions gracefully.
 * 
 * Migration behavior:
 * - Legacy format (no wrapper): Migrated to versioned format and written back
 * - Current version: Returned as-is
 * - Future version: Returned as-is (never migrated, never written back, never cleared)
 * - Corrupt data: Returns empty array with corrupt status (never written back, never cleared)
 * 
 * @template T - Entity type
 * @param entityType - The entity type to read
 * @param validator - Optional type guard function to filter invalid items
 * @returns Cache read result with data, state, age, validation status, and read status
 */
export async function readCacheArray<T>(
  entityType: SyncEntityType,
  validator?: (x: unknown) => x is T
): Promise<CacheReadResult<T>> {
  const storageEntity = entityTypeToStorageKey[entityType];
  const storageKey = getSignedInCacheKey(storageEntity);
  
  // Read raw data from storage
  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(storageKey);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed to read cached ${entityType}:`, errorMessage);
    // Continue with null raw value - will result in missing state
  }
  
  // Read metadata
  const metadata = await getCacheMetadata(entityType);
  const lastSyncedAt = metadata?.lastSyncedAt ?? null;
  
  // Compute cache state using existing utility
  const state = getCacheStateFromConfig(entityType, lastSyncedAt);
  
  // Calculate age using shared helper
  const age = calculateCacheAge(lastSyncedAt);
  
  // Handle missing cache (no raw data)
  if (!raw) {
    return handleMissingCache<T>(entityType);
  }
  
  // Parse JSON safely
  const parsed = safeParseJSON(raw, storageKey);
  if (!parsed) {
    // Corrupt JSON - never write back, never clear
    return handleCorruptCache<T>(state, age, lastSyncedAt);
  }
  
  // Detect format
  const format = detectCacheArrayFormat(parsed, entityType);
  
  // Handle corruption/wrong type
  if (format === 'corrupt' || format === 'wrong_type') {
    return handleCorruptCache<T>(state, age, lastSyncedAt);
  }
  
  // Handle future version
  if (format === 'future_wrapper') {
    const wrapper = parsed as VersionedCacheArray<T>;
    return handleFutureVersionCache<T>(wrapper, entityType, storageKey, state, age, lastSyncedAt, validator);
  }
  
  // Handle legacy or current version - migrate if needed
  return handleLegacyOrCurrentVersionCache<T>(
    parsed,
    raw,
    entityType,
    storageKey,
    state,
    age,
    lastSyncedAt,
    validator
  );
}

/**
 * Writes array to cache with safe error handling
 * 
 * Always wraps entities in versioned format before writing.
 * Updates cache metadata automatically to mark cache as fresh.
 * 
 * @template T - Entity type
 * @param entityType - The entity type to write
 * @param items - Array of items to cache
 * @param validator - Optional type guard function to filter invalid items before writing
 * @throws Error if storage write fails
 */
export async function writeCacheArray<T extends { id: string }>(
  entityType: SyncEntityType,
  items: T[],
  validator?: (x: unknown) => x is T
): Promise<void> {
  const storageEntity = entityTypeToStorageKey[entityType];
  const storageKey = getSignedInCacheKey(storageEntity);
  
  // Filter items using validator if provided
  let itemsToWrite: T[] = items;
  if (validator) {
    itemsToWrite = items.filter(validator);
  }
  
  // Serialize timestamps and convert to versioned wrapper format
  // Note: toPersistedTimestamps expects EntityTimestamps, but handles optional fields gracefully
  // All entities in this codebase extend EntityTimestamps, so this cast is safe
  const serialized = itemsToWrite.map((item) => 
    toPersistedTimestamps(item as unknown as { id: string; createdAt?: Date | string; updatedAt?: Date | string; deletedAt?: Date | string })
  );
  
  // Wrap in versioned format
  const versionedWrapper: VersionedCacheArray<T> = {
    version: getCurrentCacheEntityStorageVersion(entityType),
    entities: serialized as T[],
  };
  
  const jsonString = JSON.stringify(versionedWrapper);
  
  try {
    await AsyncStorage.setItem(storageKey, jsonString);
    
    // Update metadata to mark cache as fresh
    // Note: If metadata update fails, cache data exists but metadata is stale.
    // This is acceptable as metadata will be updated on next successful write.
    await updateCacheMetadata(entityType, new Date().toISOString());
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to write cached ${entityType}: ${errorMessage}`, { cause: error });
  }
}

/**
 * Gets cache state information
 * 
 * Uses existing cacheMetadata and cacheConfig utilities to compute state.
 * Does NOT re-implement stale/expired math.
 * 
 * @param entityType - The entity type to get state for
 * @returns Cache state result with state, age, and lastSyncedAt
 */
export async function getCacheState(entityType: SyncEntityType): Promise<CacheStateResult> {
  const metadata = await getCacheMetadata(entityType);
  const lastSyncedAt = metadata?.lastSyncedAt ?? null;
  
  // Use existing utility to compute state
  const state = getCacheStateFromConfig(entityType, lastSyncedAt);
  
  // Calculate age using shared helper
  const age = calculateCacheAge(lastSyncedAt);
  
  return {
    state,
    age,
    lastSyncedAt,
  };
}

/**
 * Determines if cache should be refreshed based on state and network
 * 
 * Uses existing getCacheState utility to determine cache state.
 * Returns true if:
 * - Cache is stale/expired and device is online, OR
 * - Cache is expired and device is offline
 * 
 * @param entityType - The entity type to check
 * @param isOnline - Whether the device is online
 * @returns True if cache should be refreshed
 */
export async function shouldRefreshCache(
  entityType: SyncEntityType,
  isOnline: boolean
): Promise<boolean> {
  const stateResult = await getCacheState(entityType);
  const { state } = stateResult;
  
  // Missing cache doesn't need refresh (needs initial fetch, not refresh)
  if (state === 'missing') {
    return false;
  }
  
  // Fresh cache never needs refresh
  if (state === 'fresh') {
    return false;
  }
  
  // Stale cache: refresh only if online
  if (state === 'stale') {
    return isOnline;
  }
  
  // Expired cache: always refresh regardless of network status
  // This ensures users get fresh data when cache is too old, even if offline
  // (offline refresh will fail gracefully, but we signal the need for refresh)
  if (state === 'expired') {
    return true;
  }
  
  // Fallback (shouldn't happen)
  return false;
}
