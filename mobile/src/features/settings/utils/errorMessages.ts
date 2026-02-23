import { ApiError, NetworkError } from '../../../services/api';

/**
 * Maps account deletion errors to user-friendly i18n message keys.
 * 
 * @param error - The error thrown during account deletion
 * @param t - Translation function for i18n keys
 * @returns Localized error message string
 * 
 * @example
 * getDeleteAccountErrorMessage(new NetworkError('Offline'), t)
 * // Returns: "You are offline. Connect to the internet and try again."
 * 
 * getDeleteAccountErrorMessage(new ApiError('Unauthorized', 401), t)
 * // Returns: "Your session expired. Please sign in again and retry."
 */
export function getDeleteAccountErrorMessage(
  error: unknown,
  t: (key: string) => string
): string {
  if (error instanceof NetworkError) {
    return t('deleteAccountErrorOffline');
  }

  if (error instanceof ApiError) {
    if (error.statusCode === 401) {
      return t('deleteAccountErrorUnauthorized');
    }
    if (error.statusCode === 429) {
      return t('deleteAccountErrorRateLimit');
    }
    if (error.statusCode >= 500) {
      return t('deleteAccountErrorServer');
    }
  }

  return t('deleteAccountErrorGeneric');
}
