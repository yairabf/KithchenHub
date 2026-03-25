import { ClientLinksService } from './client-links.service';
import * as configuration from '../../../config/configuration';
import type { AppConfig } from '../../../config/configuration';

describe('ClientLinksService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses AUTH_BACKEND_BASE_URL when legal overrides are unset', () => {
    jest.spyOn(configuration, 'loadConfiguration').mockReturnValue({
      auth: { backendBaseUrl: 'https://api.example.com/' },
      legal: {
        privacyPolicyUrl: undefined,
        termsOfServiceUrl: undefined,
      },
    } as AppConfig);

    const service = new ClientLinksService();
    expect(service.getLegalLinks()).toEqual({
      privacyPolicyUrl: 'https://api.example.com/privacy',
      termsOfServiceUrl: 'https://api.example.com/terms',
    });
  });

  it('uses LEGAL_* overrides when provided', () => {
    jest.spyOn(configuration, 'loadConfiguration').mockReturnValue({
      auth: { backendBaseUrl: 'https://api.example.com' },
      legal: {
        privacyPolicyUrl: 'https://cdn.example/privacy',
        termsOfServiceUrl: 'https://cdn.example/terms',
      },
    } as AppConfig);

    const service = new ClientLinksService();
    expect(service.getLegalLinks()).toEqual({
      privacyPolicyUrl: 'https://cdn.example/privacy',
      termsOfServiceUrl: 'https://cdn.example/terms',
    });
  });

  it('mixes override with default path for missing side', () => {
    jest.spyOn(configuration, 'loadConfiguration').mockReturnValue({
      auth: { backendBaseUrl: 'https://api.example.com' },
      legal: {
        privacyPolicyUrl: 'https://cdn.example/privacy',
        termsOfServiceUrl: undefined,
      },
    } as AppConfig);

    const service = new ClientLinksService();
    expect(service.getLegalLinks()).toEqual({
      privacyPolicyUrl: 'https://cdn.example/privacy',
      termsOfServiceUrl: 'https://api.example.com/terms',
    });
  });
});
