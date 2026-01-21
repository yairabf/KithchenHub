# Auth Feature

## Overview

The Auth feature handles user authentication for Kitchen Hub, providing two sign-in methods: Google authentication and guest mode. It serves as the entry point for new users and manages the authentication flow.

## Screenshot

![Login Screen](../screenshots/auth/auth-login.png)

## Screens

### LoginScreen

- **File**: `mobile/src/features/auth/screens/LoginScreen.tsx`
- **Purpose**: Main authentication UI displaying branding, sign-in options, and legal footer
- **Key functionality**:
  - Display Kitchen Hub branding with emoji logo
  - Google sign-in with loading state handling
  - Guest mode sign-in option ("Skip for now")
  - Guest data import prompt modal
  - Terms of Service and Privacy Policy links

#### Code Snippet

```typescript
export function LoginScreen() {
  const { signInWithGoogle, signInAsGuest, showGuestImportPrompt, resolveGuestImport } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      Alert.alert(
        'Sign In Failed',
        error instanceof Error
          ? error.message
          : 'Unable to sign in with Google. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    try {
      await signInAsGuest();
    } catch (error) {
      Alert.alert(
        'Sign In Failed',
        error instanceof Error
          ? error.message
          : 'Unable to sign in as guest. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };
  // ... render JSX
}
```

## Components

### GoogleSignInButton

- **File**: `mobile/src/features/auth/components/GoogleSignInButton/`
- **Purpose**: Reusable button component for Google authentication
- **Props**:

```typescript
interface GoogleSignInButtonProps {
  onPress: () => void;
  isLoading?: boolean;
}
```

- **Features**:
  - Shows Google icon with branded styling
  - Displays loading spinner when authentication is in progress
  - Disabled state during loading to prevent double-clicks

#### Code Snippet

```typescript
export function GoogleSignInButton({ onPress, isLoading }: GoogleSignInButtonProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.textPrimary} />
      ) : (
        <>
          <View style={styles.iconContainer}>
            <Ionicons name="logo-google" size={20} color={colors.google} />
          </View>
          <Text style={styles.text}>Sign in with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
```

### GuestDataImportModal

- **File**: `mobile/src/features/auth/components/GuestDataImportModal.tsx`
- **Purpose**: Modal prompting users to import existing guest session data when signing in with Google
- **Props**:

```typescript
interface GuestDataImportModalProps {
  visible: boolean;
  onImport: () => void;
  onSkip: () => void;
}
```

- **Features**:
  - Displays when existing guest data is detected during Google sign-in
  - Allows users to import recipes or plans from guest session
  - Uses `CenteredModal` component for consistent styling
  - Provides "Import local data" and "Not now" options

## State Management

- **AuthContext**: Global authentication state via `useAuth()` hook
  - `signInWithGoogle()` - Initiates Google OAuth flow
  - `signInAsGuest()` - Creates guest user session
  - `signOut()` - Signs out current user
  - `showGuestImportPrompt` - Boolean indicating if guest import prompt should be shown
  - `resolveGuestImport(shouldImport: boolean)` - Resolves the guest import prompt (import or skip)
  - `hasGuestData` - Boolean indicating if user has guest data available for import
  - `importGuestData()` - Imports guest session data to authenticated account
  - `clearGuestData()` - Permanently deletes guest session data
- **Local state**: `isLoading` boolean to track Google sign-in progress
- **Persistence**: User data stored in AsyncStorage under `@kitchen_hub_user`
- **Guest data tracking**: AsyncStorage keys:
  - `@kitchen_hub_guest_import_prompt_shown` - Tracks if import prompt has been shown
  - `@kitchen_hub_has_guest_data` - Tracks if guest data exists

## Key Dependencies

- `@expo/vector-icons` - Ionicons for Google logo and icons
- `react-native` - Core React Native components (TouchableOpacity, Text, View, ActivityIndicator, Alert, SafeAreaView)
- `AuthContext` - Custom context for authentication state (`useAuth` hook)
- `CenteredModal` - Shared modal component for consistent UI (used by GuestDataImportModal)
- Theme system (`colors`, `spacing`, `borderRadius`, `typography`) - Centralized design tokens

## Error Handling

- **Google Sign-In Errors**: Displays user-friendly Alert dialog with error message
- **Guest Sign-In Errors**: Displays user-friendly Alert dialog with error message
- **Guest Data Import Errors**: Handled in AuthContext and propagated to UI layer for user feedback
