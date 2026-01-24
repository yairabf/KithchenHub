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

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
        const { token, headers, ...customConfig } = options;

        const config: RequestInit = {
            ...customConfig,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...headers,
            },
        };

        const response = await fetch(`${this.baseUrl}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }

        return data as T;
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
}

export const api = new ApiClient(BASE_URL);
