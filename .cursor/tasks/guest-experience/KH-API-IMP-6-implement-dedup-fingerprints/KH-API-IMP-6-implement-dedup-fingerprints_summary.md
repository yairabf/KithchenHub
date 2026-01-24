# KH-API-IMP-6 - Implement dedup fingerprints (create-or-skip) - Implementation Summary

**Epic:** Guest Experience
**Completed:** 2026-01-22
**Status:** Completed

## What Was Implemented
- **ImportRepository**: Added `findRecipeByFingerprint` and `findShoppingListByFingerprint` methods to look up existing items by title/name within a household (case-insensitive).
- **ImportService**: Updated `importRecipes` and `importShoppingLists` to check for "fingerprint" matches before creating new items.
  - If a match is found: The mapping is created linking the Guest ID to the *existing* Server ID, and the item creation is skipped.
  - If no match is found: The item is created as usual.
- **Schema Updates**: Added composite indexes `@@index([householdId, title])` on `Recipe` and `@@index([householdId, name])` on `ShoppingList` to optimize fingerprint lookups.
- **Tests**: Added unit tests to verify both "create" and "skip" paths for recipes and shopping lists.

## Deviations from Plan
- Added database indexes during code review to ensure performance scalability.

## Testing Results
- **Unit Tests**: All tests passed, including new fingerprint deduplication scenarios.
  ```bash
  PASS  src/modules/import/services/import.service.spec.ts
  ...
  fingerprint deduplication
    ✓ should skip creation and map to existing recipe if title matches (fingerprint match) (1 ms)
    ✓ should create new recipe if no fingerprint match found (2 ms)
    ✓ should skip creation and map to existing list if name matches (fingerprint match) (2 ms)
  ```

## Next Steps
- Run `prisma migrate dev` to apply the new indexes to the database.
- Implement idempotency logic ( KH-API-IMP-5).
- Add support for Chores when they are added to the Import scope.
