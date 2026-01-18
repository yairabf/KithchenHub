# Settings Feature

## Overview

The Settings feature provides user account management, notification preferences, household member management, data controls, and app information. It displays the current user's profile and offers various configuration options.

## Screenshots

### Main Settings View
![Settings Main](../screenshots/settings/settings-main.png)

### Manage Household Modal
![Manage Household Modal](../screenshots/settings/settings-household-modal.png)

## Screens

### SettingsScreen

- **File**: `src/features/settings/screens/SettingsScreen.tsx`
- **Purpose**: Comprehensive settings interface with multiple sections
- **Key functionality**:
  - **Account Section**: User profile card, sign-in prompt for guests, sign out button
  - **Notifications Section**: Push notifications and daily summary email toggles
  - **Household Section**: Button to manage household members
  - **Data Section**: Cloud sync toggle, export data, delete account options
  - **About Section**: Terms of Service, Privacy Policy, app version

#### Code Snippet - State Management

```typescript
const { user, signOut } = useAuth();
const [pushNotifications, setPushNotifications] = React.useState(true);
const [dailySummary, setDailySummary] = React.useState(false);
const [cloudSync, setCloudSync] = React.useState(true);
const [showManageHousehold, setShowManageHousehold] = React.useState(false);
```

## Components

### ManageHouseholdModal

- **File**: `src/features/settings/components/ManageHouseholdModal/`
- **Purpose**: Household member management interface
- **Props**:

```typescript
interface ManageHouseholdModalProps {
  visible: boolean;
  onClose: () => void;
}
```

- **Features**:
  - Input field to add new household members
  - List of current members with color indicators
  - Delete buttons (disabled for default members)
  - "Default" badge for built-in members
  - Uses `HouseholdContext` for state management
  - Async operations for adding/removing members

## UI Sections

### Account Section
- **Profile Card**:
  - User avatar (Google photo or placeholder icon)
  - User name (or "Guest")
  - Email (if signed in)
  - Provider info ("Guest Mode" or "Connected via Google")
- **Sign In Prompt** (guests only): Google sign-in button
- **Sign Out Button**: Red-bordered button with logout icon

### Notifications Section
- **Push notifications**: Toggle switch (default: on)
- **Daily summary email**: Toggle switch (default: off)

### Household Section
- **Manage household members**: Opens ManageHouseholdModal

### Data Section
- **Sync to cloud**: Toggle switch (disabled for guests)
- **Export my data**: Navigation row
- **Delete account**: Red text, navigation row

### About Section
- **Terms of Service**: Navigation row
- **Privacy Policy**: Navigation row
- **App Version**: Displays "1.0.0"

## State Management

- **AuthContext**: User data and `signOut` function via `useAuth()` hook
- **HouseholdContext**: Household members state (used in modal)
- **Local state**:
  - `pushNotifications` - Push notification toggle state
  - `dailySummary` - Email summary toggle state
  - `cloudSync` - Cloud sync toggle state
  - `showManageHousehold` - Modal visibility

## Key Dependencies

- `@expo/vector-icons` - Ionicons for all icons
- `AuthContext` - User authentication state
- `HouseholdContext` - Household member management
- `CenteredModal` - Shared modal component (used by ManageHouseholdModal)
- `Switch` - React Native switch component for toggles

## Conditional Rendering

- **Guest users**:
  - Show "Sign in to sync your data" prompt
  - Cloud sync toggle is disabled
  - Profile shows "Guest Mode"

- **Authenticated users**:
  - Show email in profile
  - Cloud sync toggle is enabled
  - Profile shows "Connected via Google"

## Household Members

Default members (cannot be removed):
- Mom (red indicator)
- Dad (green indicator)
- Kids (orange indicator)
- All (purple indicator)

Users can add custom household members which can be deleted.
