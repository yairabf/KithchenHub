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

### Project Structure (Feature-Based Architecture)

**IMPORTANT: Follow this structure for all new code.**

```
src/
├── features/           # Feature modules (MAIN CODE LIVES HERE)
│   ├── shopping/
│   │   ├── components/ # Feature-specific components
│   │   ├── screens/    # Feature screens
│   │   ├── styles/     # Feature styles
│   │   ├── hooks/      # Feature-specific hooks
│   │   └── index.ts    # Barrel export
│   ├── recipes/
│   ├── chores/
│   ├── auth/
│   ├── dashboard/
│   └── settings/
├── common/             # Shared/reusable code
│   ├── components/     # Shared components (FloatingActionButton, CenteredModal, etc.)
│   ├── hooks/          # Shared hooks
│   ├── styles/         # Shared styles
│   └── index.ts        # Barrel export
├── navigation/         # Navigator components and route types
├── contexts/           # React contexts (AuthContext, HouseholdContext)
├── services/           # External service integrations (auth)
├── theme/              # Design tokens (colors, spacing, typography)
├── data/               # Static data (groceryDatabase)
└── mocks/              # Mock data for development
```

### Feature Structure Rules

When adding new code, follow these rules:

1. **New feature?** Create a new folder under `src/features/` with this structure:
   ```
   features/[feature-name]/
   ├── components/    # Feature-specific components
   ├── screens/       # Feature screens
   ├── styles/        # Feature styles
   ├── hooks/         # Feature-specific hooks
   └── index.ts       # Barrel export
   ```

2. **New component?** Ask yourself:
   - Is it feature-specific? → `features/[feature]/components/`
   - Is it reusable across features? → `common/components/`

3. **New screen?** → Always goes in `features/[feature]/screens/`

4. **New hook?**
   - Feature-specific? → `features/[feature]/hooks/`
   - Shared? → `common/hooks/`

5. **Import paths:** Use relative imports from within features:
   ```typescript
   // From a feature screen, import feature components:
   import { MyComponent } from '../components/MyComponent';

   // Import shared components:
   import { FloatingActionButton } from '../../../common/components/FloatingActionButton';

   // Import theme:
   import { colors, spacing } from '../../../theme';
   ```

6. **Barrel exports:** Each feature should have an `index.ts` that exports its public API

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

## Backend Data Management Patterns

### Soft-Delete Pattern
User-owned entities (households, shopping lists, items, recipes, chores) support soft-delete functionality:

- **Implementation**: Entities have a `deletedAt` timestamp field (nullable)
- **Active records**: `deletedAt` is `null`
- **Deleted records**: `deletedAt` contains a timestamp

**Use the shared filter constant:**
```typescript
import { ACTIVE_RECORDS_FILTER } from '../../../infrastructure/database/filters/soft-delete.filter';

// Query active records
const recipes = await prisma.recipe.findMany({
  where: { 
    householdId,
    ...ACTIVE_RECORDS_FILTER,  // Applies deletedAt: null
  }
});
```

**When including related entities:**
```typescript
include: { 
  items: { 
    where: ACTIVE_RECORDS_FILTER,  // Filter nested relations
  } 
}
```

**When deleting entities:**
- Use repository methods like `deleteRecipe()`, `deleteList()`, etc.
- These methods log the operation and set `deletedAt`
- Example: `await repository.deleteRecipe(id)`

**Recovery (restoring deleted records):**
- Use repository restore methods: `restoreRecipe()`, `restoreList()`, `restoreChore()`, `restoreItem()`
- Example: `await repository.restoreRecipe(id)`

**Cascade Behavior:**
- Parent entity soft-deletes do NOT automatically cascade to children
- Shopping list deletion does not delete its items
- Application layer filters handle orphaned records
- This allows selective restoration and recovery workflows

### Timestamp Management
- All entities have `createdAt` and `updatedAt` timestamps
- `createdAt`: Set automatically on creation via `@default(now())`
- `updatedAt`: Maintained automatically by Prisma's `@updatedAt` directive
- Never manually set `updatedAt` - let Prisma handle it

## Key Dependencies
- `react-native-reanimated` - requires babel plugin (already configured in babel.config.js)
- `react-native-gesture-handler` - GestureHandlerRootView wraps the app
- `@react-navigation/drawer` - uses Reanimated for animations
