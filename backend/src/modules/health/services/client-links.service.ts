import { Injectable } from '@nestjs/common';

import { loadConfiguration } from '../../../config/configuration';

export type ClientLegalLinks = {
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
};

/**
 * Builds absolute privacy/terms URLs for mobile and web clients.
 * Uses LEGAL_* env overrides when set; otherwise AUTH_BACKEND_BASE_URL + /privacy | /terms.
 */
@Injectable()
export class ClientLinksService {
  getLegalLinks(): ClientLegalLinks {
    const config = loadConfiguration();
    const base = config.auth.backendBaseUrl.replace(/\/$/, '');
    const privacy = config.legal?.privacyPolicyUrl?.trim() || `${base}/privacy`;
    const terms = config.legal?.termsOfServiceUrl?.trim() || `${base}/terms`;
    return {
      privacyPolicyUrl: privacy,
      termsOfServiceUrl: terms,
    };
  }
}
