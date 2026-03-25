import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { buildFallbackLegalUrls } from '../common/utils/legalLinksFallback';
import { logger } from '../common/utils/logger';
import { api } from '../services/api';

export type LegalLinks = {
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
};

const defaultLegalLinks = buildFallbackLegalUrls();

const LegalLinksContext = createContext<LegalLinks>(defaultLegalLinks);

/**
 * Fetches legal document URLs from GET /api/v1/client-links on mount.
 * Falls back to {EXPO_PUBLIC_API_URL}/privacy|/terms when offline or on error.
 */
export function LegalLinksProvider({ children }: { children: React.ReactNode }) {
  const initial = useMemo(() => buildFallbackLegalUrls(), []);
  const [urls, setUrls] = useState<LegalLinks>(initial);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await api.get<LegalLinks>('/client-links');
        if (cancelled) return;
        if (
          typeof next.privacyPolicyUrl === 'string' &&
          next.privacyPolicyUrl.length > 0 &&
          typeof next.termsOfServiceUrl === 'string' &&
          next.termsOfServiceUrl.length > 0
        ) {
          setUrls(next);
        } else if (__DEV__) {
          logger.warn(
            '[LegalLinks] Invalid or empty client-links payload, using fallback URLs',
          );
        }
      } catch (error: unknown) {
        if (__DEV__) {
          logger.warn(
            '[LegalLinks] GET /client-links failed, using fallback URLs',
            error,
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <LegalLinksContext.Provider value={urls}>{children}</LegalLinksContext.Provider>
  );
}

export function useLegalLinks(): LegalLinks {
  return useContext(LegalLinksContext);
}
