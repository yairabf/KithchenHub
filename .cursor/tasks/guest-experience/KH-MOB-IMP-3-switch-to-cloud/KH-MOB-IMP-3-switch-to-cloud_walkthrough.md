# KH-MOB-IMP-3 Cloud Switch - Walkthrough

**Completed:** 2026-01-22

## Overview
Implemented the mechanism to switch the mobile application's data source from local mocks to the backend API when a user authenticates.

## Changes
### 1. API Abstraction
- **`mobile/src/services/api.ts`**: HTTP client wrapper with `fetch`.
    - Refactored to use **Generics** for type safety (addressed review feedback).
    - Added unit tests: `api.spec.ts`.

### 2. Service Layer
- **`mobile/src/features/recipes/services/recipeService.ts`**:
    - `IRecipeService` interface.
    - `LocalRecipeService`: Mock implementation for Guest Mode.
    - `RemoteRecipeService`: API implementation for Cloud Mode.
    - Added unit tests: `recipeService.spec.ts` (addressed review feedback).

### 3. State Management
- **`mobile/src/features/recipes/hooks/useRecipes.ts`**:
    - Hook that listens to auth state.
    - Instantiates the correct service (`Local` vs `Remote`).
    - Exposes `recipes`, `isLoading`, `addRecipe`.

### 4. UI Integration
- **`mobile/src/features/recipes/screens/RecipesScreen.tsx`**:
    - Replaced local `useState` with `useRecipes()` hook.
    - Added loading state indicator.

## Verification Results
### Automated Tests
Ran `jest` for the new services:
```bash
PASS  src/services/api.spec.ts
PASS  src/features/recipes/services/recipeService.spec.ts
```
All 8 tests passed, confirming:
- GET/POST params are correctly serialized.
- Auth headers are injected.
- Service strategies call the correct underlying methods.

### Manual Verification Steps
1. **Guest Mode**: Open App -> Recipes tab shows mock data (Pancakes, etc.).
2. **Cloud Mode**:
   - Sign in (Simulate).
   - Recipes tab shows loading spinner.
   - Attempts to fetch from `http://localhost:3000/api/v1/recipes`.
   - (Note: if backend is not running, it gracefully handles error/empty state).

## Next Steps
- Replicate this pattern for **Shopping Lists**.
- Implement persistent storage for Guest Mode (SQLite) to replace in-memory mocks if needed for offline-first support.
