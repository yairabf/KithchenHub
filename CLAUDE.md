# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kitchen Hub is a React Native app built with Expo SDK 54 for household management (shopping lists, recipes, chores). It uses TypeScript with strict mode enabled.

## Commands

```bash
npm start          # Start Expo development server
npm run ios        # Start on iOS simulator
npm run android    # Start on Android emulator
npm run web        # Start web version
```

## Architecture

### Navigation Structure
The app uses React Navigation with a conditional auth flow:
- `RootNavigator` checks auth state and renders either `AuthStackNavigator` (login) or `DrawerNavigator` (main app)
- Main app uses drawer navigation with four sections: Shopping, Recipes, Chores, Settings
- Shopping section has its own stack navigator (`ShoppingStackNavigator`) for list → single list navigation

### State Management
- Auth state managed via `AuthContext` with `useAuth()` hook
- User data persisted to AsyncStorage under `@kitchen_hub_user`
- Supports Google sign-in and guest mode

### Project Structure
```
src/
├── contexts/       # React contexts (AuthContext)
├── navigation/     # Navigator components and route types
├── screens/        # Screen components organized by feature
├── components/     # Reusable components (common/)
├── services/       # External service integrations (auth)
└── theme/          # Design tokens (colors, spacing, typography)
```

### Type Definitions
Navigation param lists are defined in their respective navigator files:
- `DrawerParamList` in DrawerNavigator.tsx
- `ShoppingStackParamList` in ShoppingStackNavigator.tsx

### Theme System
Import theme values from `src/theme`:
```typescript
import { colors, spacing, typography } from '../theme';
```
Primary brand color is `#FF6B35` (warm orange). Each section has an accent color (shopping: green, recipes: orange, chores: purple).

## Key Dependencies
- `react-native-reanimated` - requires babel plugin (already configured in babel.config.js)
- `react-native-gesture-handler` - GestureHandlerRootView wraps the app
- `@react-navigation/drawer` - uses Reanimated for animations
