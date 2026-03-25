import { ClientLinksService } from './client-links.service';
import * as configuration from '../../../config/configuration';
import type { AppConfig } from '../../../config/configuration';

describe('ClientLinksService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe.each([
    {
      title: 'uses AUTH_BACKEND_BASE_URL when legal overrides are unset',
      auth: { backendBaseUrl: 'https://api.example.com/' },
      legal: {
        privacyPolicyUrl: undefined,
        termsOfServiceUrl: undefined,
      },
      expected: {
        privacyPolicyUrl: 'https://api.example.com/privacy',
        termsOfServiceUrl: 'https://api.example.com/terms',
      },
    },
    {
      title: 'uses LEGAL_* overrides when provided',
      auth: { backendBaseUrl: 'https://api.example.com' },
      legal: {
        privacyPolicyUrl: 'https://cdn.example/privacy',
        termsOfServiceUrl: 'https://cdn.example/terms',
      },
      expected: {
        privacyPolicyUrl: 'https://cdn.example/privacy',
        termsOfServiceUrl: 'https://cdn.example/terms',
      },
    },
    {
      title: 'mixes override with default path for missing side',
      auth: { backendBaseUrl: 'https://api.example.com' },
      legal: {
        privacyPolicyUrl: 'https://cdn.example/privacy',
        termsOfServiceUrl: undefined,
      },
      expected: {
        privacyPolicyUrl: 'https://cdn.example/privacy',
        termsOfServiceUrl: 'https://api.example.com/terms',
      },
    },
  ])('$title', ({ auth, legal, expected }) => {
    it('returns configured legal links', () => {
      jest.spyOn(configuration, 'loadConfiguration').mockReturnValue({
        auth,
        legal,
      } as AppConfig);

      const service = new ClientLinksService();
      expect(service.getLegalLinks()).toEqual(expected);
    });
  });
});
