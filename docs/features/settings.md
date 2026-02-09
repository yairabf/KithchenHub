# Settings Feature

**Exports** (from `mobile/src/features/settings/index.ts`): `SettingsScreen`, `ManageHouseholdModal`, `LanguageSelectorModal`.

**Source**: `mobile/src/features/settings/` — 1 screen (SettingsScreen), 2 components (ManageHouseholdModal, LanguageSelectorModal).

## Overview

The Settings feature provides user account management, notification preferences, household member management, data controls, and app information. It displays the current user's profile and offers various configuration options.

## Screenshots

### Main Settings View
![Settings Main](../screenshots/settings/settings-main.png)

### Manage Household Modal
![Manage Household Modal](../screenshots/settings/settings-household-modal.png)

## Screens

### SettingsScreen

- **File**: `mobile/src/features/settings/screens/SettingsScreen.tsx`
- **Purpose**: Comprehensive settings interface with multiple sections
- **Key functionality**:
  - **Language Section**: Row showing current language (native name) and RTL-aware chevron (`getDirectionalIcon('chevron-forward')`); opens LanguageSelectorModal to change app language (persisted to AsyncStorage, applied app-wide via i18n; RTL languages may trigger app restart)
  - **Account Section**: User profile card, sign out button
  - **Notifications Section**: Push notifications toggle
  - **Household Section**: Button to manage household members
  - **Data Section**: Export data, delete account options
  - **About Section**: Terms of Service, Privacy Policy, app version

#### Code Snippet - State Management

```typescript
const { t } = useTranslation('settings');
const { user, signOut } = useAuth();
const [pushNotifications, setPushNotifications] = React.useState(true);
const [showLanguageSelector, setShowLanguageSelector] = React.useState(false);
const [showManageHousehold, setShowManageHousehold] = React.useState(false);
const currentLanguageCode = normalizeLocale(i18n.language ?? '');
const currentLanguageDisplayName = getNativeNameForCode(currentLanguageCode);
```

## Components

### ManageHouseholdModal

- **File**: `mobile/src/features/settings/components/ManageHouseholdModal/`
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
  - Uses `HouseholdContext` for state management
  - Async operations for adding/removing members

### LanguageSelectorModal

- **File**: `mobile/src/features/settings/components/LanguageSelectorModal/`
- **Purpose**: Lists available languages with native names; user selects one to change app language (persisted to AsyncStorage, applied app-wide). Shows "(Restart required)" when switching between LTR and RTL languages (Hebrew, Arabic).
- **Props**:

```typescript
interface LanguageSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  /** Normalized current language code (e.g. from normalizeLocale(i18n.language)). */
  currentLanguageCode: string;
}
```

- **Features**:
  - Scrollable list from `AVAILABLE_LANGUAGES` (i18n constants); each row shows native name and checkmark when selected
  - **RTL restart badge**: When current language direction (LTR/RTL) differs from the selected option, shows `t('restartRequired')` (e.g. "(Restart required)") via `isRtlLanguage(currentLanguageCode)` and `isRtlLanguage(entry.code)`; `showRestartBadge = currentIsRtl !== entryIsRtl`
  - On row press: calls `setAppLanguage(code)` then `onClose()`; on failure still closes modal (switching to/from RTL may trigger app restart via `Updates.reloadAsync()`)
  - Uses `CenteredModal` with `showActions={false}`; title from `t('settings:language')`
  - Row layout: `labelBlock` (column) with `nativeName` and optional `restartBadge`; checkmark on the right when selected
  - Accessibility: `accessibilityRole="button"`, `accessibilityLabel` (e.g. "Select language: English"), `accessibilityState={{ selected: true }}` for current language
  - Min row height 44pt; uses theme (colors, spacing, borderRadius, typography)

## UI Sections

### Language Section
- **Language**: Row labeled "Language" (from `t('settings:language')`) with current language’s native name (e.g. "English") and directional chevron (`getDirectionalIcon('chevron-forward')` for RTL-aware layout); opens LanguageSelectorModal on press. Display name resolved via `getNativeNameForCode(normalizeLocale(i18n.language))` with defensive fallback.

### Account Section
- **Profile Card**:
  - User avatar (Google photo or placeholder icon)
  - User name (or "User")
  - Email (if signed in)
  - Provider info ("Connected via Google")
- **Sign Out Button**: Red-bordered button with logout icon

### Notifications Section
- **Push notifications**: Toggle switch (default: on)

### Household Section
- **Manage household members**: Opens ManageHouseholdModal

### Data Section
- **Export my data**: Navigation row
- **Delete account**: Red text, navigation row

### About Section
- **Terms of Service**: Navigation row
- **Privacy Policy**: Navigation row
- **App Version**: Displays "1.0.0"

## State Management

- **AuthContext**: User data and auth functions via `useAuth()` hook
  - `user` - Current user object
  - `signOut()` - Sign out function
- **HouseholdContext**: Household members state (used in modal)
- **Local state**:
  - `pushNotifications` - Push notification toggle state
  - `showLanguageSelector` - Language selector modal visibility
  - `showManageHousehold` - Manage household modal visibility
- **Derived (i18n)**: `currentLanguageCode` = `normalizeLocale(i18n.language ?? '')`; `currentLanguageDisplayName` = `getNativeNameForCode(currentLanguageCode)` for the Language row

## Key Dependencies

- `@expo/vector-icons` - Ionicons for all icons throughout the screen
- `react-native` - Core React Native components (View, Text, ScrollView, TouchableOpacity, Switch, Image, SafeAreaView)
- `AuthContext` - User authentication state (`useAuth` hook)
- `HouseholdContext` - Household member management (`useHousehold` hook)
- `ScreenHeader` - Shared header component for consistent navigation
- `CenteredModal` - Shared modal component (used by ManageHouseholdModal, LanguageSelectorModal)
- `react-i18next` - `useTranslation('settings')` for screen title, Language section labels, and `restartRequired` (LanguageSelectorModal badge)
- `i18n` (mobile/src/i18n) - Current language and `setAppLanguage()`; `normalizeLocale()` and `getNativeNameForCode()` from localeNormalization and constants
- `isRtlLanguage` (mobile/src/i18n/rtl) - RTL language detection (Hebrew, Arabic) for LanguageSelectorModal restart badge
- `getDirectionalIcon` (mobile/src/common/utils/rtlIcons) - RTL-aware chevron/arrow icon names for Settings rows
- Theme system (`colors`, `spacing`, `borderRadius`, `typography`, `shadows`) - Centralized design tokens

## Household Members

Default members (cannot be removed):
- Mom (red indicator)
- Dad (green indicator)
- Kids (orange indicator)
- All (purple indicator)

Users can add custom household members which can be deleted.

## User Feedback
  - Shows at top of screen

- **Confirmation Modal**: Used for destructive actions
  - Guest data deletion requires confirmation
  - Shows warning message about permanent deletion
  - Red "Delete" button for emphasis
