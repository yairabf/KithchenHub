import { BASE_BACKOFF_DELAY_MS, MAX_BACKOFF_DELAY_MS } from './syncQueueProcessor.constants';
import type { QueuedWrite, SyncCheckpoint } from '../storage';

/**
 * Calculate exponential backoff delay in milliseconds.
 * Formula: baseDelay * (2 ^ attemptCount), capped by maxDelayMs.
 * 
 * @param attemptCount - Number of previous attempts (0-indexed)
 * @param baseDelayMs - Base delay in milliseconds (default: BASE_BACKOFF_DELAY_MS)
 * @param maxDelayMs - Maximum delay cap in milliseconds (default: MAX_BACKOFF_DELAY_MS)
 * @returns Calculated delay in milliseconds, capped at maxDelayMs
 */
export function calculateBackoffDelay(
  attemptCount: number,
  baseDelayMs: number = BASE_BACKOFF_DELAY_MS,
  maxDelayMs: number = MAX_BACKOFF_DELAY_MS
): number {
  const delay = baseDelayMs * Math.pow(2, attemptCount);
  return Math.min(delay, maxDelayMs);
}

/**
 * Wait for specified delay (non-blocking for UI).
 * 
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the specified delay
 */
export function waitForDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Parses an ISO timestamp string to milliseconds, with validation.
 * Returns null if timestamp is invalid or cannot be parsed.
 */
export function parseAttemptTimestamp(timestamp: string | undefined): number | null {
  if (!timestamp) {
    return null;
  }

  try {
    const parsed = new Date(timestamp).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  } catch {
    return null;
  }
}

/**
 * Calculates the next attempt time for a single queued item.
 * Returns null if timestamp is invalid or missing.
 * 
 * @param item - The queued write item to calculate next attempt for
 * @returns Next attempt timestamp in milliseconds, or null if timestamp is invalid or missing
 */
export function calculateNextAttemptTime(item: QueuedWrite): number | null {
  if (!item.lastAttemptAt) {
    return null;
  }

  const lastAttempt = parseAttemptTimestamp(item.lastAttemptAt);
  if (lastAttempt === null) {
    return null;
  }

  const backoffDelay = calculateBackoffDelay(item.attemptCount);
  return lastAttempt + backoffDelay;
}

/**
 * Calculates the earliest timestamp when any queued item will be ready for retry.
 * 
 * @param queue - Array of queued writes to analyze
 * @returns Timestamp in milliseconds when next item will be ready, or null if no items waiting
 */
export function calculateEarliestNextAttempt(queue: QueuedWrite[]): number | null {
  const now = Date.now();
  let earliestNextAttempt: number | null = null;

  for (const item of queue) {
    if (item.status === 'FAILED_PERMANENT') {
      continue;
    }

    if (item.attemptCount === 0) {
      return now;
    }

    const nextAttempt = calculateNextAttemptTime(item);
    if (nextAttempt !== null) {
      earliestNextAttempt =
        earliestNextAttempt === null ? nextAttempt : Math.min(earliestNextAttempt, nextAttempt);
    }
  }

  return earliestNextAttempt;
}

/**
 * Filters queued items that are ready for retry (backoff period has passed).
 * Validates timestamps and handles invalid dates gracefully.
 */
export function filterItemsReadyForRetry(queue: QueuedWrite[]): QueuedWrite[] {
  const now = Date.now();

  return queue.filter(item => {
    if (item.status === 'FAILED_PERMANENT') {
      return false;
    }

    if (item.attemptCount === 0) {
      return true;
    }

    if (!item.lastAttemptAt) {
      console.warn(
        `Item ${item.id} has attemptCount > 0 but no lastAttemptAt, treating as ready`
      );
      return true;
    }

    const lastAttempt = parseAttemptTimestamp(item.lastAttemptAt);
    if (lastAttempt === null) {
      console.warn(`Invalid lastAttemptAt for item ${item.id}, treating as ready`);
      return true;
    }

    const backoffDelay = calculateBackoffDelay(item.attemptCount);
    const nextAttemptTime = lastAttempt + backoffDelay;

    return now >= nextAttemptTime;
  });
}

/**
 * Determines whether a checkpoint is stale based on its TTL.
 */
export function isCheckpointStale(checkpoint: SyncCheckpoint): boolean {
  const createdAtMs = new Date(checkpoint.createdAt).getTime();
  if (Number.isNaN(createdAtMs)) {
    return true;
  }
  return Date.now() - createdAtMs > checkpoint.ttlMs;
}

/**
 * Determines whether a checkpoint is ready for another attempt,
 * based on lastAttemptAt and attemptCount.
 */
export function isCheckpointReadyForAttempt(checkpoint: SyncCheckpoint): boolean {
  if (!checkpoint.lastAttemptAt) {
    return true;
  }

  const lastAttempt = parseAttemptTimestamp(checkpoint.lastAttemptAt);
  if (lastAttempt === null) {
    return true;
  }

  const delay = calculateBackoffDelay(checkpoint.attemptCount);
  return Date.now() >= lastAttempt + delay;
}

/**
 * Wait for a delay with cancellation support, by polling at short intervals.
 * 
 * @param ms - Milliseconds to wait
 * @param isCancelled - Function that returns true if the operation should be cancelled
 * @returns Promise that resolves when delay completes or is cancelled
 */
export async function waitForDelayWithCancellation(
  ms: number,
  isCancelled: () => boolean
): Promise<void> {
  const checkInterval = 100;
  const endTime = Date.now() + ms;

  while (Date.now() < endTime) {
    if (isCancelled()) {
      return;
    }
    const remaining = Math.min(checkInterval, endTime - Date.now());
    await waitForDelay(remaining);
  }
}

