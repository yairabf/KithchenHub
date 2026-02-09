# Auth Feature

**Exports** (from `mobile/src/features/auth/index.ts`): `LoginScreen`, `GoogleSignInButton`.

**Source**: `mobile/src/features/auth/` — 1 screen (LoginScreen), 1 component (GoogleSignInButton), no hooks or services.

## Overview

The Auth feature handles user authentication for Kitchen Hub via Google sign-in. It serves as the entry point for new users and manages the authentication flow.

## Screenshot

![Login Screen](../screenshots/auth/auth-login.png)

## Screens

### LoginScreen

- **File**: `mobile/src/features/auth/screens/LoginScreen.tsx`
- **Purpose**: Main authentication UI displaying branding, sign-in options, and legal footer
- **Key functionality**:
  - Display Kitchen Hub branding with emoji logo
  - Google sign-in with loading state handling
  - Join household navigation
  - Terms of Service and Privacy Policy links

#### Code Snippet

```typescript
export function LoginScreen({ navigation }: LoginScreenProps) {
  const { signInWithGoogle, showHouseholdNameScreen } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (showHouseholdNameScreen) {
      navigation.navigate('HouseholdName');
    }
  }, [showHouseholdNameScreen, navigation]);

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

## State Management

- **AuthContext**: Global authentication state via `useAuth()` hook
  - `signInWithGoogle()` - Initiates Google OAuth flow
  - `signOut()` - Signs out current user
  - `showHouseholdNameScreen` - Boolean indicating if user should see household name screen
  - `setShowHouseholdNameScreen()` - Sets household name screen visibility
- **Local state**: `isLoading` boolean to track Google sign-in progress
- **Persistence**: User data stored in AsyncStorage under `@kitchen_hub_user`

## Key Dependencies

- `@expo/vector-icons` - Ionicons for Google logo and icons
- `react-native` - Core React Native components (TouchableOpacity, Text, View, ActivityIndicator, Alert, SafeAreaView)
- `AuthContext` - Custom context for authentication state (`useAuth` hook)
- Theme system (`colors`, `spacing`, `borderRadius`, `typography`) - Centralized design tokens

## Error Handling

- **Google Sign-In Errors**: Displays user-friendly Alert dialog with error message
