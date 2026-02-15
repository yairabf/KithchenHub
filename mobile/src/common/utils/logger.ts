/**
 * Environment-aware logger utility
 *
 * In development: All log levels are active
 * In production: Only warnings and errors are logged
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/common/utils/logger';
 *
 * logger.debug('[Component] State updated:', newState);
 * logger.info('[API] Request sent:', endpoint);
 * logger.warn('[Cache] Cache miss for key:', key);
 * logger.error('[Network] Failed to fetch:', error);
 * ```
 */

// Check if running in development mode
const isDev = __DEV__;

/** Values that can be passed to logger methods (primitives, Error, plain objects). */
export type Loggable = string | number | boolean | null | undefined | Error | object;

export const logger = {
  /**
   * Debug-level logging - only in development
   * Use for detailed diagnostic information
   */
  debug: (...args: Loggable[]) => {
    if (isDev) {
      console.log('[DEBUG]', ...args);
    }
  },

  /**
   * Info-level logging - only in development
   * Use for general informational messages
   */
  info: (...args: Loggable[]) => {
    if (isDev) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Warning-level logging - both dev and production
   * Use for potentially harmful situations
   */
  warn: (...args: Loggable[]) => {
    console.warn('[WARN]', ...args);
  },

  /**
   * Error-level logging - both dev and production
   * Use for error events that might still allow the application to continue
   */
  error: (...args: Loggable[]) => {
    console.error('[ERROR]', ...args);
  },
};
