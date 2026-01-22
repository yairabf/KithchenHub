import { useEffect } from 'react';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../services/supabase';
import { config } from '../config';

export interface SupabaseUser {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
}

/**
 * Custom hook to manage Supabase authentication state and actions.
 * 
 * @param onUserChange - Callback function triggered when auth state changes.
 * @returns Object containing auth methods.
 */
export function useSupabaseAuth(onUserChange: (user: SupabaseUser | null) => void) {
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                onUserChange({
                    id: session.user.id,
                    email: session.user.email || '',
                    name: session.user.user_metadata?.full_name || 'Kitchen User',
                    avatarUrl: session.user.user_metadata?.avatar_url,
                });
            } else if (event === 'SIGNED_OUT') {
                onUserChange(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signInWithGoogle = async () => {
        const redirectUri = makeRedirectUri({
            scheme: config.auth.redirectScheme,
        });

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUri,
            },
        });

        if (error) throw error;
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    return {
        signInWithGoogle,
        signOut,
    };
}
