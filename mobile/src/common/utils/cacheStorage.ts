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
 * Reads cached array from storage with safe error handling
 * 
 * Uses existing cacheMetadata and cacheConfig utilities to determine cache state.
 * Handles corruption, missing data, and parse errors gracefully.
 * 
 * @template T - Entity type
 * @param entityType - The entity type to read
 * @param validator - Optional type guard function to filter invalid items
 * @returns Cache read result with data, state, age, and validation status
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
    return {
      data: [],
      state: 'missing',
      age: null,
      lastSyncedAt: null,
      isValid: true, // Missing cache is valid (not corrupted)
    };
  }
  
  // Parse JSON safely
  const parsed = safeParseJSON(raw, storageKey);
  if (!parsed) {
    return {
      data: [],
      state, // Use computed state from metadata (distinguishes missing vs corrupted)
      age,
      lastSyncedAt,
      isValid: false, // Mark as invalid due to corruption
    };
  }
  
  // Validate array structure
  if (!isValidArray(parsed, storageKey)) {
    return {
      data: [],
      state, // Use computed state from metadata (distinguishes missing vs corrupted)
      age,
      lastSyncedAt,
      isValid: false, // Mark as invalid
    };
  }
  
  // Filter out items without required fields (basic validation)
  const validItems = parsed.filter((item): item is Record<string, unknown> => {
    if (item === null || typeof item !== 'object') {
      return false;
    }
    // Validate required fields for entities
    const recordItem = item as Record<string, unknown>;
    if (typeof recordItem.id !== 'string' || recordItem.id.trim() === '') {
      console.warn(`Skipping entity in ${storageKey}: missing or invalid id`);
      return false;
    }
    return true;
  });
  
  // Apply optional validator callback
  const filteredItems = filterValidItems<T>(validItems, validator);
  
  return {
    data: filteredItems,
    state,
    age,
    lastSyncedAt,
    isValid: true,
  };
}

/**
 * Writes array to cache with safe error handling
 * 
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
  
  // Serialize timestamps and convert to JSON
  // Note: toPersistedTimestamps expects EntityTimestamps, but handles optional fields gracefully
  // All entities in this codebase extend EntityTimestamps, so this cast is safe
  const serialized = itemsToWrite.map((item) => 
    toPersistedTimestamps(item as unknown as { id: string; createdAt?: Date | string; updatedAt?: Date | string; deletedAt?: Date | string })
  );
  const jsonString = JSON.stringify(serialized);
  
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
