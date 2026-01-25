# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kitchen Hub is a **full-stack monorepo** consisting of:

- **Mobile App**: React Native app built with Expo SDK 54 for household management (shopping lists, recipes, chores)
- **Backend API**: NestJS REST API with PostgreSQL database

Both applications use TypeScript with strict mode enabled.

## Monorepo Structure

```
kitchen-hub/
├── mobile/          # React Native/Expo mobile application
├── backend/         # NestJS REST API
├── docs/            # Documentation
└── ...
```

## Commands

### Mobile App

```bash
cd mobile
npm start          # Start Expo development server
npm run ios        # Start on iOS simulator
npm run android    # Start on Android emulator
npm run web        # Start web version
npm test           # Run tests
```

### Backend API

```bash
cd backend
npm run start:dev      # Start development server
npm run build          # Build for production
npm run start:prod     # Start production server
npm test               # Run tests
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run database migrations
```

## Architecture

### Mobile App Architecture

#### Navigation Structure
The mobile app uses React Navigation with a conditional auth flow:
- `RootNavigator` checks auth state and renders either `AuthStackNavigator` (login) or `MainNavigator` (main app)
- Main app uses tab navigation with five sections: Dashboard, Shopping, Chores, Recipes, Settings
- Navigation is type-safe with TypeScript

#### State Management
- Auth state managed via `AuthContext` with `useAuth()` hook
- User data persisted to AsyncStorage under `@kitchen_hub_user`
- Supports Google sign-in and guest mode
- Network status via `NetworkContext`
- App lifecycle via `AppLifecycleContext`

#### Mobile App Project Structure (Feature-Based Architecture)

**IMPORTANT: Follow this structure for all new mobile code.**

```
mobile/src/
├── features/           # Feature modules (MAIN CODE LIVES HERE)
│   ├── shopping/
│   │   ├── components/ # Feature-specific components
│   │   ├── screens/    # Feature screens
│   │   ├── services/   # Feature services
│   │   ├── utils/      # Feature utilities
│   │   └── index.ts    # Barrel export
│   ├── recipes/
│   ├── chores/
│   ├── auth/
│   ├── dashboard/
│   └── settings/
├── common/             # Shared/reusable code
│   ├── components/     # Shared components (FloatingActionButton, CenteredModal, etc.)
│   ├── hooks/          # Shared hooks
│   ├── repositories/   # Cache-aware repositories
│   ├── storage/        # Storage utilities
│   ├── types/          # Shared types
│   └── utils/          # Shared utilities
├── navigation/         # Navigator components and route types
├── contexts/           # React contexts (AuthContext, HouseholdContext, NetworkContext, AppLifecycleContext)
├── services/           # External service integrations (API, auth, Supabase)
├── theme/              # Design tokens (colors, spacing, typography)
├── data/               # Static data (groceryDatabase)
└── mocks/              # Mock data for development
```

### Backend API Architecture

#### Module Structure
The backend follows NestJS module-based architecture:
- Each module mirrors a mobile feature (auth, households, shopping, recipes, chores, dashboard, import)
- Global JWT guard on all routes (opt-out with `@Public()` decorator)
- Household-level access control via `HouseholdGuard`
- Consistent response format via `TransformInterceptor`

#### Backend Project Structure (Module-Based Architecture)

**IMPORTANT: Follow this structure for all new backend code.**

```
backend/src/
├── main.ts                      # Bootstrap with Swagger + global pipes/filters
├── app.module.ts                # Root module with global guards/interceptors
├── common/                      # Shared code across modules
│   ├── decorators/              # Custom decorators (@CurrentUser, @Public)
│   ├── guards/                  # Auth guards (JWT, Household)
│   ├── filters/                 # Exception filters
│   ├── interceptors/            # Response transformation
│   └── utils/                   # Shared utilities
├── config/                      # Configuration management
├── infrastructure/              # Infrastructure layer
│   ├── database/                # Prisma module and schema
│   └── ...
└── modules/                     # Feature modules
    ├── auth/                    # Authentication
    ├── households/              # Household management
    ├── shopping/                # Shopping lists
    ├── recipes/                 # Recipes
    ├── chores/                  # Chores
    ├── dashboard/               # Dashboard
    ├── import/                  # Data import
    └── supabase/                # Supabase client
```

### Mobile App Feature Structure Rules

When adding new mobile code, follow these rules:

1. **New feature?** Create a new folder under `mobile/src/features/` with this structure:
   ```
   features/[feature-name]/
   ├── components/    # Feature-specific components
   ├── screens/       # Feature screens
   ├── services/      # Feature services
   ├── utils/         # Feature utilities
   ├── hooks/         # Feature-specific hooks (optional)
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

### Backend Module Structure Rules

When adding new backend code, follow these rules:

1. **New module?** Create a new folder under `backend/src/modules/` with this structure:
   ```
   modules/[feature-name]/
   ├── controllers/   # HTTP request handlers
   ├── services/       # Business logic
   ├── repositories/  # Data access layer
   ├── dtos/          # Data Transfer Objects
   └── [feature].module.ts
   ```

2. **Use NestJS CLI** to generate module structure:
   ```bash
   nest g module modules/[feature-name]
   nest g controller modules/[feature-name]
   nest g service modules/[feature-name]
   ```

3. **Register module** in `app.module.ts`

4. **Add guards** as needed:
   - `JwtAuthGuard` - JWT authentication (global, opt-out with `@Public()`)
   - `HouseholdGuard` - Household membership check

### Mobile App Type Definitions
Navigation param lists are defined in `mobile/src/navigation/types.ts`:
- `MainStackParamList` - Main navigation types

### Mobile App Theme System
Import theme values from `mobile/src/theme`:
```typescript
import { colors, spacing, typography } from '../../../theme';
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

### API Response Format

All API responses follow a consistent format via `TransformInterceptor`:

```typescript
{
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}
```

### Error Handling

Errors are transformed by `HttpExceptionFilter` into consistent error responses:

```typescript
{
  success: false;
  message: string;
  errors?: string[];
  statusCode: number;
}
```

### Public Endpoints

Mark endpoints as public using the `@Public()` decorator:

```typescript
@Post('google')
@Public()  // Opts out of global JWT guard
async authenticateGoogle(@Body() dto: GoogleAuthDto) {
  // ...
}
```

## Key Dependencies

### Mobile App
- `react-native-reanimated` - requires babel plugin (already configured in `mobile/babel.config.js`)
- `react-native-gesture-handler` - GestureHandlerRootView wraps the app
- `@react-navigation/native` - Navigation framework
- `@supabase/supabase-js` - Backend API client
- `react-native-paper` - Material Design components

### Backend API
- `@nestjs/core` - NestJS framework
- `@nestjs/platform-fastify` - Fastify adapter
- `@prisma/client` - Prisma ORM client
- `@supabase/supabase-js` - Supabase integration
- `@nestjs/swagger` - API documentation

## Documentation References

- **[Mobile README](mobile/README.md)** - Complete mobile app documentation
- **[Backend README](backend/README.md)** - Complete backend API documentation
- **[Root README](README.md)** - Monorepo overview
- **[Detailed README](README-DETAILED.md)** - Comprehensive documentation
