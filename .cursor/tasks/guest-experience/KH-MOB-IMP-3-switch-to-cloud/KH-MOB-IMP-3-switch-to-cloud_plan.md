# KH-MOB-IMP-3 - Switch to cloud mode after import

**Epic:** Guest Experience
**Created:** 2026-01-22
**Status:** Planning

## Overview
After a successful import of guest data, the mobile application needs to switch its data source from local storage (Guest Mode) to the backend server (Cloud Mode). This task involves abstracting the data access layer to support both modes and implementing the switch logic based on the user's authentication state.

## Architecture
- **API Client:** Create a basic API client (`src/services/api.ts`) to handle HTTP requests to the backend.
- **Data Abstraction:**
  - Create `RecipeService` (or `useRecipes` hook) that toggles between `LocalRecipeSource` and `RemoteRecipeSource`.
  - Update `HouseholdContext` to fetch members from the API when in Cloud Mode.
- **State Management:**
  - Utilize `AuthContext` to detect `isGuest` status.
  - When `isGuest` changes to `false` (after login/import), the data sources should automatically switch to the API.

## Implementation Steps
1.  **Setup API Client:**
    - Create `src/services/api.ts` with `fetch` wrapper.
    - Add base URL configuration (e.g., from env or constant).

2.  **Refactor Recipe Feature:**
    - Create `src/features/recipes/services/recipeService.ts` defining an interface for recipe operations.
    - Implement `LocalRecipeService` (using existing mocks/AsyncStorage).
    - Implement `RemoteRecipeService` (using `api.ts`).
    - Create `useRecipes` hook that selects the service based on `AuthContext`.
    - Update `RecipesScreen` to use `useRecipes`.

3.  **Update Household Context:**
    - Modify `HouseholdContext` to fetch members from API if `user` is authenticated and not guest.

4.  **Verify Switch:**
    - Test that `RecipesScreen` shows mock data in Guest Mode.
    - Test that `RecipesScreen` attempts to call API in Cloud Mode (even if API is not fully reachable, the switch mechanism is verified).

## API Changes
- None (Client-side only task).

## Testing Strategy
- **Manual Verification:**
  - Start app in Guest Mode -> Check Recipes.
  - Sign in (Simulated) -> Check that app tries to fetch from API.
