import type { SyncEntityType } from '../../cacheMetadata';

/**
 * Sync operation types.
 */
export type SyncOp = 'create' | 'update' | 'delete';

/**
 * Queued write status.
 */
export type QueuedWriteStatus = 'PENDING' | 'RETRYING' | 'FAILED_PERMANENT';

/**
 * Identifies an entity across an offline period.
 * Always use localId for queue operations (serverId may not exist offline).
 */
export type QueueTargetId = {
  localId: string;
  serverId?: string;
};

/**
 * Queued write operation with deterministic ordering and stable identity.
 */
export type QueuedWrite = {
  id: string;
  operationId: string;
  entityType: SyncEntityType;
  op: SyncOp;
  target: QueueTargetId;
  payload: unknown;
  clientTimestamp: string;
  attemptCount: number;
  lastAttemptAt?: string;
  status: QueuedWriteStatus;
  lastError?: string;
  requestId?: string;
  /**
   * Storage schema version for this queued write.
   * - Omitted/null in legacy records (treated as version 1 on read).
   * - Must be a positive integer when written by current code.
   */
  version?: number;
};

/**
 * Sync checkpoint for an in-flight batch.
 *
 * A checkpoint is a crash-safe marker that records
 * "this exact set of operationIds was (or should be) in-flight as a batch".
 */
export type SyncCheckpoint = {
  checkpointId: string;
  userId: string;
  householdId?: string;
  createdAt: string;
  lastAttemptAt?: string;
  attemptCount: number;
  ttlMs: number;
  requestId: string;
  inFlightOperationIds: string[];
  /**
   * Storage schema version for this checkpoint.
   * - Omitted/null in legacy records (treated as version 1 on read).
   * - Must be a positive integer when written by current code.
   */
  version?: number;
};

