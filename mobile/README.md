# Kitchen Hub Mobile 📱

React Native mobile application built with Expo SDK 54 for household management (shopping lists, recipes, chores). Cross-platform support for iOS, Android, and Web.

![iOS](https://img.shields.io/badge/iOS-supported-4CAF50) ![Android](https://img.shields.io/badge/Android-supported-4CAF50) ![Web](https://img.shields.io/badge/Web-supported-4CAF50) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue) ![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020)

## Overview

Kitchen Hub Mobile is a comprehensive household management app that helps families organize shopping lists, discover recipes, track chores, and manage household tasks. The app supports both authenticated users (with Google sign-in) and guest mode for local-only usage.

## Features

### 🛒 Shopping Lists
- Multi-list management with custom icons and colors
- 111-item grocery database organized into 9 categories
- Smart search with real-time dropdown results
- Category browsing with visual tiles
- Frequently added items grid for quick access
- Swipeable items with gesture-based deletion
- Quantity controls for items
- Two-column responsive layout

### 🍳 Recipes
- Recipe grid view with category filtering
- Recipe creation with ingredients and step-by-step instructions
- Recipe detail view with responsive layout
- Ingredient-to-shopping list integration
- Step completion tracking
- Search functionality

### ✅ Chores
- Animated progress ring showing completion percentage
- Swipeable chore cards with delete functionality
- Assignee management (Mom, Dad, Kids, All)
- Today's chores and upcoming chores sections
- Due date and time picker integration
- Responsive layout (single-column on mobile, two-column on tablet)

### 🏠 Dashboard
- Time-based personalized greeting
- Quick action widgets
- Overview statistics
- Recent activity feed
- Household summary

### 👤 Authentication
- Google sign-in with OAuth
- Guest mode for local-only usage
- Profile management
- Secure data persistence with AsyncStorage
- Auth state persistence across app restarts

### ⚙️ Settings
- Profile management
- Household member management
- Notification preferences
- Data import/export
- App preferences

## Tech Stack

### Core Framework
- **React Native**: 0.81.5 - Cross-platform mobile development
- **Expo SDK**: 54 - Development toolchain and runtime
- **TypeScript**: 5.9.2 - Static typing with strict mode enabled

### Navigation
- **React Navigation**: 7.1.26 - Routing and navigation
- **Native Stack Navigator**: 7.9.0 - Stack-based navigation
- **React Native Screens**: 4.16.0 - Native navigation optimization

### State Management & Storage
- **React Context API**: Built-in state management
- **AsyncStorage**: 2.2.0 - Persistent local storage
- **Custom Hooks**: Feature-specific and shared hooks

### UI Libraries
- **React Native Paper**: 5.14.5 - Material Design components
- **Expo Vector Icons**: 15.0.3 - Icon library
- **Lucide React**: 0.562.0 - Modern icon set
- **React Native SVG**: 15.12.1 - SVG rendering support

### Animations & Gestures
- **React Native Reanimated**: 4.1.1 - High-performance animations
- **React Native Gesture Handler**: 2.28.0 - Native gesture support
- **React Native Portal**: 1.3.0 - Modal and overlay management

### Utilities
- **DayJS**: 1.11.19 - Date manipulation and formatting
- **React Native Paper Dates**: 0.22.57 - Date picker components
- **React Native DateTimePicker**: 8.6.0 - Native date/time pickers

### Backend Integration
- **Supabase**: 2.91.0 - Backend API client
- **Expo Auth Session**: 7.0.10 - OAuth flow handling
- **Expo Web Browser**: 15.0.10 - In-app browser for auth
- **Expo Crypto**: 15.0.8 - Cryptographic utilities

### Development Tools
- **Babel Preset Expo**: 54.0.9 - Babel configuration
- **TypeScript**: 5.9.2 - Type checking
- **Jest**: 29.7.0 - Testing framework

### App Identifiers (Locked)

iOS and Android app identifiers are defined in `app.json` and **must remain consistent across all environments** to avoid App Store, Play Store, and OTA update issues.

| Platform | Config key | Canonical value |
|----------|------------|-----------------|
| iOS | `expo.ios.bundleIdentifier` | `com.kitchenhub.app` |
| Android | `expo.android.package` | `com.kitchenhub.app` |

**Do not change these values** without an explicit product/engineering decision. Changing them after release breaks store continuity and over-the-air updates. To verify identifiers locally, run `npm run verify:identifiers` from the `mobile` directory.

### OTA Updates (Over-the-Air)

The app is configured for Expo Updates so you can ship JavaScript-only changes without app store resubmissions.

| Config | Location | Purpose |
|--------|----------|---------|
| `updates.enabled` | `app.json` | Enables OTA updates |
| `updates.checkAutomatically` | `app.json` | Set to `ON_ERROR_RECOVERY` so the app starts immediately and only checks for updates after error recovery |
| `updates.fallbackToCacheTimeout` | `app.json` | Set to `0` so the app always falls back to the cached bundle if the update server is unreachable |
| `runtimeVersion` | `app.json` | Uses `appVersion` policy so the runtime version comes from the product version; native builds and OTA updates must share the same runtime version |

**Version source of truth:** The product version lives in **version.json** at the repo root. The mobile app sets **expo.version** from it via **app.config.js** (do not add a static `version` field back into `app.json`). This version is the store release version and the OTA runtime version.

**Runtime version policy (locked):** This project uses the **appVersion** policy: the runtime version is derived from `expo.version`, which is set from **version.json**. **Do not change** the runtime version policy (e.g. to `nativeVersion`, `fingerprint`, or a custom string) without an explicit product/engineering decision. Changing the policy can cause OTA updates to be applied to incompatible native builds (crashes or broken behavior). Bump **version.json** only for **store releases** and when native code or dependencies change; then publish OTA for that build. OTA publishes do not change the version—they ship JS to the existing runtime. OTA is for JS-only compatible updates.

| Config | Canonical value |
|--------|-----------------|
| `expo.runtimeVersion.policy` | `appVersion` |
| Runtime version source | `expo.version` from repo root **version.json** (bump only for store releases and native changes) |

**Update URL:** The project connects to EAS via **`eas init`** (run from the `mobile` directory after logging in with `eas login`). Once linked, `app.json` gets `extra.eas.projectId` and **`app.config.js`** derives `updates.url` from it (`https://u.expo.dev/<projectId>`), so you do not need to manually replace a placeholder. **Do not ship production builds without running `eas init`**—production builds will not receive OTA updates until the project is linked. Development mode (Expo Go, `expo start`) does not use OTA updates.

**OTA update channels:** EAS builds reference a channel so the correct OTA updates are delivered per environment:

| Channel | Environment | Build profile | Publish updates with |
|---------|-------------|---------------|------------------------|
| **develop** | Staging and testing | `preview` | `eas update --branch develop` |
| **main** | Production users | `production` | `eas update --branch main` |

After one-time channel/branch setup (see [docs/OTA_CHANNELS.md](docs/OTA_CHANNELS.md)), publish staging updates to the `develop` branch and production updates to the `main` branch. Builds from `eas build --profile preview` receive updates from channel **develop**; builds from `eas build --profile production` receive updates from channel **main**.

**Workflow:** Publish an update with `eas update` (after configuring EAS). Production builds will receive the new bundle on the next launch (or after error recovery, per `checkAutomatically`). Only JS/asset changes are delivered via OTA; native code changes require a new store build.

### Release / rollback automation

This repo includes GitHub Actions workflows to compare `main` vs deployed, and to trigger production EAS builds on-demand. See:

- `/.github/workflows/deploy-status.yml`
- `/.github/workflows/mobile-release.yml`
- `/docs/implementation/deploy-version-pipeline.md`

**Troubleshooting:**

- **Updates not applying:** Ensure the published update’s `runtimeVersion` matches the app’s `version` (from `version.json` via `app.config.js`). Run `npx expo doctor` to check config.
- **App hangs on startup:** With `fallbackToCacheTimeout: 0` and `checkAutomatically: ON_ERROR_RECOVERY`, the app should not block on the network; if it does, verify `app.json` and that you are not overriding update behavior in code.
- **Development:** OTA is off in dev; use production builds (e.g. EAS Build) to test OTA.

To verify OTA config locally (presence of `updates`, `runtimeVersion` with `appVersion` policy, version from `version.json`, no `version` in `app.json`, and that the resolved `updates.url` has no placeholder), run `npm run verify:ota` from the `mobile` directory.

### EAS Build

Build configuration lives in **`eas.json`** in the mobile directory. Two profiles are defined:

| Profile      | Distribution | Channel   | Use case |
|-------------|--------------|-----------|----------|
| **preview** | internal     | develop   | Staging and testing; shareable install links (APK on Android). Run: `eas build --profile preview` |
| **production** | store    | main      | App Store / Play Store releases. Native build numbers (Android versionCode, iOS buildNumber) auto-increment. Run: `eas build --profile production` |

The **preview** profile is the staging build profile. It uses internal distribution so builds are installable on real devices without going through the stores.

**Internal distribution (preview builds):** Preview builds are installable on real devices via shareable EAS build URLs (or QR codes from the [Expo dashboard](https://expo.dev)). **Android:** Builds are APKs; open the build page link on the device (or scan the QR code) to download and install. **iOS:** Register test devices first with `eas device:create` (each device’s UDID must be in the ad hoc provisioning profile), then run `eas build --profile preview --platform ios` and install from the build URL. See [Expo Internal distribution](https://docs.expo.dev/build/internal-distribution/) for details.

Only the **production** profile uses auto-increment for native build numbers; **preview** does not. Auto-increment prevents store submission failures from duplicate Android `versionCode` or iOS build number (see [Expo app version management](https://docs.expo.dev/build-reference/app-versions/)).

### Production build profile (store submissions)

The **production** profile is configured for App Store and Google Play submissions. It uses `distribution: "store"` and OTA channel **main**. Credentials are EAS-managed (`credentialsSource: "remote"`): on the first `eas build --profile production` (or when credentials are missing), EAS will prompt you to sign in with your Apple Developer and/or Google Play accounts and generate or reuse distribution certificates and provisioning profiles. **Android:** Production builds use `buildType: "app-bundle"` (AAB), which is required for Google Play. **iOS:** Production builds use App Store provisioning. To inspect or manage credentials, run `eas credentials` from the mobile directory. After building, submit to the stores manually from the [Expo dashboard](https://expo.dev) build page or via `eas submit` (see [EAS Submit](https://docs.expo.dev/submit/introduction/)). For more detail, see [Using automatically managed credentials](https://docs.expo.dev/app-signing/managed-credentials/) and [Production builds](https://docs.expo.dev/build/eas-json/#production-builds).

**App version source:** `cli.appVersionSource` is set to `remote` so EAS manages build numbers; the first build initializes with 1 if not set in app config. User-facing version remains in repo root **version.json** (see OTA Updates above).

**Linking the project:** Run **`eas init`** from the `mobile` directory (after `eas login`). This adds `extra.eas.projectId` to `app.json`; `app.config.js` then sets `updates.url` from it so OTA and builds work. Verify project ownership, slug (`kitchen_hub` on EAS; deep link `scheme` remains `kitchen-hub`), and linked account with **`eas project:info`** and **`eas whoami`**.

To verify EAS config locally (remote app version source; production store distribution, Android app-bundle, and auto-increment; preview internal distribution and Android APK; OTA channel names develop/main), run `npm run verify:eas` from the mobile directory.

## Fastlane (CLI releases without EAS queue)

This repo supports shipping store builds using **Fastlane** so you can release from your Mac without waiting for EAS Build queues.

### One-time setup

Install the Ruby gems from `mobile/`:

```bash
bundle install
```

The native projects must exist locally for Fastlane to build them:

```bash
npx expo prebuild
```

### Required environment variables

Set these before running any release command:

- `EXPO_PUBLIC_API_URL` (must be your production URL; do not use `localhost`)
- `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_PATH` (App Store Connect API key for iOS)
- `SUPPLY_JSON_KEY` (absolute path to the Google Play service account JSON for Android)
- `ANDROID_KEYSTORE_PATH`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` (Android upload keystore used for Play builds)

Optional:

- `FASTLANE_APPLE_ID` (convenience for some Apple flows)

You can place these in `mobile/.env`, export them in your shell, or load them via your preferred secret manager.

### Recommended release flow

Use a two-step flow per platform:

1. **Internal first**
   Build and upload a new candidate to TestFlight internal testers / Google Play internal track.
2. **Production second**
   Only after the internal build looks good:
   - iOS submits the tested TestFlight build for App Store review
   - Android promotes the tested internal build to the production track as a **draft**

### Repo-root commands

Run these from the repo root:

```bash
npm run release:ios:internal
npm run release:ios:prod
npm run release:android:internal
npm run release:android:prod
npm run release:stores:internal
npm run release:stores:prod
```

### What each command does

- `npm run release:ios:internal`
  - Sets the iOS marketing version from repo-root `version.json`
  - Increments the iOS build number from the latest TestFlight build for that version
  - Builds a new IPA locally
  - Uploads it to TestFlight and distributes it to internal testers

- `npm run release:ios:prod`
  - Does **not** rebuild
  - Finds the latest TestFlight build for the current `version.json`
  - Submits that already-tested build for App Store review
  - Leaves release timing under App Store control (`automatic_release: false`)

- `npm run release:android:internal`
  - Computes the next `versionCode` from the highest code already active on Google Play
  - Builds a new release AAB locally
  - Uploads it to the Play internal track

- `npm run release:android:prod`
  - Does **not** rebuild
  - Promotes the currently tested internal-track release to `production`
  - Creates it as a **draft**, so you can review it in Play Console before rollout

- `npm run release:stores:internal`
  - Runs iOS internal, then Android internal

- `npm run release:stores:prod`
  - Runs iOS prod, then Android prod

### Direct mobile commands

If you prefer running from `mobile/`, the equivalent commands are:

```bash
npm run release:ios:internal
npm run release:ios:prod
npm run release:android:internal
npm run release:android:prod
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18 or higher ([Download](https://nodejs.org/))
- **npm or yarn**: Package manager (comes with Node.js)
- **Expo CLI**: Install globally with `npm install -g expo-cli`

### Platform-Specific Requirements

#### iOS Development
- **macOS**: Required for iOS development
- **Xcode**: Latest version from Mac App Store
- **iOS Simulator**: Included with Xcode
- **CocoaPods**: Install with `sudo gem install cocoapods`

#### Android Development
- **Android Studio**: [Download](https://developer.android.com/studio)
- **Android SDK**: Version 33 or higher
- **Android Emulator**: Configure via Android Studio AVD Manager
- **Java Development Kit (JDK)**: Version 11 or higher

#### Testing on Physical Device
- **Expo Go App**: Available on [iOS App Store](https://apps.apple.com/app/expo-go/id982107779) and [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Quick Start

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Start Development Server

```bash
npm start
```

This will start the Expo development server and open Expo DevTools in your browser.

### 3. Run on Platform

#### Option 1: Expo Go (Easiest)
1. Install Expo Go on your iOS or Android device
2. Run `npm start`
3. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app
4. The app will load on your device

#### Option 2: iOS Simulator (macOS only)
```bash
npm run ios
```

#### Option 3: Android Emulator
```bash
npm run android
```

**Prerequisites:**
- Android Studio installed
- An Android Virtual Device (AVD) created
- Android emulator running

#### Option 4: Web Browser
```bash
npm run web
```

This will open Kitchen Hub in your default web browser at `http://localhost:8081`.

**Note**: Some native features may have limited functionality on web.

## Available Scripts

```bash
# Development
npm start              # Start Expo dev server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run web            # Run in web browser

# Testing
npm test               # Run tests with Jest

# Verification
npm run verify:identifiers   # Verify app identifiers in app.json
npm run verify:ota           # Verify OTA updates config in app.json

# Utilities
npx expo install       # Install compatible versions of packages
npx expo doctor        # Diagnose project issues
npx expo prebuild      # Generate native projects
```

## Project Structure

Kitchen Hub Mobile follows a **feature-based architecture** for better organization and scalability:

```
mobile/
├── src/
│   ├── features/                 # Feature modules (main code)
│   │   ├── shopping/             # Shopping lists feature
│   │   │   ├── components/       # Shopping-specific components
│   │   │   ├── screens/          # Shopping screens
│   │   │   ├── services/         # Shopping services
│   │   │   ├── utils/            # Shopping utilities
│   │   │   └── index.ts          # Barrel export
│   │   ├── recipes/              # Recipes feature
│   │   │   ├── components/
│   │   │   ├── screens/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   ├── chores/               # Chores feature
│   │   │   ├── components/
│   │   │   ├── screens/
│   │   │   ├── services/
│   │   │   ├── utils/
│   │   │   └── index.ts
│   │   ├── auth/                 # Authentication feature
│   │   │   ├── components/
│   │   │   └── screens/
│   │   ├── dashboard/            # Dashboard feature
│   │   │   └── screens/
│   │   └── settings/             # Settings feature
│   │       ├── components/
│   │       └── screens/
│   ├── common/                   # Shared/reusable code
│   │   ├── components/           # Shared components
│   │   │   ├── FloatingActionButton.tsx
│   │   │   ├── CenteredModal.tsx
│   │   │   ├── BottomPillNav/
│   │   │   ├── OfflineBanner.tsx
│   │   │   └── ...
│   │   ├── hooks/                # Shared hooks
│   │   │   ├── useCachedEntities.ts
│   │   │   ├── useSyncQueue.ts
│   │   │   ├── useSyncStatus.ts
│   │   │   ├── useResponsive.ts
│   │   │   └── ...
│   │   ├── repositories/         # Cache-aware repositories
│   │   ├── storage/             # Storage utilities
│   │   ├── types/               # Shared types
│   │   ├── utils/               # Shared utilities
│   │   ├── guards/              # Guardrails (guest mode)
│   │   └── index.ts              # Barrel export
│   ├── navigation/               # Navigation configuration
│   │   ├── RootNavigator.tsx     # Root navigation logic
│   │   ├── MainNavigator.tsx     # Main app navigation
│   │   ├── MainTabsScreen.tsx    # Tab-based navigation
│   │   ├── AuthStackNavigator.tsx
│   │   └── types.ts              # Navigation types
│   ├── contexts/                 # React contexts
│   │   ├── AuthContext.tsx       # Authentication state
│   │   ├── HouseholdContext.tsx # Household data
│   │   ├── NetworkContext.tsx    # Network status
│   │   └── AppLifecycleContext.tsx # App lifecycle
│   ├── services/                 # External service integrations
│   │   ├── api.ts                # API client
│   │   ├── auth.ts               # Auth service
│   │   ├── supabase.ts           # Supabase client
│   │   ├── imageUploadService.ts # Image upload
│   │   └── import/               # Data import service
│   ├── theme/                    # Design system tokens
│   │   ├── colors.ts             # Color palette
│   │   ├── spacing.ts            # Spacing scale
│   │   ├── typography.ts         # Typography styles
│   │   └── shadows.ts            # Shadow styles
│   ├── data/                     # Static data
│   │   └── groceryDatabase.ts   # 111-item grocery database
│   ├── mocks/                    # Mock data for development
│   │   ├── shopping/
│   │   ├── recipes/
│   │   └── chores/
│   ├── config/                   # Configuration
│   │   └── index.ts              # App configuration
│   └── hooks/                    # Root-level hooks (if any)
├── assets/                       # Static assets
│   ├── icon.png                  # App icon
│   ├── splash-icon.png           # Splash screen
│   ├── adaptive-icon.png         # Android adaptive icon
│   └── favicon.png               # Web favicon
├── app.json                      # Expo configuration
├── babel.config.js               # Babel configuration
├── package.json                   # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── jest.config.js                # Jest configuration
└── index.ts                      # Entry point
```

## Architecture

### Feature-Based Organization

Kitchen Hub Mobile uses a **feature-based architecture** rather than a traditional layers architecture. Each feature is a self-contained module with its own:

- **Components**: UI components specific to the feature
- **Screens**: Top-level screen components
- **Services**: Business logic and API integration
- **Utils**: Feature-specific utilities
- **Hooks**: Custom React hooks for feature logic
- **Barrel Exports**: `index.ts` files for clean imports

#### Benefits of Feature-Based Architecture

1. **Scalability**: Easy to add new features without affecting existing ones
2. **Maintainability**: All related code is co-located
3. **Team Collaboration**: Multiple developers can work on different features simultaneously
4. **Code Discovery**: Clear where to find feature-specific code
5. **Testability**: Features can be tested in isolation

### Navigation Structure

```
RootNavigator (AuthContext check)
├── AuthStackNavigator (if not authenticated)
│   └── LoginScreen
└── MainNavigator (if authenticated)
    └── MainTabsScreen
        ├── Dashboard
        ├── Shopping
        ├── Chores
        ├── Recipes
        └── Settings
```

**Key Navigation Concepts:**

- **Conditional Auth Flow**: `RootNavigator` checks authentication state and renders appropriate navigator
- **Tab Navigation**: Main app uses bottom tab navigation with 5 sections
- **Type-Safe Routes**: Navigation params are fully typed with TypeScript

### State Management

Kitchen Hub Mobile uses **React Context API** for state management:

#### AuthContext
- Manages authentication state (logged in, guest, signed out)
- Provides user information (name, email, profile)
- Handles Google OAuth flow
- Persists auth state to AsyncStorage

#### HouseholdContext
- Manages household members
- Provides household-wide settings
- Shares data across features

#### NetworkContext
- Monitors network connectivity
- Provides online/offline status
- Triggers sync when network comes back online

#### AppLifecycleContext
- Tracks app state (foreground/background)
- Triggers sync when app comes to foreground

#### Local Component State
- Feature-specific state managed with `useState` and `useReducer`
- Custom hooks encapsulate complex state logic

### Data Persistence

- **AsyncStorage**: User preferences, auth tokens, and cached data
- **Storage Keys**: Prefixed with `@kitchen_hub_` for namespace isolation
- **Persistence Strategy**: Critical data (auth state) persisted on change
- **Cache-Aware Repositories**: Handle local caching and sync with backend

### Data Modes

The app supports multiple data modes:

- **Guest Mode**: Local-only storage, no backend sync
- **Signed-In Mode**: Full backend sync with offline support
- **Offline Mode**: Automatic caching and sync queue when offline

### Component Patterns

#### Shared Components (common/components/)
Reusable across multiple features:
- `FloatingActionButton`: Circular action button with icon
- `CenteredModal`: Full-screen centered modal wrapper
- `BottomPillNav`: Bottom tab navigation
- `OfflineBanner`: Network status indicator
- `GrocerySearchBar`: Intelligent grocery search

#### Feature Components (features/[feature]/components/)
Specific to a single feature:
- `ShoppingListPanel`: Shopping list display
- `RecipeCard`: Recipe grid item
- `ChoreCard`: Swipeable chore task card
- `ProgressRing`: Animated progress indicator

### Theme System

Centralized design tokens in `src/theme/`:

```typescript
// src/theme/colors.ts
export const colors = {
  primary: '#234C6A',      // Brand blue
  shopping: '#234C6A',     // Shopping accent
  recipes: '#456882',      // Recipes accent
  chores: '#1B3C53',       // Chores accent
  // ... more colors
};

// src/theme/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// src/theme/typography.ts
export const typography = {
  h1: { fontSize: 32, fontWeight: 'bold' },
  h2: { fontSize: 24, fontWeight: 'bold' },
  body: { fontSize: 16, fontWeight: 'normal' },
  // ... more styles
};
```

**Usage:**
```typescript
import { colors, spacing, typography } from '../../../theme';

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
  },
});
```

## Development Guidelines

### Code Organization Principles

Follow these rules when adding new code:

#### 1. Creating a New Feature

```bash
src/features/[feature-name]/
├── components/    # Feature-specific components
├── screens/       # Feature screens
├── services/      # Feature services
├── utils/         # Feature utilities
├── hooks/         # Feature-specific hooks (optional)
└── index.ts       # Barrel export
```

#### 2. Deciding Component Location

**Ask yourself: Is it reusable across features?**
- **Yes** → `src/common/components/`
- **No** → `src/features/[feature]/components/`

#### 3. Adding Screens

All screens go in `src/features/[feature]/screens/`

#### 4. Custom Hooks

- **Feature-specific** → `src/features/[feature]/hooks/`
- **Shared** → `src/common/hooks/`

#### 5. Import Path Conventions

```typescript
// From a feature screen, import feature components:
import { ShoppingListCard } from '../components/ShoppingListCard';

// Import shared components:
import { FloatingActionButton } from '../../../common/components/FloatingActionButton';

// Import theme:
import { colors, spacing } from '../../../theme';

// Import navigation types:
import { MainStackParamList } from '../../../navigation/types';
```

#### 6. Barrel Exports

Each feature should export its public API:

```typescript
// src/features/shopping/index.ts
export { ShoppingListsScreen } from './screens/ShoppingListsScreen';
export { ShoppingListPanel } from './components/ShoppingListPanel';
```

### TypeScript Configuration

Kitchen Hub Mobile uses **TypeScript strict mode** for maximum type safety:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noImplicitThis": true
  }
}
```

**Benefits:**
- Catch errors at compile time
- Better IDE autocomplete
- Safer refactoring
- Improved code documentation

### Testing

The app uses Jest for testing:

```bash
npm test               # Run all tests
npm test -- --watch    # Watch mode
npm test -- --coverage # Coverage report
```

Test files should be co-located with the code they test:
- `Component.test.tsx` next to `Component.tsx`
- `service.spec.ts` next to `service.ts`

## Backend Integration

The mobile app communicates with the Kitchen Hub Backend API:

- **Base URL**: Configured in `src/config/index.ts`
- **Authentication**: JWT tokens stored in AsyncStorage
- **Sync**: Automatic sync queue when online
- **Offline Support**: Local caching with sync on reconnect

See [Backend README](../backend/README.md) for API documentation.

## Troubleshooting

### Metro Bundler Won't Start

**Problem**: Metro bundler fails to start or shows port conflict

**Solution**:
```bash
# Kill existing Metro process
npx react-native start --reset-cache

# Or manually kill the process
lsof -ti:8081 | xargs kill

# Restart
npm start
```

### iOS Simulator Not Starting

**Problem**: `npm run ios` fails or simulator doesn't appear

**Solution**:
```bash
# Reset Expo cache
npx expo start -c

# Ensure Xcode is installed and simulators are available
xcodebuild -version
xcrun simctl list devices

# Try opening simulator first, then run
open -a Simulator
npm run ios
```

### Android Build Errors

**Problem**: Android build fails with Gradle or SDK errors

**Solution**:
```bash
# Clean Android build
cd android
./gradlew clean
cd ..

# Ensure ANDROID_HOME is set
echo $ANDROID_HOME

# Reinstall dependencies
rm -rf node_modules
npm install
npm run android
```

### Reanimated Plugin Not Working

**Problem**: Animations don't work or build fails with reanimated errors

**Solution**:
1. Ensure `react-native-reanimated/plugin` is last in `babel.config.js`
2. Clear Metro cache: `npx expo start -c`
3. Reinstall: `npx expo install react-native-reanimated`

### TypeScript Errors

**Problem**: Type errors in IDE or during build

**Solution**:
```bash
# Regenerate TypeScript types
npx expo customize tsconfig.json

# Check for errors
npx tsc --noEmit

# Restart TypeScript server in VSCode
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

## Documentation

- **[Root README](../README.md)** - Monorepo overview
- **[Backend API](../backend/README.md)** - Backend documentation
- **[Detailed Docs](../README-DETAILED.md)** - Comprehensive project documentation
- **[CLAUDE.md](../CLAUDE.md)** - AI assistant development guidance

## License

Private repository - All rights reserved.

---

Built with ❤️ using React Native and Expo
