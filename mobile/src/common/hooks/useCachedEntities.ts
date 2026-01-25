/**
 * useCachedEntities Hook
 * 
 * React hook that subscribes to cache changes and re-reads cache when it updates.
 * Provides reactive cache data that automatically updates when cache changes.
 */

import { useState, useEffect, useCallback } from 'react';
import type { SyncEntityType } from '../utils/cacheMetadata';
import { EntityTimestamps } from '../types/entityMetadata';
import { readCacheArray } from '../utils/cacheStorage';
import { cacheEvents } from '../utils/cacheEvents';

/**
 * Hook return type
 */
export interface UseCachedEntitiesReturn<T extends EntityTimestamps> {
  /** Array of cached entities */
  data: T[];
  /** Whether cache is currently being loaded */
  isLoading: boolean;
  /** Error if cache read failed */
  error: Error | null;
  /** Manual refresh function to re-read cache */
  refresh: () => Promise<void>;
}

/**
 * React hook that subscribes to cache changes and re-reads cache when it updates
 * 
 * @template T - Entity type extending EntityTimestamps
 * @param entityType - The entity type to read from cache
 * @returns Object with data, loading state, error, and refresh function
 * 
 * @example
 * ```typescript
 * const { data: recipes, isLoading, error } = useCachedEntities<Recipe>('recipes');
 * // data automatically updates when cache changes (via cache events)
 * ```
 */
export function useCachedEntities<T extends EntityTimestamps>(
  entityType: SyncEntityType
): UseCachedEntitiesReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const loadFromCache = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await readCacheArray<T>(entityType);
      setData(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load cache';
      const cacheError = err instanceof Error ? err : new Error(errorMessage);
      setError(cacheError);
      console.error(`Failed to load cached ${entityType}:`, cacheError);
    } finally {
      setIsLoading(false);
    }
  }, [entityType]);
  
  useEffect(() => {
    // Initial load
    loadFromCache();
    
    // Subscribe to cache changes
    const unsubscribe = cacheEvents.onCacheChange(entityType, loadFromCache);
    
    return unsubscribe;
  }, [entityType, loadFromCache]);
  
  return {
    data,
    isLoading,
    error,
    refresh: loadFromCache,
  };
}
