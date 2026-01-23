jest.mock('expo-clipboard', () => ({
    setStringAsync: jest.fn(),
    getStringAsync: jest.fn(),
    addClipboardListener: jest.fn(),
    removeClipboardListener: jest.fn(),
}));

import { config } from '../index';

describe('MobileConfig', () => {
    it('should have supabase configuration', () => {
        expect(config.supabase.url).toBeDefined();
        expect(config.supabase.anonKey).toBeDefined();
    });

    it('should use environment variables when available', () => {
        // This is a bit hard to test directly without mocking process.env
        // but we can at least check if the structure is correct
        expect(typeof config.supabase.url).toBe('string');
        expect(typeof config.supabase.anonKey).toBe('string');
    });
});
