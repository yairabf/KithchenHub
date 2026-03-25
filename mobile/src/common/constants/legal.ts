/**
 * Legal document URLs and storage key for in-app legal access and first-launch consent.
 * Single source of truth for Settings and LegalConsentModal.
 *
 * Defaults use the same origin as `EXPO_PUBLIC_API_URL` (see `resolveApiBaseUrl`), e.g. when the
 * API deployment serves `/privacy` and `/terms` from `static-legal/` via backend `public/`.
 *
 * Override with EXPO_PUBLIC_PRIVACY_POLICY_URL / EXPO_PUBLIC_TERMS_OF_SERVICE_URL
 * (e.g. a dedicated static-legal Vercel deployment or CDN).
 */
import { resolveApiBaseUrl } from '../../config/apiBaseUrl';

export const LEGAL_ACCEPTED_STORAGE_KEY = '@kitchen_hub_legal_accepted_v1';

const legalBaseUrl = resolveApiBaseUrl();

const privacyFromEnv = process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim();
export const PRIVACY_POLICY_URL =
  privacyFromEnv && privacyFromEnv.length > 0
    ? privacyFromEnv
    : `${legalBaseUrl}/privacy`;

const termsFromEnv = process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL?.trim();
export const TERMS_OF_SERVICE_URL =
  termsFromEnv && termsFromEnv.length > 0
    ? termsFromEnv
    : `${legalBaseUrl}/terms`;
