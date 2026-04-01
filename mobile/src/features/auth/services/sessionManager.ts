import { ApiError, api } from '../../../services/api';
import { authApi } from './authApi';
import { tokenStorage } from './tokenStorage';
import { logger } from '../../../common/utils/logger';

let refreshInFlight: Promise<string | null> | null = null;

function isAuthRejection(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.statusCode === 401 || error.statusCode === 403)
  );
}

async function refreshAccessTokenInternal(): Promise<string | null> {
  logger.debug('[SessionManager] Refresh attempt started');
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) {
    logger.warn('[SessionManager] Refresh skipped: no refresh token');
    return null;
  }

  try {
    const response = await authApi.refreshToken({ refreshToken });
    if (!response.accessToken) {
      logger.warn('[SessionManager] Refresh failed: no access token in response');
      return null;
    }

    await tokenStorage.saveAccessToken(response.accessToken);
    api.setAuthToken(response.accessToken);
    logger.debug('[SessionManager] Refresh succeeded');
    return response.accessToken;
  } catch (error) {
    if (isAuthRejection(error)) {
      logger.warn('[SessionManager] Refresh rejected by auth API, clearing tokens');
      await tokenStorage.clearTokens();
      api.setAuthToken(null);
      return null;
    }

    logger.error('[SessionManager] Refresh failed with non-auth error', error);
    throw error;
  }
}

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessTokenInternal().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}
