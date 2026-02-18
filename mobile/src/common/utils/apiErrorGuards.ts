import { ApiError, NetworkError } from '../../services/api';

/**
 * Type guard to check if an error is an ApiError.
 * Provides type-safe error handling for API responses.
 * 
 * @param error - Unknown error object to check
 * @returns True if error is an ApiError instance
 * 
 * @example
 * ```typescript
 * try {
 *   await api.delete('/item/123');
 * } catch (error) {
 *   if (isApiError(error)) {
 *     console.log(`API error: ${error.statusCode}`);
 *   }
 * }
 * ```
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Type guard to check if an error is a NetworkError.
 * Useful for distinguishing network failures from API errors.
 * 
 * @param error - Unknown error object to check
 * @returns True if error is a NetworkError instance
 * 
 * @example
 * ```typescript
 * try {
 *   await api.get('/data');
 * } catch (error) {
 *   if (isNetworkError(error)) {
 *     showOfflineMessage();
 *   }
 * }
 * ```
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Checks if an error is a 404 Not Found error.
 * Commonly used for idempotent delete operations.
 * 
 * @param error - Unknown error object to check
 * @returns True if error is ApiError with status 404
 * 
 * @example
 * ```typescript
 * try {
 *   await api.delete('/item/123');
 * } catch (error) {
 *   if (is404Error(error)) {
 *     // Treat as already deleted (idempotent success)
 *     return;
 *   }
 *   throw error;
 * }
 * ```
 */
export function is404Error(error: unknown): boolean {
  return isApiError(error) && error.statusCode === 404;
}

/**
 * Checks if an error is a 401 Unauthorized error.
 * Useful for triggering re-authentication flows.
 * 
 * @param error - Unknown error object to check
 * @returns True if error is ApiError with status 401
 */
export function is401Error(error: unknown): boolean {
  return isApiError(error) && error.statusCode === 401;
}

/**
 * Checks if an error is a 403 Forbidden error.
 * Indicates insufficient permissions.
 * 
 * @param error - Unknown error object to check
 * @returns True if error is ApiError with status 403
 */
export function is403Error(error: unknown): boolean {
  return isApiError(error) && error.statusCode === 403;
}

/**
 * Checks if an error is a 409 Conflict error.
 * Common in concurrent update scenarios.
 * 
 * @param error - Unknown error object to check
 * @returns True if error is ApiError with status 409
 */
export function is409Error(error: unknown): boolean {
  return isApiError(error) && error.statusCode === 409;
}

/**
 * Checks if an error is a 5xx server error.
 * Indicates backend system failure.
 * 
 * @param error - Unknown error object to check
 * @returns True if error is ApiError with status 500-599
 */
export function isServerError(error: unknown): boolean {
  return isApiError(error) && error.statusCode >= 500 && error.statusCode < 600;
}

/**
 * Checks if an error is a 4xx client error.
 * Indicates invalid request from client.
 * 
 * @param error - Unknown error object to check
 * @returns True if error is ApiError with status 400-499
 */
export function isClientError(error: unknown): boolean {
  return isApiError(error) && error.statusCode >= 400 && error.statusCode < 500;
}

/**
 * Gets a user-friendly error message from an error object.
 * Handles ApiError, NetworkError, and generic Error types.
 * 
 * @param error - Unknown error object
 * @param fallback - Fallback message if error type is unknown
 * @returns User-friendly error message
 * 
 * @example
 * ```typescript
 * try {
 *   await api.post('/data', payload);
 * } catch (error) {
 *   const message = getErrorMessage(error, 'Failed to save data');
 *   showToast(message);
 * }
 * ```
 */
export function getErrorMessage(error: unknown, fallback = 'An unexpected error occurred'): string {
  if (isApiError(error) || isNetworkError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallback;
}
