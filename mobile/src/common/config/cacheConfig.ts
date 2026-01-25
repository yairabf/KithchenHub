/**
 * Cache TTL Configuration
 * 
 * Defines time-to-live (TTL) and stale thresholds for each entity type.
 * These are initial defaults and should be tuned based on:
 * - User behavior patterns
 * - Network usage analytics
 * - Cache hit/miss rates
 * - Refresh frequency
 */

import type { SyncEntityType } from '../utils/cacheMetadata';

/**
 * Cache TTL configuration for an entity type
 */
export interface CacheTTLConfig {
  /** Time in milliseconds when cache is considered stale (background refresh starts) */
  staleThreshold: number;
  /** Time in milliseconds when cache is considered expired (blocking refresh required) */
  ttl: number;
}

/**
 * Cache state based on age relative to thresholds
 */
export type CacheState = 'fresh' | 'stale' | 'expired' | 'missing';

/**
 * TTL configuration per entity type (initial defaults)
 * 
 * These values are starting points and should be monitored and tuned:
 * - Recipes: 5min stale, 10min expired (changes infrequently)
 * - Shopping Lists: 2min stale, 5min expired (changes more frequently)
 * - Shopping Items: 1min stale, 3min expired (checked/unchecked frequently - may be too aggressive)
 * - Chores: 2min stale, 5min expired (completed/updated regularly)
 */
export const CACHE_TTL_CONFIG: Record<SyncEntityType, CacheTTLConfig> = {
  recipes: {
    staleThreshold: 5 * 60 * 1000,  // 5 minutes
    ttl: 10 * 60 * 1000,             // 10 minutes
  },
  shoppingLists: {
    staleThreshold: 2 * 60 * 1000,  // 2 minutes
    ttl: 5 * 60 * 1000,              // 5 minutes
  },
  shoppingItems: {
    staleThreshold: 1 * 60 * 1000,  // 1 minute
    ttl: 3 * 60 * 1000,              // 3 minutes
  },
  chores: {
    staleThreshold: 2 * 60 * 1000,  // 2 minutes
    ttl: 5 * 60 * 1000,              // 5 minutes
  },
};

/**
 * Gets the TTL configuration for a given entity type
 * 
 * @param entityType - The entity type to get configuration for
 * @returns The TTL configuration
 */
export function getCacheTTLConfig(entityType: SyncEntityType): CacheTTLConfig {
  return CACHE_TTL_CONFIG[entityType];
}

/**
 * Determines the cache state based on lastSyncedAt timestamp
 * 
 * @param entityType - The entity type
 * @param lastSyncedAt - ISO 8601 timestamp of when data was last synced, or null if missing
 * @returns The cache state: 'fresh', 'stale', 'expired', or 'missing'
 */
export function getCacheState(
  entityType: SyncEntityType,
  lastSyncedAt: string | null
): CacheState {
  if (!lastSyncedAt) {
    return 'missing';
  }
  
  // Validate ISO string - invalid dates result in NaN
  const syncTime = new Date(lastSyncedAt).getTime();
  if (isNaN(syncTime)) {
    console.error(`Invalid lastSyncedAt timestamp for ${entityType}: ${lastSyncedAt}`);
    return 'missing'; // Treat invalid dates as missing cache
  }
  
  const age = Date.now() - syncTime;
  const config = getCacheTTLConfig(entityType);
  
  if (age <= config.staleThreshold) {
    return 'fresh';
  }
  
  if (age <= config.ttl) {
    return 'stale';
  }
  
  return 'expired';
}

/**
 * Checks if cache is stale (exceeds stale threshold but not TTL)
 * 
 * @param entityType - The entity type
 * @param lastSyncedAt - ISO 8601 timestamp of when data was last synced, or null if missing
 * @returns True if cache is stale
 */
export function isCacheStale(
  entityType: SyncEntityType,
  lastSyncedAt: string | null
): boolean {
  return getCacheState(entityType, lastSyncedAt) === 'stale';
}

/**
 * Checks if cache is expired (exceeds TTL)
 * 
 * @param entityType - The entity type
 * @param lastSyncedAt - ISO 8601 timestamp of when data was last synced, or null if missing
 * @returns True if cache is expired
 */
export function isCacheExpired(
  entityType: SyncEntityType,
  lastSyncedAt: string | null
): boolean {
  return getCacheState(entityType, lastSyncedAt) === 'expired';
}

/**
 * Checks if cache is fresh (within stale threshold)
 * 
 * @param entityType - The entity type
 * @param lastSyncedAt - ISO 8601 timestamp of when data was last synced, or null if missing
 * @returns True if cache is fresh
 */
export function isCacheFresh(
  entityType: SyncEntityType,
  lastSyncedAt: string | null
): boolean {
  return getCacheState(entityType, lastSyncedAt) === 'fresh';
}
