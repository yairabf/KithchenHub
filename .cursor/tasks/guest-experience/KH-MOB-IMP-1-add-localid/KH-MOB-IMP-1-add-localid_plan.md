# KH-MOB-IMP-1 - Add localId to guest-mode entities

**Epic:** Guest Mode (guest-experience)
**Created:** 2026-01-22
**Status:** Completed

## Overview
- Ensure guest-mode data structures (Lists, Items, Recipes, Chores) include a stable UUID `localId`.
- This is essential for reliable local identification independent of server-side IDs and future sync/migration.

## Architecture
- **Components affected**: Mobile app mock data models and screens.
- **Files to modify**:
    - `mobile/src/mocks/shopping/shoppingItems.ts`
    - `mobile/src/mocks/recipes/index.ts`
    - `mobile/src/mocks/chores/index.ts`
    - `mobile/src/features/shopping/screens/ShoppingListsScreen.tsx`
    - `mobile/src/features/recipes/screens/RecipesScreen.tsx`
    - `mobile/src/features/chores/screens/ChoresScreen.tsx`
- **Dependencies required**: `expo-crypto` for UUID generation.

## Implementation Steps
1.  Update entity interfaces (`ShoppingItem`, `ShoppingList`, `Recipe`, `Chore`) to include `localId: string`.
2.  Update existing mock data to populate `localId` with valid UUIDs.
3.  Update entity creation logic in screens to generate `localId` using `Crypto.randomUUID()`.

## API Changes
- None (Client-side only changes for now).

## Testing Strategy
- **Manual Verification**:
    - Verify compilation and type safety.
    - Check that new entities (Shopping List, Item, Recipe, Chore) are created with a valid UUID `localId`.
    - Verify existing mock data load correctly.

## Success Criteria
- All guest-mode entities have a persisted `localId`.
- New entities generate a random UUID for `localId`.
