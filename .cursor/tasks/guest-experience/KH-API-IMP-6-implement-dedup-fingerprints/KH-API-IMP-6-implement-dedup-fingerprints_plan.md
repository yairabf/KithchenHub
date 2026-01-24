# KH-API-IMP-6 - Implement dedup fingerprints (create-or-skip)

**Epic:** Guest Experience
**Task:** KH-API-IMP-6
**Created:** 2026-01-22
**Status:** Planning

## Overview
This task implements "create-or-skip" logic for the import process. Currently, we deduplicate based on the exact Guest ID matching an existing `ImportMapping`. We want to extend this to deduplicate based on "fingerprints" (content matching) to avoid creating duplicate items if the user has already manually created them or imported them via another method.

**Fingerprint Strategy:**
- **Recipes:** Match by `householdId` and `title` (case-insensitive).
- **Shopping Lists:** Match by `householdId` and `name` (case-insensitive).

## Architecture

### Components Affected
- `ImportService`: Core logic update to check fingerprints before creation.
- `ImportRepository`: New methods to lookup existing items by fingerprint.

### Files to Modify
- `backend/src/modules/import/services/import.service.ts`
- `backend/src/modules/import/repositories/import.repository.ts`
- `backend/src/modules/import/services/import.service.spec.ts`

## Implementation Steps

1.  **Repository Updates**
    - Add `findRecipeByTitle(householdId, title)`
    - Add `findShoppingListByName(householdId, name)`

2.  **Service Logic Updates**
    - In `importRecipes` and `importShoppingLists`:
        - If not mapped by ID, check fingerprint.
        - If found by fingerprint -> Create mapping to existing item, Skip creation.
        - Else -> Create new item, Create mapping.

3.  **Testing Strategy**
    - Unit tests in `import.service.spec.ts` mocking the repository lookups.
