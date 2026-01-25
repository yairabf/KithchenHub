/**
 * Sync Status Utilities
 * 
 * Utility functions to check entity sync status synchronously.
 * These functions check if entities are in the sync queue and determine their sync state.
 */

import { syncQueueStorage, type QueuedWriteStatus } from './syncQueueStorage';
import type { SyncEntityType } from './cacheMetadata';

/**
 * Check if entity is in sync queue
 * 
 * @param entityType - Type of entity to check
 * @param localId - Local ID of the entity (UUID)
 * @returns True if entity is in queue, false otherwise
 */
export async function isEntityInQueue(
  entityType: SyncEntityType,
  localId: string
): Promise<boolean> {
  try {
    const queue = await syncQueueStorage.getAll();
    return queue.some(
      item =>
        item.entityType === entityType &&
        item.target.localId === localId
    );
  } catch (error) {
    console.error('Failed to check if entity is in queue:', error);
    return false;
  }
}

/**
 * Get queue status for entity
 * 
 * @param entityType - Type of entity to check
 * @param localId - Local ID of the entity (UUID)
 * @returns Queue status if entity is in queue, null otherwise
 */
export async function getEntityQueueStatus(
  entityType: SyncEntityType,
  localId: string
): Promise<QueuedWriteStatus | null> {
  try {
    const queue = await syncQueueStorage.getAll();
    const item = queue.find(
      item =>
        item.entityType === entityType &&
        item.target.localId === localId
    );
    return item?.status ?? null;
  } catch (error) {
    console.error('Failed to get entity queue status:', error);
    return null;
  }
}

/**
 * Check if entity is pending (has localId but no serverId)
 * 
 * An entity is considered pending if:
 * - It has a localId
 * - The id field equals the localId (meaning no serverId has been assigned yet)
 * 
 * @param entity - Entity to check (must have localId and id fields)
 * @returns True if entity is pending, false otherwise
 */
export function isEntityPending(entity: { localId?: string; id?: string }): boolean {
  // Entity is pending if it has localId but id === localId (no serverId assigned)
  if (!entity.localId) {
    return false;
  }
  
  // If id is different from localId, serverId has been assigned (confirmed)
  // If id equals localId, entity is still pending
  return entity.id === entity.localId;
}

/**
 * Determines the sync status indicator type from sync status flags.
 * 
 * Priority order: failed > pending > confirmed
 * 
 * @param syncStatus - Object with isPending, isConfirmed, and isFailed flags
 * @returns Indicator status type: 'pending', 'confirmed', or 'failed'
 */
export function determineIndicatorStatus(syncStatus: {
  isPending: boolean;
  isConfirmed: boolean;
  isFailed: boolean;
}): 'pending' | 'confirmed' | 'failed' {
  if (syncStatus.isFailed) {
    return 'failed';
  }
  if (syncStatus.isPending) {
    return 'pending';
  }
  return 'confirmed';
}
