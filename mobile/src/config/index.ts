import { isMockDataEnabled } from '../common/utils/mockDataToggle';

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
        version: process.env.EXPO_PUBLIC_API_VERSION || '1',
    },
  mockData: {
    enabled: isMockDataEnabled(process.env.EXPO_PUBLIC_USE_MOCK_DATA),
  },
};
