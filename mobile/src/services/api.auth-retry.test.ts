import {
  api,
  ApiError,
  setOnUnauthorizedHandler,
  setSessionRefreshHandler,
} from './api';

const mockUnauthorizedHandler = jest.fn();

describe('ApiClient auth retry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.setAuthToken('expired-token');
    setOnUnauthorizedHandler(mockUnauthorizedHandler);
  });

  afterEach(() => {
    setSessionRefreshHandler(null);
    setOnUnauthorizedHandler(null);
  });

  describe.each([
    ['refresh succeeds', true, 0],
    ['refresh fails', false, 1],
  ])('%s', (_name, refreshSucceeds, expectedUnauthorizedCalls) => {
    it('handles 401 response correctly', async () => {
      setSessionRefreshHandler(async () =>
        refreshSucceeds ? 'new-token' : null,
      );

      const fetchMock = jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ message: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ success: true, data: { ok: true } }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        );

      if (refreshSucceeds) {
        await expect(api.get<{ ok: boolean }>('/auth/me')).resolves.toEqual({
          ok: true,
        });
      } else {
        await expect(api.get('/auth/me')).rejects.toBeInstanceOf(ApiError);
      }

      expect(mockUnauthorizedHandler).toHaveBeenCalledTimes(
        expectedUnauthorizedCalls,
      );
      fetchMock.mockRestore();
    });
  });
});
