import React, { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';

type AppLifecycleContextValue = {
  appState: AppStateStatus;
  previousState: AppStateStatus | null;
  isActive: boolean;
  isForeground: boolean;
  isBackground: boolean;
};

const AppLifecycleContext = createContext<AppLifecycleContextValue | undefined>(undefined);

export function AppLifecycleProvider({ children }: { children: ReactNode }) {
  const initialState = AppState.currentState;
  const [appState, setAppState] = useState<AppStateStatus>(initialState);
  const previousStateRef = useRef<AppStateStatus | null>(null);
  const currentStateRef = useRef<AppStateStatus>(initialState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      previousStateRef.current = currentStateRef.current;
      currentStateRef.current = nextState;
      setAppState(nextState);
    });

    return () => subscription.remove();
  }, []);

  const value = useMemo<AppLifecycleContextValue>(() => {
    const isActive = appState === 'active';
    return {
      appState,
      previousState: previousStateRef.current,
      isActive,
      isForeground: isActive,
      isBackground: appState === 'background' || appState === 'inactive',
    };
  }, [appState]);

  return <AppLifecycleContext.Provider value={value}>{children}</AppLifecycleContext.Provider>;
}

export function useAppLifecycle() {
  const context = useContext(AppLifecycleContext);
  if (context === undefined) {
    throw new Error('useAppLifecycle must be used within an AppLifecycleProvider');
  }
  return context;
}
