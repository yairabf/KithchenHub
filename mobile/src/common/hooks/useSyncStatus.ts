/**
 * Sync Status Hooks
 * 
 * React hooks to check sync queue state and entity sync status.
 * Provides reactive updates when sync queue changes.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { syncQueueStorage, type QueuedWriteStatus } from '../utils/syncQueueStorage';
import { getSyncQueueProcessor } from '../utils/syncQueueProcessor';
import { isEntityInQueue, getEntityQueueStatus, isEntityPending } from '../utils/syncStatusUtils';
import { cacheEvents } from '../utils/cacheEvents';
import type { SyncEntityType } from '../utils/cacheMetadata';

/**
 * Polling interval for queue status updates (in milliseconds)
 * Updates every 2 seconds when online
 */
const QUEUE_STATUS_POLL_INTERVAL_MS = 2000;

/**
 * Hook to get sync queue statistics
 * 
 * Returns counts of pending, retrying, and failed items, plus processing state.
 * Automatically polls queue status when online.
 * 
 * @returns Object with queue statistics and processing state
 */
export function useSyncQueueStatus(): {
  pendingCount: number;
  retryingCount: number;
  failedCount: number;
  isProcessing: boolean;
  totalPending: number;
} {
  const [queue, setQueue] = useState<Awaited<ReturnType<typeof syncQueueStorage.getAll>>>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get processor instance
  const processor = useMemo(() => getSyncQueueProcessor(), []);

  // Update queue state
  const updateQueue = useCallback(async () => {
    try {
      const currentQueue = await syncQueueStorage.getAll();
      setQueue(currentQueue);
      setIsProcessing(processor.isProcessing());
    } catch (error) {
      console.error('Failed to update queue status:', error);
    }
  }, [processor]);

  // Poll queue status when online
  useEffect(() => {
    updateQueue();

    // Set up polling interval
    const intervalId = setInterval(updateQueue, QUEUE_STATUS_POLL_INTERVAL_MS);

    // Listen to cache events to update immediately when sync completes
    const unsubscribeHandlers: Array<() => void> = [];
    const entityTypes: SyncEntityType[] = ['recipes', 'shoppingLists', 'shoppingItems', 'chores'];
    
    entityTypes.forEach(entityType => {
      const unsubscribe = cacheEvents.onCacheChange(entityType, updateQueue);
      unsubscribeHandlers.push(unsubscribe);
    });

    return () => {
      clearInterval(intervalId);
      unsubscribeHandlers.forEach(unsubscribe => unsubscribe());
    };
  }, [updateQueue]);

  // Calculate statistics
  const stats = useMemo(() => {
    const pendingCount = queue.filter(item => item.status === 'PENDING').length;
    const retryingCount = queue.filter(item => item.status === 'RETRYING').length;
    const failedCount = queue.filter(item => item.status === 'FAILED_PERMANENT').length;
    const totalPending = pendingCount + retryingCount;

    return {
      pendingCount,
      retryingCount,
      failedCount,
      isProcessing,
      totalPending,
    };
  }, [queue, isProcessing]);

  return stats;
}

/**
 * Hook to check if a specific entity is pending sync
 * 
 * Checks if entity is in queue or has localId but no serverId.
 * Automatically updates when cache events fire or queue changes.
 * 
 * @param entityType - Type of entity to check
 * @param entityId - Entity ID (may be localId or serverId)
 * @param localId - Local ID of the entity (optional, will be inferred from entityId if not provided)
 * @returns Object with sync status flags
 */
export function useEntitySyncStatus(
  entityType: SyncEntityType,
  entityId: string,
  localId?: string
): {
  isPending: boolean;
  isConfirmed: boolean;
  isFailed: boolean;
  queueStatus?: QueuedWriteStatus;
} {
  const [queueStatus, setQueueStatus] = useState<QueuedWriteStatus | null>(null);
  const [isInQueue, setIsInQueue] = useState(false);

  // Use provided localId or assume entityId is localId
  const effectiveLocalId = localId ?? entityId;

  // Check queue status
  const updateQueueStatus = useCallback(async () => {
    try {
      const inQueue = await isEntityInQueue(entityType, effectiveLocalId);
      setIsInQueue(inQueue);
      
      if (inQueue) {
        const status = await getEntityQueueStatus(entityType, effectiveLocalId);
        setQueueStatus(status);
      } else {
        setQueueStatus(null);
      }
    } catch (error) {
      console.error('Failed to update entity queue status:', error);
    }
  }, [entityType, effectiveLocalId]);

  // Update on mount and when dependencies change
  useEffect(() => {
    updateQueueStatus();

    // Listen to cache events for this entity type
    const unsubscribe = cacheEvents.onCacheChange(entityType, updateQueueStatus);

    return unsubscribe;
  }, [entityType, effectiveLocalId, updateQueueStatus]);

  // Determine sync state
  const syncState = useMemo(() => {
    // Check if entity is in queue
    if (isInQueue) {
      if (queueStatus === 'FAILED_PERMANENT') {
        return {
          isPending: false,
          isConfirmed: false,
          isFailed: true,
          queueStatus: queueStatus ?? undefined,
        };
      }
      // PENDING or RETRYING
      return {
        isPending: true,
        isConfirmed: false,
        isFailed: false,
        queueStatus: queueStatus ?? undefined,
      };
    }

    // Not in queue - check if entity is pending (has localId but no serverId)
    // This requires the entity object, which we don't have here
    // So we assume if it's not in queue and has a localId, it might be confirmed
    // The actual pending check should be done with isEntityPending() using the entity object
    return {
      isPending: false,
      isConfirmed: true,
      isFailed: false,
      queueStatus: undefined,
    };
  }, [isInQueue, queueStatus]);

  return syncState;
}

/**
 * Enhanced hook that takes the entity object to check pending state
 * 
 * This version can check if entity is pending based on localId/id comparison.
 * 
 * @param entityType - Type of entity to check
 * @param entity - Entity object with id and localId fields
 * @returns Object with sync status flags
 */
export function useEntitySyncStatusWithEntity<T extends { id?: string; localId?: string }>(
  entityType: SyncEntityType,
  entity: T
): {
  isPending: boolean;
  isConfirmed: boolean;
  isFailed: boolean;
  queueStatus?: QueuedWriteStatus;
} {
  const baseStatus = useEntitySyncStatus(
    entityType,
    entity.id ?? entity.localId ?? '',
    entity.localId
  );

  // Check if entity is pending based on localId/id comparison
  const entityPending = isEntityPending(entity);

  // Combine queue status with entity pending state
  const combinedStatus = useMemo(() => {
    // If in queue, use queue status
    if (baseStatus.queueStatus) {
      return baseStatus;
    }

    // If not in queue but entity is pending (localId === id), mark as pending
    if (entityPending) {
      return {
        isPending: true,
        isConfirmed: false,
        isFailed: false,
        queueStatus: undefined,
      };
    }

    // Otherwise, confirmed
    return {
      isPending: false,
      isConfirmed: true,
      isFailed: false,
      queueStatus: undefined,
    };
  }, [baseStatus, entityPending]);

  return combinedStatus;
}
