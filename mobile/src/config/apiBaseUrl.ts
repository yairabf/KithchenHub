/**
 * Resolves the API base URL from the environment.
 * Keep in sync with how consumers expect EXPO_PUBLIC_API_URL to behave (trim, no trailing slash).
 *
 * Production builds should set a full URL including scheme (e.g. https://api.example.com).
 */
export const DEFAULT_API_BASE_URL = 'http://localhost:3000';

export function resolveApiBaseUrl(): string {
  const rawApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (rawApiUrl && rawApiUrl.length > 0) {
    return rawApiUrl.replace(/\/$/, '');
  }
  return DEFAULT_API_BASE_URL;
}
