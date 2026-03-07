import { isMockDataEnabled } from '../common/utils/mockDataToggle';

// Default base URL when EXPO_PUBLIC_API_URL is not set
// Using localhost for both platforms because adb reverse forwards Android emulator port to host
const DEFAULT_API_BASE_URL = 'http://localhost:3000';

const rawApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const API_BASE_URL = rawApiUrl && rawApiUrl.length > 0 ? rawApiUrl.replace(/\/$/, '') : DEFAULT_API_BASE_URL;

/**
 * Mobile application configuration.
 * Centralizes environment variables and application-wide settings.
 */
export const config = {
    auth: {
        redirectScheme: 'kitchen-hub',
    },
    api: {
        baseUrl: API_BASE_URL,
        version: process.env.EXPO_PUBLIC_API_VERSION || '1',
    },
  mockData: {
    enabled: isMockDataEnabled(process.env.EXPO_PUBLIC_USE_MOCK_DATA),
  },
};
