/**
 * Maximum number of items to process in a single sync batch.
 * Smaller batches reduce payload size/latency and limit blast radius on failures.
 */
export const MAX_BATCH_SIZE = 50;

/**
 * Maximum retry attempts before giving up.
 */
export const MAX_RETRY_ATTEMPTS = 3;

/**
 * Base delay for exponential backoff (1 second).
 */
export const BASE_BACKOFF_DELAY_MS = 1000;

/**
 * Maximum delay cap for exponential backoff (30 seconds).
 */
export const MAX_BACKOFF_DELAY_MS = 30000;

