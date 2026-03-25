import { isMockDataEnabled } from '../common/utils/mockDataToggle';

import { resolveApiBaseUrl } from './apiBaseUrl';

// Localhost default: adb reverse forwards Android emulator port to host
const API_BASE_URL = resolveApiBaseUrl();

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
