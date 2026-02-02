import { Platform } from 'react-native';
import { isMockDataEnabled } from '../common/utils/mockDataToggle';

// Default base URL when EXPO_PUBLIC_API_URL is not set: 10.0.2.2 for Android Emulator, localhost for iOS
const DEFAULT_API_BASE_URL = Platform.select({
    android: 'http://10.0.2.2:3000',
    ios: 'http://localhost:3000',
    default: 'http://localhost:3000',
});

const rawApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const API_BASE_URL = rawApiUrl && rawApiUrl.length > 0 ? rawApiUrl.replace(/\/$/, '') : DEFAULT_API_BASE_URL;

/**
 * Mobile application configuration.
 * Centralizes environment variables and application-wide settings.
 */
export const config = {
    supabase: {
        url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dpjcavnhkifatwzezwgo.supabase.co',
        anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    },
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
