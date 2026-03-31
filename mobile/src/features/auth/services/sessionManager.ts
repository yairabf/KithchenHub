import { ApiError, api } from '../../../services/api';
import { authApi } from './authApi';
import { tokenStorage } from './tokenStorage';

let refreshInFlight: Promise<string | null> | null = null;

function isAuthRejection(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.statusCode === 401 || error.statusCode === 403)
  );
}

async function refreshAccessTokenInternal(): Promise<string | null> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await authApi.refreshToken({ refreshToken });
    if (!response.accessToken) {
      return null;
    }

    await tokenStorage.saveAccessToken(response.accessToken);
    api.setAuthToken(response.accessToken);
    return response.accessToken;
  } catch (error) {
    if (isAuthRejection(error)) {
      await tokenStorage.clearTokens();
      api.setAuthToken(null);
      return null;
    }

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
