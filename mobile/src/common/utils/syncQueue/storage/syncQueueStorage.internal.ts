import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import {
  AUTH_USER_STORAGE_KEY,
  DEFAULT_CHECKPOINT_TTL_MS,
  MAX_QUEUE_SIZE,
  SYNC_CHECKPOINT_STORAGE_KEY_PREFIX,
  SYNC_QUEUE_STORAGE_KEY,
  CURRENT_QUEUE_STORAGE_VERSION,
  CURRENT_CHECKPOINT_STORAGE_VERSION,
} from './syncQueueStorage.constants';
import type { QueueTargetId, QueuedWrite, QueuedWriteStatus, SyncCheckpoint } from './syncQueueStorage.types';

type StoredUser = {
  id: string;
  householdId?: string;
  isGuest?: boolean;
};

export async function getStoredSignedInUser(): Promise<StoredUser | null> {
  try {
    const raw = await AsyncStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    const user = parsed as Record<string, unknown>;
    if (typeof user.id !== 'string' || user.id.length === 0) {
      return null;
    }
    if (user.isGuest === true) {
      return null;
    }
    return {
      id: user.id,
      householdId: typeof user.householdId === 'string' ? user.householdId : undefined,
      isGuest: Boolean(user.isGuest),
    };
  } catch {
    return null;
  }
}

export function buildCheckpointStorageKey(userId: string | undefined): string {
  return userId ? `${SYNC_CHECKPOINT_STORAGE_KEY_PREFIX}:${userId}` : SYNC_CHECKPOINT_STORAGE_KEY_PREFIX;
}

export function isValidIsoDateString(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const t = new Date(value).getTime();
  return !Number.isNaN(t);
}

export function isValidUuidLike(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

export function validateCheckpointShape(candidate: unknown): SyncCheckpoint | null {
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }
  const cp = candidate as Record<string, unknown>;

  if (!isValidUuidLike(cp.checkpointId)) return null;
  if (!isValidUuidLike(cp.userId)) return null;
  if (cp.householdId !== undefined && typeof cp.householdId !== 'string') return null;

  if (!isValidIsoDateString(cp.createdAt)) return null;
  if (cp.lastAttemptAt !== undefined && !isValidIsoDateString(cp.lastAttemptAt)) return null;

  if (typeof cp.attemptCount !== 'number' || !Number.isFinite(cp.attemptCount) || cp.attemptCount < 0) {
    return null;
  }
  if (typeof cp.ttlMs !== 'number' || !Number.isFinite(cp.ttlMs) || cp.ttlMs <= 0) {
    return null;
  }

  if (!isValidUuidLike(cp.requestId)) return null;
  if (!Array.isArray(cp.inFlightOperationIds)) return null;
  for (const opId of cp.inFlightOperationIds) {
    if (!isValidUuidLike(opId)) return null;
  }

  const normalizedVersion =
    typeof cp.version === 'number' && Number.isInteger(cp.version) && cp.version > 0
      ? cp.version
      : 1;

  return {
    checkpointId: cp.checkpointId,
    userId: cp.userId,
    householdId: typeof cp.householdId === 'string' ? cp.householdId : undefined,
    createdAt: cp.createdAt,
    lastAttemptAt: typeof cp.lastAttemptAt === 'string' ? cp.lastAttemptAt : undefined,
    attemptCount: cp.attemptCount,
    ttlMs: cp.ttlMs,
    requestId: cp.requestId,
    inFlightOperationIds: cp.inFlightOperationIds as string[],
    version: normalizedVersion,
  };
}

export function removeOperationIdsFromCheckpoint(
  checkpoint: SyncCheckpoint,
  confirmedOperationIds: string[]
): SyncCheckpoint {
  if (confirmedOperationIds.length === 0) {
    return checkpoint;
  }
  const confirmedSet = new Set(confirmedOperationIds);
  const remaining = checkpoint.inFlightOperationIds.filter(opId => !confirmedSet.has(opId));
  return { ...checkpoint, inFlightOperationIds: remaining };
}

export function formatHashAsUuid(hash: string): string {
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

export function generateFallbackOperationId(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hexString = Math.abs(hash).toString(16).padStart(32, '0');
  return formatHashAsUuid(hexString);
}

function normalizeStorageVersion(version: unknown): number {
  if (typeof version !== 'number' || !Number.isInteger(version) || version <= 0) {
    return 1;
  }
  return version;
}

function isFutureQueueVersion(version: number): boolean {
  return version > CURRENT_QUEUE_STORAGE_VERSION;
}

export async function generateDeterministicOperationId(
  entityType: string,
  localId: string,
  op: string,
  clientTimestamp: string
): Promise<string> {
  const content = `${entityType}:${localId}:${op}:${clientTimestamp}`;

  try {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      content
    );
    return formatHashAsUuid(hash);
  } catch (error) {
    console.error('Failed to generate deterministic operationId using crypto, using fallback:', error);
    return generateFallbackOperationId(content);
  }
}

export async function readQueue(): Promise<QueuedWrite[]> {
  try {
    const raw = await AsyncStorage.getItem(SYNC_QUEUE_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;

    if (!Array.isArray(parsed)) {
      console.error('Invalid sync queue format: expected array');
      return [];
    }

    const valid: QueuedWrite[] = [];
    const itemsNeedingWriteBack: QueuedWrite[] = [];

    for (const candidate of parsed) {
      if (
        typeof candidate === 'object' &&
        candidate !== null &&
        typeof (candidate as QueuedWrite).id === 'string' &&
        typeof (candidate as QueuedWrite).entityType === 'string' &&
        typeof (candidate as QueuedWrite).op === 'string' &&
        typeof (candidate as QueuedWrite).target === 'object' &&
        (candidate as QueuedWrite).target !== null &&
        typeof ((candidate as QueuedWrite).target as QueueTargetId).localId === 'string' &&
        typeof (candidate as QueuedWrite).clientTimestamp === 'string' &&
        typeof (candidate as QueuedWrite).attemptCount === 'number'
      ) {
        const rawItem = candidate as QueuedWrite;
        const version = normalizeStorageVersion((rawItem as { version?: unknown }).version);

        const validStatuses: QueuedWriteStatus[] = ['PENDING', 'RETRYING', 'FAILED_PERMANENT'];
        const status = validStatuses.includes(rawItem.status as QueuedWriteStatus)
          ? (rawItem.status as QueuedWriteStatus)
          : 'PENDING';

        // If this record comes from a future, unsupported storage schema version,
        // keep it but mark it as permanently failed to avoid processing it.
        const isFutureVersion = isFutureQueueVersion(version);

        let baseItem: QueuedWrite = {
          ...rawItem,
          status: isFutureVersion ? 'FAILED_PERMANENT' : status,
          lastAttemptAt: rawItem.lastAttemptAt,
          lastError: isFutureVersion
            ? `Unsupported queue storage version ${version}; current=${CURRENT_QUEUE_STORAGE_VERSION}`
            : rawItem.lastError,
          requestId: typeof rawItem.requestId === 'string' ? rawItem.requestId : undefined,
          version,
        };

        if (!isFutureVersion && typeof rawItem.operationId !== 'string') {
          // Legacy item without operationId: generate deterministic id
          const operationId = await generateDeterministicOperationId(
            rawItem.entityType,
            (rawItem.target as QueueTargetId).localId,
            rawItem.op,
            rawItem.clientTimestamp
          );
          baseItem = {
            ...baseItem,
            operationId,
          };
        }

        valid.push(baseItem);

        // If version was missing/invalid or status was fixed, we should write back
        const needsWriteBack =
          version !== (rawItem as { version?: number }).version ||
          baseItem.status !== rawItem.status ||
          (typeof rawItem.operationId !== 'string' && typeof baseItem.operationId === 'string');

        if (needsWriteBack) {
          itemsNeedingWriteBack.push(baseItem);
        }
      } else {
        console.warn('Invalid queue item format, skipping:', candidate);
      }
    }

    if (itemsNeedingWriteBack.length > 0) {
      // Best-effort: persist the normalized queue state so we do not need
      // to re-run migrations on every app start.
      try {
        const sortedForWriteBack = valid
          .slice()
          .sort((a, b) => a.clientTimestamp.localeCompare(b.clientTimestamp));
        await AsyncStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(sortedForWriteBack));
      } catch (writeBackError) {
        console.error('Failed to write back migrated sync queue:', writeBackError);
      }
    }

    return valid.sort((a, b) => a.clientTimestamp.localeCompare(b.clientTimestamp));
  } catch (error) {
    if (error instanceof SyntaxError) {
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

export async function writeQueue(queue: QueuedWrite[]): Promise<void> {
  try {
    if (queue.length > MAX_QUEUE_SIZE) {
      console.warn(
        `Sync queue exceeds maximum size (${MAX_QUEUE_SIZE}). ` +
        `Keeping oldest ${MAX_QUEUE_SIZE} items.`
      );
      const sorted = queue.sort((a, b) => a.clientTimestamp.localeCompare(b.clientTimestamp));
      queue = sorted.slice(0, MAX_QUEUE_SIZE);
    }

    await AsyncStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to write sync queue: ${errorMessage}`, { cause: error });
  }
}

export function compactQueue(queue: QueuedWrite[]): QueuedWrite[] {
  const compacted = new Map<string, QueuedWrite>();

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

    if (existing.op === 'create' && item.op === 'update') {
      compacted.set(key, {
        ...existing,
        payload: item.payload,
        clientTimestamp: item.clientTimestamp,
      });
    } else if (existing.op === 'update' && item.op === 'update') {
      compacted.set(key, {
        ...existing,
        payload: item.payload,
        clientTimestamp: item.clientTimestamp,
      });
    } else if (existing.op === 'create' && item.op === 'delete') {
      compacted.delete(key);
    } else if (existing.op === 'delete' && item.op === 'update') {
      // keep delete
    } else if (existing.op === 'delete' && item.op === 'delete') {
      // keep one delete
    } else {
      console.warn(`Unexpected queue compaction: ${existing.op} + ${item.op}`);
      compacted.set(key, item);
    }
  }

  return Array.from(compacted.values());
}

