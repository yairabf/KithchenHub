import { ApiError } from '../../../services/api';
import { refreshAccessToken } from './sessionManager';

const mockSetAuthToken = jest.fn();
const mockSaveAccessToken = jest.fn();
const mockGetRefreshToken = jest.fn();
const mockClearTokens = jest.fn();
const mockRefreshToken = jest.fn();

jest.mock('../../../services/api', () => ({
  ApiError: class ApiError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
    }
  },
  api: {
    setAuthToken: (...args: unknown[]) => mockSetAuthToken(...args),
  },
}));

jest.mock('./tokenStorage', () => ({
  tokenStorage: {
    saveAccessToken: (...args: unknown[]) => mockSaveAccessToken(...args),
    getRefreshToken: (...args: unknown[]) => mockGetRefreshToken(...args),
    clearTokens: (...args: unknown[]) => mockClearTokens(...args),
  },
}));

jest.mock('./authApi', () => ({
  authApi: {
    refreshToken: (...args: unknown[]) => mockRefreshToken(...args),
  },
}));

describe('sessionManager.refreshAccessToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRefreshToken.mockResolvedValue('refresh-token');
    mockRefreshToken.mockResolvedValue({ accessToken: 'new-access-token' });
    mockSaveAccessToken.mockResolvedValue(undefined);
    mockClearTokens.mockResolvedValue(undefined);
  });

  describe.each([
    ['success', null, 'new-access-token'],
    ['auth rejection', new ApiError('invalid', 401), null],
    ['missing refresh token', null, null],
  ])('handles %s flow', (scenario, refreshError, expectedToken) => {
    it(`returns expected value for ${scenario}`, async () => {
      if (scenario === 'missing refresh token') {
        mockGetRefreshToken.mockResolvedValueOnce(null);
      } else if (refreshError) {
        mockRefreshToken.mockRejectedValueOnce(refreshError);
      }

      const result = await refreshAccessToken();
      expect(result).toBe(expectedToken);
    });
  });

  it('reuses single in-flight refresh request', async () => {
    let resolveRefresh: ((value: { accessToken: string }) => void) | null = null;
    const refreshPromise = new Promise<{ accessToken: string }>((resolve) => {
      resolveRefresh = resolve;
    });
    mockRefreshToken.mockReturnValueOnce(refreshPromise);

    const [first, second] = [refreshAccessToken(), refreshAccessToken()];
    resolveRefresh?.({ accessToken: 'shared-token' });

    await expect(first).resolves.toBe('shared-token');
    await expect(second).resolves.toBe('shared-token');
    expect(mockRefreshToken).toHaveBeenCalledTimes(1);
  });
});
