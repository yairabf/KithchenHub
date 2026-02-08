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
 * Queued write status
 */
export type QueuedWriteStatus = 'PENDING' | 'RETRYING' | 'FAILED_PERMANENT';

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
  operationId: string;         // Idempotency key (UUID) - stable across retries and compaction
  entityType: SyncEntityType;
  op: SyncOp;
  target: QueueTargetId;       // Identifies the entity across offline period
  payload: unknown;            // Full entity data (can optimize to patch later)
  clientTimestamp: string;     // ISO timestamp for ordering + conflict resolution
  attemptCount: number;         // Retry counter (starts at 0)
  lastAttemptAt?: string;       // ISO timestamp of last attempt (for backoff)
  status: QueuedWriteStatus;    // Item status
  lastError?: string;           // Last error message (for debugging)
  requestId?: string;           // Optional request ID for observability (same for all items in a batch)
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
 * Formats a hash string as a UUID-like format (8-4-4-4-12).
 * 
 * @param hash - Hash string (at least 32 characters)
 * @returns UUID-formatted string
 */
function formatHashAsUuid(hash: string): string {
  if (hash.length < 32) {
    throw new Error(`Hash must be at least 32 characters, got ${hash.length}`);
  }
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    hash.substring(12, 16),
    hash.substring(16, 20),
    hash.substring(20, 32),
  ].join('-');
}

/**
 * Generates a fallback operationId using a simple hash of the content.
 * Used when crypto operations fail.
 * 
 * @param content - Content to hash
 * @returns UUID-like string
 */
function generateFallbackOperationId(content: string): string {
  // Simple hash function for fallback
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to positive hex string and pad to 32 characters
  const hexString = Math.abs(hash).toString(16).padStart(32, '0');
  return formatHashAsUuid(hexString);
}

/**
 * Generates a deterministic operationId for old queue items that don't have one.
 * Uses a hash of entity type, localId, operation, and timestamp to ensure
 * the same entity always gets the same operationId, preserving idempotency.
 * 
 * @param entityType - Type of entity
 * @param localId - Entity local ID
 * @param op - Operation type
 * @param clientTimestamp - Client timestamp
 * @returns Deterministic UUID-like string
 */
async function generateDeterministicOperationId(
  entityType: string,
  localId: string,
  op: string,
  clientTimestamp: string
): Promise<string> {
  // Create a deterministic string from entity properties
  const content = `${entityType}:${localId}:${op}:${clientTimestamp}`;
  
  try {
    // Generate SHA-256 hash using crypto API
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      content
    );
    
    // Convert hash to UUID-like format (8-4-4-4-12)
    return formatHashAsUuid(hash);
  } catch (error) {
    // Fallback: use deterministic hash if crypto fails
    // This ensures migration doesn't break even if crypto operations fail
    console.error('Failed to generate deterministic operationId using crypto, using fallback:', error);
    return generateFallbackOperationId(content);
  }
}

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
    const migrationPromises: Promise<QueuedWrite>[] = [];
    
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
        // Migrate old items: add default status if missing, validate status value
        const validStatuses: QueuedWriteStatus[] = ['PENDING', 'RETRYING', 'FAILED_PERMANENT'];
        const status = validStatuses.includes(item.status as QueuedWriteStatus)
          ? (item.status as QueuedWriteStatus)
          : 'PENDING';
        
        // Migrate old items: generate deterministic operationId if missing (backward compatibility)
        // Use hash of entity type, localId, operation, and timestamp to ensure same entity = same operationId
        // This preserves idempotency even for items that were queued before operationId was added
        if (typeof item.operationId === 'string') {
          // Already has operationId, no migration needed
          const migratedItem: QueuedWrite = {
            ...item,
            status,
            lastAttemptAt: item.lastAttemptAt,
            lastError: item.lastError,
            requestId: typeof item.requestId === 'string' ? item.requestId : undefined,
          };
          valid.push(migratedItem);
        } else {
          // Need to generate deterministic operationId (async operation)
          migrationPromises.push(
            generateDeterministicOperationId(
              item.entityType,
              item.target.localId,
              item.op,
              item.clientTimestamp
            ).then(operationId => ({
              ...item,
              operationId,
              status,
              lastAttemptAt: item.lastAttemptAt,
              lastError: item.lastError,
              requestId: typeof item.requestId === 'string' ? item.requestId : undefined,
            }))
          );
        }
      } else {
        console.warn('Invalid queue item format, skipping:', item);
      }
    }
    
    // Wait for all migration operations to complete
    if (migrationPromises.length > 0) {
      const migratedItems = await Promise.all(migrationPromises);
      valid.push(...migratedItems);
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
    // IMPORTANT: Preserve operationId from the surviving item (the one with latest clientTimestamp)
    if (existing.op === 'create' && item.op === 'update') {
      // create + update → create with latest payload
      // Preserve existing operationId (the original create operation)
      compacted.set(key, {
        ...existing,
        payload: item.payload,
        clientTimestamp: item.clientTimestamp, // Use latest timestamp
        // operationId preserved from existing (original create)
      });
    } else if (existing.op === 'update' && item.op === 'update') {
      // update + update → update with latest payload
      // Preserve existing operationId (the original update operation)
      compacted.set(key, {
        ...existing,
        payload: item.payload,
        clientTimestamp: item.clientTimestamp,
        // operationId preserved from existing (original update)
      });
    } else if (existing.op === 'create' && item.op === 'delete') {
      // create + delete → drop both (remove from map)
      compacted.delete(key);
    } else if (existing.op === 'delete' && item.op === 'update') {
      // delete + update → keep delete (ignore update)
      // Preserve existing operationId (the delete operation)
      // No change needed
    } else if (existing.op === 'delete' && item.op === 'delete') {
      // delete + delete → keep one delete
      // Preserve existing operationId (the original delete)
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
   * Update last attempt timestamp for a queued write.
   */
  updateLastAttempt(id: string): Promise<void>;
  
  /**
   * Update status for a queued write.
   */
  updateStatus(id: string, status: QueuedWriteStatus): Promise<void>;
  
  /**
   * Mark a queued write as permanently failed.
   */
  markAsFailedPermanent(id: string, error: string): Promise<void>;
  
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
    // Create the queue item first (before lock) to have its ID and operationId
    const queuedWriteId = Crypto.randomUUID();
    const operationId = Crypto.randomUUID(); // Generate stable UUID for idempotency
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
        operationId, // Stable UUID for idempotency - persists through compaction
        entityType,
        op,
        target,
        payload,
        clientTimestamp,
        attemptCount: 0,
        status: 'PENDING',
      };
      
      if (__DEV__) {
        console.log(
          `[SyncQueue] enqueue entityType=${entityType} op=${op} localId=${target.localId}`
        );
      }

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
        operationId, // Include operationId even for no-op placeholder
        entityType,
        op,
        target,
        payload,
        clientTimestamp,
        attemptCount: 0,
        status: 'PENDING',
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
   * Updates a queued write item using a custom updater function.
   * Centralizes the lock mechanism to prevent code duplication.
   * 
   * @param id - ID of the item to update
   * @param updater - Function that transforms the item
   * @private
   */
  private async updateQueueItem(
    id: string,
    updater: (item: QueuedWrite) => QueuedWrite
  ): Promise<void> {
    this.operationLock = this.operationLock.then(async () => {
      const queue = await readQueue();
      const updated = queue.map(item => item.id === id ? updater(item) : item);
      await writeQueue(updated);
    });

    await this.operationLock;
  }

  /**
   * Increment retry count for a queued write.
   * Also updates lastAttemptAt timestamp and status.
   * 
   * Uses lock mechanism to prevent race conditions.
   */
  async incrementRetry(id: string): Promise<void> {
    return this.updateQueueItem(id, item => ({
      ...item,
      attemptCount: item.attemptCount + 1,
      lastAttemptAt: new Date().toISOString(),
      status: 'RETRYING' as QueuedWriteStatus,
    }));
  }
  
  /**
   * Update last attempt timestamp for a queued write.
   * 
   * Uses lock mechanism to prevent race conditions.
   */
  async updateLastAttempt(id: string): Promise<void> {
    return this.updateQueueItem(id, item => ({
      ...item,
      lastAttemptAt: new Date().toISOString(),
    }));
  }
  
  /**
   * Update status for a queued write.
   * 
   * Uses lock mechanism to prevent race conditions.
   */
  async updateStatus(id: string, status: QueuedWriteStatus): Promise<void> {
    return this.updateQueueItem(id, item => ({
      ...item,
      status,
    }));
  }
  
  /**
   * Mark a queued write as permanently failed.
   * 
   * Uses lock mechanism to prevent race conditions.
   */
  async markAsFailedPermanent(id: string, error: string): Promise<void> {
    return this.updateQueueItem(id, item => ({
      ...item,
      status: 'FAILED_PERMANENT' as QueuedWriteStatus,
      lastError: error,
      lastAttemptAt: new Date().toISOString(),
    }));
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
