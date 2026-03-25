import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';

import { logger } from '../../common/utils/logger';
import { api } from '../../services/api';

jest.mock('../../config/apiBaseUrl', () => ({
  resolveApiBaseUrl: () => 'https://fallback.test',
}));

jest.mock('../../services/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

const mockApiGet = api.get as jest.Mock;

import { LegalLinksProvider, useLegalLinks } from '../LegalLinksContext';

const FALLBACK = {
  privacyPolicyUrl: 'https://fallback.test/privacy',
  termsOfServiceUrl: 'https://fallback.test/terms',
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LegalLinksProvider>{children}</LegalLinksProvider>
);

describe('LegalLinksProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates context when client-links returns valid URLs', async () => {
    mockApiGet.mockResolvedValue({
      privacyPolicyUrl: 'https://api.example/privacy',
      termsOfServiceUrl: 'https://api.example/terms',
    });

    const { result } = renderHook(() => useLegalLinks(), { wrapper });

    await waitFor(() => {
      expect(result.current.privacyPolicyUrl).toBe('https://api.example/privacy');
    });
    expect(result.current.termsOfServiceUrl).toBe('https://api.example/terms');
    expect(mockApiGet).toHaveBeenCalledWith('/client-links');
  });

  it.each([
    ['empty privacy', { privacyPolicyUrl: '', termsOfServiceUrl: 'https://x/t' }],
    ['empty terms', { privacyPolicyUrl: 'https://x/p', termsOfServiceUrl: '' }],
    ['missing terms', { privacyPolicyUrl: 'https://x/p' }],
    ['non-string privacy', { privacyPolicyUrl: 1, termsOfServiceUrl: 'https://x/t' }],
  ])('keeps fallback when payload is invalid (%s)', async (_, payload) => {
    const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
    mockApiGet.mockResolvedValue(payload);

    const { result } = renderHook(() => useLegalLinks(), { wrapper });

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalled();
    });

    expect(result.current).toEqual(FALLBACK);
    expect(warnSpy).toHaveBeenCalledWith(
      '[LegalLinks] Invalid or empty client-links payload, using fallback URLs',
    );
    warnSpy.mockRestore();
  });

  it('keeps fallback when GET fails and logs in dev', async () => {
    const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => {});
    const err = new Error('network');
    mockApiGet.mockRejectedValue(err);

    const { result } = renderHook(() => useLegalLinks(), { wrapper });

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalled();
    });

    expect(result.current).toEqual(FALLBACK);
    expect(warnSpy).toHaveBeenCalledWith(
      '[LegalLinks] GET /client-links failed, using fallback URLs',
      err,
    );
    warnSpy.mockRestore();
  });
});
