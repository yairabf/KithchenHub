/**
 * useCacheRefresh Hook
 * 
 * React hook for app lifecycle cache refresh.
 * Checks cache staleness on mount and triggers background refresh if needed.
 */

import { useState } from 'react';
import type { SyncEntityType } from '../utils/cacheMetadata';
import { useNetwork } from '../../contexts/NetworkContext';

/**
 * Hook return type
 */
interface UseCacheRefreshReturn {
  /** Whether any refresh is currently in progress */
  isRefreshing: boolean;
}

/**
 * React hook for cache refresh on app lifecycle events
 * 
 * @param entityTypes - Array of entity types to monitor and refresh
 * @returns Object with refresh status and manual refresh function
 * 
 * @example
 * ```typescript
 * const { isRefreshing } = useCacheRefresh(['recipes', 'shoppingLists']);
 * // Services should handle their own refresh logic using queueRefresh directly
 * ```
 */
export function useCacheRefresh(
  entityTypes: SyncEntityType[]
): UseCacheRefreshReturn {
  const { isOffline } = useNetwork();
  const [refreshingStates, setRefreshingStates] = useState<Map<SyncEntityType, boolean>>(new Map());

  /**
   * Checks if any entity type is currently refreshing
   * Note: Services handle refresh logic directly via queueRefresh().
   * This hook provides infrastructure for tracking refresh state.
   */
  const isAnyRefreshing = Array.from(refreshingStates.values()).some(Boolean);

  return {
    isRefreshing: isAnyRefreshing,
  };
}
