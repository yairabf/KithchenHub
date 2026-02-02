/**
 * useCachedEntities Hook
 * 
 * React hook that subscribes to cache changes and re-reads cache when it updates.
 * Provides reactive cache data that automatically updates when cache changes.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
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
  const { isLoading: isAuthLoading } = useAuth();
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasInitialLoadRef = useRef(false);
  
  const loadFromCache = useCallback(async (skipLoadingState = false) => {
    try {
      setError(null);
      const result = await readCacheArray<T>(entityType);
      const hasData = result.data.length > 0;
      const isInitialLoad = !hasInitialLoadRef.current;
      
      // Update data immediately
      setData(result.data);
      
      // Loading state logic:
      // - If we have data: always clear loading (prevents flicker on cache updates)
      // - If no data and initial load: show loading only if not skipping
      // - If no data and cache update: don't change loading state
      if (hasData) {
        // Always clear loading if we have data (prevents flicker when cache updates)
        setIsLoading(false);
      } else if (isInitialLoad && !skipLoadingState) {
        // Initial load with no data: show loading
        setIsLoading(true);
      }
      // For cache updates with no data (skipLoadingState = true), don't change loading state
      
      if (isInitialLoad) {
        hasInitialLoadRef.current = true;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load cache';
      const cacheError = err instanceof Error ? err : new Error(errorMessage);
      setError(cacheError);
      console.error(`Failed to load cached ${entityType}:`, cacheError);
      setIsLoading(false);
    }
  }, [entityType]);
  
  useEffect(() => {
    // Wait for auth to finish loading before trying to load cache
    // This ensures token is set before any API calls are made
    if (isAuthLoading) {
      return;
    }
    
    // Reset initial load flag when entity type changes
    hasInitialLoadRef.current = false;
    
    // Initial load - show loading state only on first load
    loadFromCache(false);
    
    // Subscribe to cache changes - skip loading state for updates (prevents flicker)
    const unsubscribe = cacheEvents.onCacheChange(entityType, () => loadFromCache(true));
    
    return unsubscribe;
  }, [entityType, loadFromCache, isAuthLoading]);
  
  return {
    data,
    isLoading,
    error,
    refresh: loadFromCache,
  };
}
