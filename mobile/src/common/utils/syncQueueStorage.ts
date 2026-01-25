/**
 * Sync Queue Storage Utilities
 * 
 * Manages queued write operations for offline sync. Stores operations locally
 * and provides compaction to prevent queue bloat from repeated operations.
 * 
 * Storage key: @kitchen_hub_sync_queue (signed-in users only)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { getSignedInCacheKey } from '../storage/dataModeStorage';
import type { SyncEntityType } from './cacheMetadata';

/**
 * Sync operation types
 */
export type SyncOp = 'create' | 'update' | 'delete';

/**
 * Identifies an entity across offline period.
 * Always use localId for queue operations (serverId may not exist offline).
 */
export type QueueTargetId = {
  localId: string;   // Always present (UUID generated on create)
  serverId?: string; // Filled after sync (optional, may not exist yet)
};

/**
 * Queued write operation with deterministic ordering and stable identity.
 */
export type QueuedWrite = {
  id: string;                 // Queue item ID (UUID)
  entityType: SyncEntityType;
  op: SyncOp;
  target: QueueTargetId;       // Identifies the entity across offline period
  payload: unknown;            // Full entity data (can optimize to patch later)
  clientTimestamp: string;     // ISO timestamp for ordering + conflict resolution
  attemptCount: number;         // Retry counter (starts at 0)
};

/**
 * Storage key for sync queue (signed-in users only)
 */
const SYNC_QUEUE_STORAGE_KEY = getSignedInCacheKey('sync_queue');

/**
 * Maximum queue size to prevent unbounded growth
 */
const MAX_QUEUE_SIZE = 100;

/**
 * Reads all queued writes from storage
 * 
 * @returns Array of queued writes, sorted by clientTimestamp
 * @throws Error if storage read fails
 */
async function readQueue(): Promise<QueuedWrite[]> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_QUEUE_STORAGE_KEY);
    
    if (!raw) {
      return [];
    }
    
    const parsed = JSON.parse(raw) as QueuedWrite[];
    
    // Validate structure
    if (!Array.isArray(parsed)) {
      console.error('Invalid sync queue format: expected array');
      return [];
    }
    
    // Validate each item
    const valid: QueuedWrite[] = [];
    for (const item of parsed) {
      if (
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.entityType === 'string' &&
        typeof item.op === 'string' &&
        typeof item.target === 'object' &&
        item.target !== null &&
        typeof item.target.localId === 'string' &&
        typeof item.clientTimestamp === 'string' &&
        typeof item.attemptCount === 'number'
      ) {
        valid.push(item as QueuedWrite);
      } else {
        console.warn('Invalid queue item format, skipping:', item);
      }
    }
    
    // Sort by clientTimestamp for deterministic ordering
    return valid.sort((a, b) => a.clientTimestamp.localeCompare(b.clientTimestamp));
  } catch (error) {
    if (error instanceof SyntaxError) {
      // Data corruption - clear corrupted queue
      console.error('Corrupted sync queue, clearing:', error);
      try {
        await AsyncStorage.removeItem(SYNC_QUEUE_STORAGE_KEY);
      } catch (clearError) {
        console.error('Failed to clear corrupted queue:', clearError);
      }
      return [];
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read sync queue: ${errorMessage}`, { cause: error });
  }
}

/**
 * Writes queued writes to storage
 * 
 * @param queue - Array of queued writes to store
 * @throws Error if storage write fails
 */
async function writeQueue(queue: QueuedWrite[]): Promise<void> {
  try {
    // Validate queue size
    if (queue.length > MAX_QUEUE_SIZE) {
      console.warn(
        `Sync queue exceeds maximum size (${MAX_QUEUE_SIZE}). ` +
        `Keeping oldest ${MAX_QUEUE_SIZE} items.`
      );
      // Keep oldest items (sorted by clientTimestamp)
      const sorted = queue.sort((a, b) => a.clientTimestamp.localeCompare(b.clientTimestamp));
      queue = sorted.slice(0, MAX_QUEUE_SIZE);
    }
    
    await AsyncStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to write sync queue: ${errorMessage}`, { cause: error });
  }
}

/**
 * Compacts queue by merging operations for same entity to prevent thrash.
 * 
 * Compaction rules:
 * - create + update* → merge into one create with latest payload
 * - update + update → merge into one update (latest wins)
 * - create + delete → drop both (net no-op)
 * - delete + update → keep delete (delete wins)
 * - delete + delete → keep one delete
 * 
 * @param queue - Array of queued writes to compact
 * @returns Compacted array of queued writes
 */
function compactQueue(queue: QueuedWrite[]): QueuedWrite[] {
  const compacted = new Map<string, QueuedWrite>();
  
  // Process queue in chronological order
  const sorted = [...queue].sort((a, b) => 
    a.clientTimestamp.localeCompare(b.clientTimestamp)
  );
  
  for (const item of sorted) {
    const key = `${item.entityType}:${item.target.localId}`;
    const existing = compacted.get(key);
    
    if (!existing) {
      compacted.set(key, item);
      continue;
    }
    
    // Apply compaction rules
    if (existing.op === 'create' && item.op === 'update') {
      // create + update → create with latest payload
      compacted.set(key, {
        ...existing,
        payload: item.payload,
        clientTimestamp: item.clientTimestamp, // Use latest timestamp
      });
    } else if (existing.op === 'update' && item.op === 'update') {
      // update + update → update with latest payload
      compacted.set(key, {
        ...existing,
        payload: item.payload,
        clientTimestamp: item.clientTimestamp,
      });
    } else if (existing.op === 'create' && item.op === 'delete') {
      // create + delete → drop both (remove from map)
      compacted.delete(key);
    } else if (existing.op === 'delete' && item.op === 'update') {
      // delete + update → keep delete (ignore update)
      // No change needed
    } else if (existing.op === 'delete' && item.op === 'delete') {
      // delete + delete → keep one delete
      // No change needed
    } else {
      // Unknown combination, keep both (shouldn't happen)
      console.warn(`Unexpected queue compaction: ${existing.op} + ${item.op}`);
      compacted.set(key, item);
    }
  }
  
  return Array.from(compacted.values());
}

/**
 * Sync Queue Storage Interface
 */
export interface SyncQueueStorage {
  /**
   * Enqueue a write operation with automatic compaction.
   * Compacts queue before adding new item to prevent duplicates/thrash.
   */
  enqueue(
    entityType: SyncEntityType,
    op: SyncOp,
    target: QueueTargetId,
    payload: unknown
  ): Promise<QueuedWrite>;
  
  /**
   * Get all queued writes, sorted by clientTimestamp (deterministic ordering).
   */
  getAll(): Promise<QueuedWrite[]>;
  
  /**
   * Get queued writes for a specific entity type.
   */
  getByEntityType(entityType: SyncEntityType): Promise<QueuedWrite[]>;
  
  /**
   * Get queued writes for a specific entity (by localId).
   */
  getByTarget(entityType: SyncEntityType, localId: string): Promise<QueuedWrite[]>;
  
  /**
   * Remove a queued write by ID.
   */
  remove(id: string): Promise<void>;
  
  /**
   * Clear all queued writes.
   */
  clear(): Promise<void>;
  
  /**
   * Increment retry count for a queued write.
   */
  incrementRetry(id: string): Promise<void>;
  
  /**
   * Compact queue: merge operations for same entity to prevent thrash.
   * Called automatically on enqueue.
   */
  compact(): Promise<void>;
}

/**
 * Sync Queue Storage Implementation
 */
class SyncQueueStorageImpl implements SyncQueueStorage {
  /**
   * Lock mechanism to prevent concurrent modifications to the queue.
   * Chains operations to ensure atomicity.
   */
  private operationLock: Promise<void> = Promise.resolve();

  /**
   * Enqueue a write operation with automatic compaction.
   * 
   * Uses a lock mechanism to prevent race conditions when multiple
   * operations try to modify the queue concurrently.
   * 
   * @param entityType - Type of entity being queued
   * @param op - Operation type (create, update, delete)
   * @param target - Entity identifier (localId and optional serverId)
   * @param payload - Full entity data to sync
   * @returns The queued write operation (may be merged with existing if compaction occurs)
   */
  async enqueue(
    entityType: SyncEntityType,
    op: SyncOp,
    target: QueueTargetId,
    payload: unknown
  ): Promise<QueuedWrite> {
    // Create the queue item first (before lock) to have its ID
    const queuedWriteId = Crypto.randomUUID();
    const clientTimestamp = new Date().toISOString();
    
    // Chain operations to prevent concurrent modifications
    this.operationLock = this.operationLock.then(async () => {
      // Read current queue
      let queue = await readQueue();
      
      // Compact queue before adding new item
      queue = compactQueue(queue);
      
      // Create new queue item
      const queuedWrite: QueuedWrite = {
        id: queuedWriteId,
        entityType,
        op,
        target,
        payload,
        clientTimestamp,
        attemptCount: 0,
      };
      
      // Add to queue
      queue.push(queuedWrite);
      
      // Compact again (in case new item can be merged with existing)
      queue = compactQueue(queue);
      
      // Save queue
      await writeQueue(queue);
    });

    await this.operationLock;

    // Read queue again to get the created item (after compaction)
    // If compaction merged it, find by entity key instead of ID
    const queue = await readQueue();
    const createdItem = queue.find(
      item => 
        item.entityType === entityType &&
        item.target.localId === target.localId
    );

    if (!createdItem) {
      // Item was compacted away (e.g., create + delete)
      // Return a placeholder that represents the no-op
      return {
        id: queuedWriteId,
        entityType,
        op,
        target,
        payload,
        clientTimestamp,
        attemptCount: 0,
      };
    }

    return createdItem;
  }
  
  /**
   * Get all queued writes, sorted by clientTimestamp.
   */
  async getAll(): Promise<QueuedWrite[]> {
    return readQueue();
  }
  
  /**
   * Get queued writes for a specific entity type.
   */
  async getByEntityType(entityType: SyncEntityType): Promise<QueuedWrite[]> {
    const queue = await readQueue();
    return queue.filter(item => item.entityType === entityType);
  }
  
  /**
   * Get queued writes for a specific entity (by localId).
   */
  async getByTarget(entityType: SyncEntityType, localId: string): Promise<QueuedWrite[]> {
    const queue = await readQueue();
    return queue.filter(
      item => item.entityType === entityType && item.target.localId === localId
    );
  }
  
  /**
   * Remove a queued write by ID.
   * 
   * Uses lock mechanism to prevent race conditions.
   */
  async remove(id: string): Promise<void> {
    this.operationLock = this.operationLock.then(async () => {
      const queue = await readQueue();
      const filtered = queue.filter(item => item.id !== id);
      
      if (filtered.length === queue.length) {
        // Item not found, nothing to do
        return;
      }
      
      await writeQueue(filtered);
    });

    await this.operationLock;
  }
  
  /**
   * Clear all queued writes.
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SYNC_QUEUE_STORAGE_KEY);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to clear sync queue: ${errorMessage}`, { cause: error });
    }
  }
  
  /**
   * Increment retry count for a queued write.
   * 
   * Uses lock mechanism to prevent race conditions.
   */
  async incrementRetry(id: string): Promise<void> {
    this.operationLock = this.operationLock.then(async () => {
      const queue = await readQueue();
      const updated = queue.map(item => {
        if (item.id === id) {
          return { ...item, attemptCount: item.attemptCount + 1 };
        }
        return item;
      });
      
      await writeQueue(updated);
    });

    await this.operationLock;
  }
  
  /**
   * Compact queue: merge operations for same entity to prevent thrash.
   * 
   * Uses lock mechanism to prevent race conditions.
   */
  async compact(): Promise<void> {
    this.operationLock = this.operationLock.then(async () => {
      const queue = await readQueue();
      const compacted = compactQueue(queue);
      
      if (compacted.length !== queue.length) {
        // Queue was compacted, save it
        await writeQueue(compacted);
      }
    });

    await this.operationLock;
  }
}

/**
 * Singleton instance of sync queue storage
 */
export const syncQueueStorage: SyncQueueStorage = new SyncQueueStorageImpl();
