jest.mock('expo-clipboard', () => ({
    setStringAsync: jest.fn(),
    getStringAsync: jest.fn(),
    addClipboardListener: jest.fn(),
    removeClipboardListener: jest.fn(),
}));

import { config } from '../index';

describe('MobileConfig', () => {
    it('should have api configuration', () => {
        expect(config.api.baseUrl).toBeDefined();
        expect(config.api.version).toBeDefined();
    });

    it('should have auth redirect scheme', () => {
        expect(config.auth.redirectScheme).toBe('kitchen-hub');
    });
});
