import { renderHook, act } from '@testing-library/react-native';
import { useSupabaseAuth } from '../useSupabaseAuth';
import { supabase } from '../../services/supabase';

// Mock Expo modules
jest.mock('expo-auth-session', () => ({
    makeRedirectUri: jest.fn(() => 'kitchen-hub://auth'),
}));

jest.mock('expo-web-browser', () => ({
    maybeCompleteAuthSession: jest.fn(),
}));

// Mock Config
jest.mock('../../config', () => ({
    config: {
        auth: {
            redirectScheme: 'kitchen-hub',
        },
        supabase: {
            url: 'https://mock.supabase.co',
            anonKey: 'mock-key',
        },
    },
}));

// Mock Supabase client
jest.mock('../../services/supabase', () => ({
    supabase: {
        auth: {
            onAuthStateChange: jest.fn(() => ({
                data: { subscription: { unsubscribe: jest.fn() } },
            })),
            signInWithOAuth: jest.fn(() => Promise.resolve({ data: {}, error: null })),
            signOut: jest.fn(() => Promise.resolve({ error: null })),
        },
    },
}));

describe('useSupabaseAuth', () => {
    it('should initialize auth listener', () => {
        const onUserChange = jest.fn();
        renderHook(() => useSupabaseAuth(onUserChange));

        expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('should handle sign out', async () => {
        const onUserChange = jest.fn();
        const { result } = renderHook(() => useSupabaseAuth(onUserChange));

        await act(async () => {
            await result.current.signOut();
        });

        expect(supabase.auth.signOut).toHaveBeenCalled();
    });
});
