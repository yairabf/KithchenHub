import { Platform } from 'react-native';
import { testBackendConnectivity } from '../networkTest';
import { API_BASE_URL } from '../../../services/api';

// Mock fetch globally
global.fetch = jest.fn();

describe('testBackendConnectivity', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('successful connectivity', () => {
    it('should return success when API responds with 200', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const resultPromise = testBackendConnectivity();
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result).toMatchObject({
        success: true,
        platform: Platform.OS,
        apiBaseUrl: API_BASE_URL,
      });
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should call the correct health endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as Response);

      const resultPromise = testBackendConnectivity();
      jest.runAllTimers();
      await resultPromise;

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/api/health`,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('failed connectivity', () => {
    describe.each([
      ['400 Bad Request', 400],
      ['401 Unauthorized', 401],
      ['404 Not Found', 404],
      ['500 Internal Server Error', 500],
      ['503 Service Unavailable', 503],
    ])('with %s', (description, statusCode) => {
      it(`should return failure with error message`, async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: statusCode,
        } as Response);

        const resultPromise = testBackendConnectivity();
        jest.runAllTimers();
        const result = await resultPromise;

        expect(result).toMatchObject({
          success: false,
          platform: Platform.OS,
          apiBaseUrl: API_BASE_URL,
          error: `HTTP ${statusCode}`,
        });
        expect(result.responseTime).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('network errors', () => {
    it('should handle network failure gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network request failed'));

      const resultPromise = testBackendConnectivity();
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result).toMatchObject({
        success: false,
        platform: Platform.OS,
        apiBaseUrl: API_BASE_URL,
        error: 'Network request failed',
      });
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle timeout by aborting request', async () => {
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';
      
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(abortError), 100);
        })
      );

      const resultPromise = testBackendConnectivity();
      jest.advanceTimersByTime(5000);
      const result = await resultPromise;

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle non-Error exceptions', async () => {
      mockFetch.mockRejectedValueOnce('string error');

      const resultPromise = testBackendConnectivity();
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result).toMatchObject({
        success: false,
        platform: Platform.OS,
        apiBaseUrl: API_BASE_URL,
        error: 'Unknown error',
      });
    });
  });

  describe('timing', () => {
    it('should measure response time for successful requests', async () => {
      const startTime = Date.now();
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                status: 200,
              } as Response);
            }, 100);
          })
      );

      const resultPromise = testBackendConnectivity();
      jest.advanceTimersByTime(100);
      const result = await resultPromise;

      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should measure response time for failed requests', async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: false,
                status: 500,
              } as Response);
            }, 50);
          })
      );

      const resultPromise = testBackendConnectivity();
      jest.advanceTimersByTime(50);
      const result = await resultPromise;

      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });
  });
});
