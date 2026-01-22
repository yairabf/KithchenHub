import { api } from './api';

// Mock global fetch
global.fetch = jest.fn();

describe('ApiClient', () => {
    beforeEach(() => {
        (global.fetch as jest.Mock).mockClear();
    });

    const mockSuccessResponse = (data: any) => {
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

    it('performs GET request correctly', async () => {
        const mockData = { id: 1, name: 'Test' };
        mockSuccessResponse(mockData);

        const result = await api.get('/test');

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/test'),
            expect.objectContaining({
                method: 'GET',
                headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
            })
        );
        expect(result).toEqual(mockData);
    });

    it('performs POST request with body correctly', async () => {
        const mockResponse = { success: true };
        const payload = { name: 'New Item' };
        mockSuccessResponse(mockResponse);

        const result = await api.post('/create', payload);

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/create'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify(payload),
            })
        );
        expect(result).toEqual(mockResponse);
    });

    it('handles API errors correctly', async () => {
        const errorMessage = 'Not Found';
        mockErrorResponse(404, errorMessage);

        await expect(api.get('/unknown')).rejects.toThrow(errorMessage);
    });

    it('includes auth token if provided', async () => {
        mockSuccessResponse({});
        await api.get('/protected', { token: 'fake-token' });

        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/protected'),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: 'Bearer fake-token',
                }),
            })
        );
    });
});
