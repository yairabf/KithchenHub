import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { useSupabaseAuth, SupabaseUser } from '../hooks/useSupabaseAuth';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export interface User {
  id: string;
  email: string;
  name: string;
  photoUrl?: string;
  isGuest: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;

  signOut: () => Promise<void>;
  showGuestImportPrompt: boolean;
  resolveGuestImport: (shouldImport: boolean) => Promise<void>;
  hasGuestData: boolean;
  importGuestData: () => Promise<void>;
  clearGuestData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = '@kitchen_hub_user';

const GUEST_PROMPT_KEY = '@kitchen_hub_guest_import_prompt_shown';
const HAS_GUEST_DATA_KEY = '@kitchen_hub_has_guest_data';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showGuestImportPrompt, setShowGuestImportPrompt] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const [hasGuestData, setHasGuestData] = useState(false);

  const handleUserChange = async (supabaseUser: SupabaseUser | null) => {
    if (supabaseUser) {
      const googleUser: User = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        name: supabaseUser.name,
        photoUrl: supabaseUser.avatarUrl,
        isGuest: false,
      };

      // Check if we need to prompt for guest data import
      const isCurrentlyGuest = user?.isGuest;
      const promptShown = await AsyncStorage.getItem(GUEST_PROMPT_KEY);

      if (isCurrentlyGuest && !promptShown) {
        setPendingUser(googleUser);
        setShowGuestImportPrompt(true);
      } else {
        setUser(googleUser);
        await saveUser(googleUser);
      }
    } else {
      setUser(null);
      await saveUser(null);
    }
  };

  const { signInWithGoogle, signOut: supabaseSignOut } = useSupabaseAuth(handleUserChange);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      const hasGuestDataFlag = await AsyncStorage.getItem(HAS_GUEST_DATA_KEY);
      setHasGuestData(hasGuestDataFlag === 'true');
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = async (userData: User | null) => {
    try {
      if (userData) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resolveGuestImport = async (shouldImport: boolean) => {
    if (!pendingUser) return;

    if (shouldImport) {
      await importGuestData();
    }
    // Note: If they say "Not Now", we DO NOT clear guest data. It remains available in Settings.

    // Persist that we've handled the prompt
    await AsyncStorage.setItem(GUEST_PROMPT_KEY, 'true');
    setShowGuestImportPrompt(false);

    // Complete the sign-in
    setUser(pendingUser);
    await saveUser(pendingUser);
    setPendingUser(null);
  };

  const importGuestData = async () => {
    try {
      // In a real app, this would migrate data rows.
      // For now, we simulate success and just clear the "Guest Data" distinction
      // because once imported, it belongs to the user.

      // Once imported, it is no longer "floating guest data"
      setHasGuestData(false);
      await AsyncStorage.removeItem(HAS_GUEST_DATA_KEY);
    } catch (error) {
      // Re-throw to allow UI layer to handle
      throw error;
    }
  };

  const clearGuestData = async () => {
    try {
      // Real app: Delete rows with guest ID or clear specific local keys
      // await AsyncStorage.removeItem('@kitchen_hub_shopping_lists_guest');

      setHasGuestData(false);
      await AsyncStorage.removeItem(HAS_GUEST_DATA_KEY);
    } catch (error) {
      // Re-throw to allow UI layer to handle
      throw error;
    }
  };

  const signInAsGuest = async () => {
    const guestUser: User = {
      id: Crypto.randomUUID(),
      email: '',
      name: 'Guest',
      isGuest: true,
    };
    setUser(guestUser);
    await saveUser(guestUser);

    setHasGuestData(true);
    await AsyncStorage.setItem(HAS_GUEST_DATA_KEY, 'true');
  };

  const handleSignOut = async () => {
    await supabaseSignOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signInWithGoogle: handleSignInWithGoogle,
        signInAsGuest,

        signOut: handleSignOut,
        showGuestImportPrompt,
        resolveGuestImport,
        hasGuestData,
        importGuestData,
        clearGuestData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
