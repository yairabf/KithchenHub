import { getSignedInCacheKey } from '../../../storage/dataModeStorage';

/**
 * Storage key for sync queue (signed-in users only).
 */
export const SYNC_QUEUE_STORAGE_KEY = getSignedInCacheKey('sync_queue');

/**
 * Storage key prefix for sync checkpoints (scoped by user when possible).
 */
export const SYNC_CHECKPOINT_STORAGE_KEY_PREFIX = getSignedInCacheKey('sync_checkpoint');

/**
 * Storage key for the signed-in user record.
 */
export const AUTH_USER_STORAGE_KEY = '@kitchen_hub_user';

/**
 * Maximum queue size to prevent unbounded growth.
 */
export const MAX_QUEUE_SIZE = 100;

/**
 * Default TTL for checkpoint staleness.
 * If a checkpoint persists past this TTL, we clear it and fall back to normal processing.
 */
export const DEFAULT_CHECKPOINT_TTL_MS = 10 * 60 * 1000; // 10 minutes

