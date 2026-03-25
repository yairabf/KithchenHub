import { resolveApiBaseUrl } from '../../config/apiBaseUrl';

/**
 * URLs used before GET /api/v1/client-links succeeds or when the request fails.
 * Keeps legal links working offline against the configured API host.
 */
export function buildFallbackLegalUrls(): {
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
} {
  const base = resolveApiBaseUrl();
  return {
    privacyPolicyUrl: `${base}/privacy`,
    termsOfServiceUrl: `${base}/terms`,
  };
}
