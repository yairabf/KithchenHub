import { api, ApiError, NetworkError, setNetworkStatusProvider } from './api';

// Mock global fetch
global.fetch = jest.fn();

class MockAbortError extends Error {
    constructor() {
        super('Aborted');
        this.name = 'AbortError';
    }
}

describe('ApiClient', () => {
    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
        setNetworkStatusProvider();
    });

    const mockSuccessResponse = <T,>(data: T) => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => data,
        });
    };

    const mockErrorResponse = (status: number, message: string) => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status,
            json: async () => ({ message }),
        });
    };

    describe.each([
        ['GET', 'get', '/test', undefined],
        ['POST', 'post', '/create', { name: 'New Item' }],
        ['PUT', 'put', '/update', { name: 'Updated Item' }],
        ['PATCH', 'patch', '/patch', { name: 'Patched Item' }],
    ])('performs %s request correctly', (methodLabel, methodName, path, payload) => {
        it('sends request with expected method and body', async () => {
            const mockResponse = { success: true };
            mockSuccessResponse(mockResponse);

            const result =
                methodName === 'get'
                    ? await api.get(path)
                    : await api[methodName as 'post' | 'put' | 'patch'](path, payload);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining(path),
                expect.objectContaining({
                    method: methodLabel,
                    ...(payload ? { body: JSON.stringify(payload) } : {}),
                })
            );
            expect(result).toEqual(mockResponse);
        });
    });

    describe.each([
        ['includes auth token', { token: 'fake-token' }, 'Bearer fake-token'],
    ])('auth header handling: %s', (_label, options, expected) => {
        it('adds authorization header when token provided', async () => {
            mockSuccessResponse({});
            await api.get('/protected', options);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/protected'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        Authorization: expected,
                    }),
                })
            );
        });
    });

    describe.each([
        ['API error response', 404, 'Not Found'],
    ])('API error handling: %s', (_label, status, message) => {
        it('throws ApiError with status and message', async () => {
            mockErrorResponse(status, message);

            const promise = api.get('/unknown');
            await expect(promise).rejects.toBeInstanceOf(ApiError);
            await expect(promise).rejects.toThrow(message);
        });
    });

    describe.each([
        [
            'offline via provider',
            () => setNetworkStatusProvider(() => ({ isOffline: true })),
            false,
        ],
        [
            'fetch failure',
            () => (global.fetch as jest.Mock).mockRejectedValue(new Error('Network failed')),
            true,
        ],
    ])('network error handling: %s', (_label, setup, shouldCallFetch) => {
        it('throws NetworkError', async () => {
            setup();
            await expect(api.get('/any')).rejects.toBeInstanceOf(NetworkError);

            if (shouldCallFetch) {
                expect(global.fetch).toHaveBeenCalled();
            } else {
                expect(global.fetch).not.toHaveBeenCalled();
            }
        });
    });

    it('throws NetworkError on timeout', async () => {
        jest.useFakeTimers();
        (global.fetch as jest.Mock).mockImplementation((_url: string, options?: RequestInit) => {
            return new Promise((_resolve, reject) => {
                const signal = options?.signal;
                if (!signal) {
                    return;
                }

                if (signal.aborted) {
                    reject(new MockAbortError());
                    return;
                }

                signal.addEventListener('abort', () => reject(new MockAbortError()));
            });
        });

        const promise = api.get('/slow');
        jest.advanceTimersByTime(16_000);

        await expect(promise).rejects.toBeInstanceOf(NetworkError);
        jest.useRealTimers();
    });
});
