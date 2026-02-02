import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Onboarding mode types
 */
export type OnboardingMode = 'login_or_signup' | 'join_by_invite';

/**
 * Context for storing validated invite information
 */
export interface InviteContext {
  /** The invite code entered by the user */
  code: string;
  /** The household ID from the validated invite */
  householdId: string;
  /** The household name from the validated invite */
  householdName: string;
}

/**
 * Onboarding context type definition
 */
export interface OnboardingContextType {
  /** Current onboarding mode */
  mode: OnboardingMode;
  /** Validated invite context (only present in join_by_invite mode) */
  inviteContext?: InviteContext;
  /** Sets the current onboarding mode */
  setMode: (mode: OnboardingMode) => void;
  /** Sets the invite context after validation */
  setInviteContext: (context: InviteContext | undefined) => void;
  /** Clears all onboarding state (called after successful auth) */
  clearOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

/**
 * Onboarding state provider.
 * 
 * Manages the onboarding flow state, including the current mode and
 * validated invite information. This context is in-memory only and
 * does not persist across app restarts.
 * 
 * The context supports two flows:
 * 1. **login_or_signup**: User signs in directly (default mode)
 * 2. **join_by_invite**: User enters invite code and joins existing household
 * 
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <OnboardingProvider>
 *       <AuthStackNavigator />
 *     </OnboardingProvider>
 *   );
 * }
 * ```
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<OnboardingMode>('login_or_signup');
  const [inviteContext, setInviteContext] = useState<InviteContext | undefined>(undefined);

  /**
   * Clears all onboarding state.
   * Called after successful authentication to reset the flow.
   */
  const clearOnboarding = () => {
    setMode('login_or_signup');
    setInviteContext(undefined);
  };

  return (
    <OnboardingContext.Provider
      value={{
        mode,
        inviteContext,
        setMode,
        setInviteContext,
        clearOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

/**
 * Hook to access onboarding context.
 * 
 * Must be used within an OnboardingProvider.
 * 
 * @throws Error if used outside of OnboardingProvider
 * 
 * @example
 * ```tsx
 * function EnterInviteCodeScreen() {
 *   const { setMode, setInviteContext } = useOnboarding();
 * 
 *   const handleValidateCode = async (code: string) => {
 *     const result = await inviteApi.validateInviteCode(code);
 *     setMode('join_by_invite');
 *     setInviteContext({
 *       code,
 *       householdId: result.householdId,
 *       householdName: result.householdName,
 *     });
 *   };
 * 
 *   // ...
 * }
 * ```
 */
export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
