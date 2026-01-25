import { Platform } from 'react-native';

// Use 10.0.2.2 for Android Emulator, localhost for iOS Simulator
const DEV_API_URL = Platform.select({
    android: 'http://10.0.2.2:3000/api/v1',
    ios: 'http://localhost:3000/api/v1',
    default: 'http://localhost:3000/api/v1',
});

const BASE_URL = DEV_API_URL;

interface ApiOptions extends RequestInit {
    token?: string;
}

type ApiErrorResponse = {
    message?: string;
};

export class NetworkError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NetworkError';
    }
}

export class ApiError extends Error {
    public statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
    }
}

type NetworkStatusProvider = () => { isOffline: boolean };

class ApiClient {
    private baseUrl: string;
    private static networkStatusProvider?: NetworkStatusProvider;
    private static readonly REQUEST_TIMEOUT_MS = 15_000;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    public static setNetworkStatusProvider(provider?: NetworkStatusProvider) {
        ApiClient.networkStatusProvider = provider;
    }

    private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
        const { token, headers, ...customConfig } = options;

        if (ApiClient.networkStatusProvider?.().isOffline) {
            throw new NetworkError('No internet connection');
        }

        const config: RequestInit = {
            ...customConfig,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...headers,
            },
        };

        const { signal, clearTimeoutRef } = this.createRequestTimeout();

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, { ...config, signal });
            const data = await this.parseJsonResponse(response);

            if (!response.ok) {
                throw this.createApiError(response.status, data);
            }

            return data as T;
        } catch (error: unknown) {
            if (this.isAbortError(error)) {
                throw new NetworkError('Request timed out');
            }

            if (error instanceof ApiError || error instanceof NetworkError) {
                throw error;
            }

            const errorMessage = error instanceof Error ? error.message : 'Network request failed';
            throw new NetworkError(errorMessage);
        } finally {
            clearTimeoutRef();
        }
    }

    public get<T>(endpoint: string, options?: ApiOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    public post<T, B = unknown>(endpoint: string, body: B, options?: ApiOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) });
    }

    public put<T, B = unknown>(endpoint: string, body: B, options?: ApiOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) });
    }

    public patch<T, B = unknown>(endpoint: string, body: B, options?: ApiOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) });
    }

    public delete<T>(endpoint: string, options?: ApiOptions): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }

    private createRequestTimeout() {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), ApiClient.REQUEST_TIMEOUT_MS);
        const clearTimeoutRef = () => clearTimeout(timeoutId);
        return { signal: controller.signal, clearTimeoutRef };
    }

    private async parseJsonResponse(response: Response): Promise<unknown> {
        try {
            return await response.json();
        } catch {
            return {};
        }
    }

    private createApiError(statusCode: number, data: unknown): ApiError {
        const message = this.getMessageFromResponseData(data) ?? 'API request failed';
        return new ApiError(message, statusCode);
    }

    private getMessageFromResponseData(data: unknown): string | undefined {
        if (typeof data !== 'object' || data === null) {
            return undefined;
        }

        const message = (data as ApiErrorResponse).message;
        return typeof message === 'string' ? message : undefined;
    }

    private isAbortError(error: unknown): boolean {
        return error instanceof Error && error.name === 'AbortError';
    }
}

export const api = new ApiClient(BASE_URL);
export const setNetworkStatusProvider = ApiClient.setNetworkStatusProvider;
