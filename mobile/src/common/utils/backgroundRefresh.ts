/**
 * Background Refresh Orchestration
 * 
 * Manages background refresh operations to prevent duplicate refreshes,
 * handle errors gracefully, and update cache metadata on success.
 */

import type { SyncEntityType } from './cacheMetadata';
import { EntityTimestamps } from '../types/entityMetadata';
import { applyRemoteUpdatesToLocal } from './syncApplication';

/**
 * Map of entity types to their current refresh promises
 * Prevents duplicate concurrent refreshes for the same entity type
 */
const refreshPromises = new Map<SyncEntityType, Promise<void>>();

/**
 * Map of entity types to their refresh status
 */
const refreshStatus = new Map<SyncEntityType, boolean>();

/**
 * Checks if a refresh is currently in progress for an entity type
 * 
 * @param entityType - The entity type to check
 * @returns True if a refresh is in progress
 */
export function isRefreshing(entityType: SyncEntityType): boolean {
  return refreshStatus.get(entityType) ?? false;
}

/**
 * Cancels a refresh operation for an entity type
 * Note: This only cancels tracking, not the actual promise
 * 
 * @param entityType - The entity type to cancel refresh for
 */
export function cancelRefresh(entityType: SyncEntityType): void {
  refreshPromises.delete(entityType);
  refreshStatus.delete(entityType);
}

/**
 * Queues a background refresh operation for an entity type
 * Prevents duplicate refreshes by tracking in-flight promises
 * 
 * @param entityType - The entity type to refresh
 * @param fetchFn - Function that fetches fresh data from the API
 * @param getId - Function to extract entity ID for merging
 * @returns Promise that resolves when refresh completes
 */
export async function queueRefresh<T extends EntityTimestamps>(
  entityType: SyncEntityType,
  fetchFn: () => Promise<T[]>,
  getId: (entity: T) => string
): Promise<void> {
  // If already refreshing, return the existing promise
  const existingPromise = refreshPromises.get(entityType);
  if (existingPromise) {
    return existingPromise;
  }

  // Create new refresh promise and store it immediately to prevent race conditions
  // Store BEFORE starting async work so concurrent calls see the promise
  const refreshPromise = (async () => {
    try {
      refreshStatus.set(entityType, true);
      
      // Fetch fresh data
      const freshData = await fetchFn();
      
      // Update cache with fresh data using applyRemoteUpdatesToLocal
      // This handles merging with local cache and updates metadata
      await applyRemoteUpdatesToLocal(entityType, freshData, getId);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Background refresh failed for ${entityType}:`, errorMessage);
      // Don't throw - background refresh failures should be silent
      // The cache will remain with its current state
    } finally {
      refreshPromises.delete(entityType);
      refreshStatus.delete(entityType);
    }
  })();

  // Store promise immediately to prevent race conditions
  refreshPromises.set(entityType, refreshPromise);
  return refreshPromise;
}

/**
 * Clears all refresh tracking (useful for testing or cleanup)
 */
export function clearRefreshTracking(): void {
  refreshPromises.clear();
  refreshStatus.clear();
}
