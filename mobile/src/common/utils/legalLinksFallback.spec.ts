jest.mock('../../config/apiBaseUrl', () => ({
  resolveApiBaseUrl: jest.fn(),
}));

import { resolveApiBaseUrl } from '../../config/apiBaseUrl';

import { buildFallbackLegalUrls } from './legalLinksFallback';

describe('buildFallbackLegalUrls', () => {
  it('returns /privacy and /terms on the resolved API base URL', () => {
    (resolveApiBaseUrl as jest.Mock).mockReturnValue('https://api.example.com');
    expect(buildFallbackLegalUrls()).toEqual({
      privacyPolicyUrl: 'https://api.example.com/privacy',
      termsOfServiceUrl: 'https://api.example.com/terms',
    });
  });
});
