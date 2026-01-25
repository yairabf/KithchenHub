---
name: 003-refactor-screens-to-use-catalog-helper
overview: Refactor all screens and utilities to use the catalog helper (catalogService/useCatalog) instead of direct mockGroceriesDB access, ensuring no direct catalog API calls remain in screens or utility functions.
todos:
  - id: evaluate-ingredient-mapper
    content: Evaluate whether ingredientMapper.ts should be kept, moved to legacy, or removed
    status: pending
  - id: refactor-ingredient-mapper
    content: Refactor ingredientMapper.ts to use catalogService.getGroceryItems() with explicit async documentation and optional local cache
    status: pending
  - id: remove-unused-import
    content: Remove unused mockGroceriesDB import from RecipesScreen.tsx
    status: pending
  - id: update-tests
    content: Update or create tests for refactored ingredientMapper functions (if keeping the file)
    status: pending
  - id: smoke-test-flows
    content: Perform smoke tests for recipe ingredient search, shopping item search, offline access, and category browsing
    status: pending
isProject: false
---

# 003 - Refactor Screens to Use Catalog Helper

**Epic:** Public Catalog Guest and Signed-In

**Created:** January 25, 2026

**Status:** Planning

## Overview

Ensure all catalog access across screens and utility functions uses the shared catalog helper (`catalogService` or `useCatalog` hook) instead of direct `mockGroceriesDB` access. This completes the standardization effort by eliminating all remaining direct catalog data access points.

## Current Implementation Status

### ✅ Already Using Catalog Helper

1. **RecipesScreen** (`mobile/src/features/recipes/screens/RecipesScreen.tsx`)
   - ✅ Uses `useCatalog()` hook (line 95)
   - ✅ Passes `groceryItems` to `AddRecipeModal` (line 232)
   - ❌ **Issue:** Unused import of `mockGroceriesDB` (line 20)

2. **AddRecipeModal** (`mobile/src/features/recipes/components/AddRecipeModal/AddRecipeModal.tsx`)
   - ✅ Receives `groceryItems` as prop from parent (line 37)
   - ✅ Uses `GrocerySearchBar` with provided items (line 274)

3. **ShoppingListsScreen** (`mobile/src/features/shopping/screens/ShoppingListsScreen.tsx`)
   - ✅ Gets `groceryItems` from repository/service which uses `catalogService` (lines 134, 172)
   - ✅ Passes items to child components

4. **ShoppingQuickActionModal** (`mobile/src/features/shopping/components/ShoppingQuickActionModal/ShoppingQuickActionModal.tsx`)
   - ✅ Gets `groceryItems` from `shoppingService.getShoppingData()` which uses `catalogService` (line 42)

5. **Services & Repositories**
   - ✅ `LocalShoppingService` - Uses `catalogService.getCatalogData()` (line 30)
   - ✅ `RemoteShoppingService` - Uses `catalogService.getGroceryItems()` (line 270)
   - ✅ `CacheAwareShoppingRepository` - Uses `catalogService.getGroceryItems()` (line 182)

### ❌ Needs Refactoring

1. **ingredientMapper.ts** (`mobile/src/utils/ingredientMapper.ts`)
   - ❌ Uses `mockGroceriesDB` directly (lines 42, 52, 95, 103)
   - Functions: `getIngredientImage()`, `findGroceryItem()`
   - **Impact:** Utility functions should use catalogService for consistency
   - **Note:** Currently not used in codebase, but should be refactored for future use

2. **RecipesScreen.tsx** (`mobile/src/features/recipes/screens/RecipesScreen.tsx`)
   - ❌ Unused import of `mockGroceriesDB` (line 20)
   - **Impact:** Code cleanup - remove unused import

## Architecture

### Current Flow (Inconsistent)

```
ingredientMapper.ts
  └─> Direct mockGroceriesDB access ❌

RecipesScreen.tsx
  └─> useCatalog() hook ✅
  └─> Unused mockGroceriesDB import ❌
```

### Target Flow (Standardized)

```
All Screens/Utilities
  └─> catalogService.getGroceryItems() or useCatalog() hook
      ├─> Try API first
      ├─> Fallback to cache on NetworkError
      └─> Fallback to mock data if cache empty
```

## Implementation Steps

### Step 0: Evaluate ingredientMapper.ts Usage

**Decision Point:** Determine if `ingredientMapper.ts` should be kept or removed.

**Options:**
1. **Keep and refactor** - If there are plans to use it soon
2. **Move to legacy/pending-removal** - If it's not needed in the near future
3. **Remove entirely** - If it's truly dead code

**Action:** Check with team/product owner about future plans for ingredient image mapping functionality.

**If keeping:** Proceed with Step 1 refactoring.
**If removing:** Skip to Step 2 (remove unused import).

### Step 1: Refactor ingredientMapper.ts

**File:** `mobile/src/utils/ingredientMapper.ts`

**Changes:**
1. Import `catalogService` from `'../common/services/catalogService'`
2. Remove direct `mockGroceriesDB` import
3. Update `getIngredientImage()` to use `catalogService.getGroceryItems()`
4. Update `findGroceryItem()` to use `catalogService.getGroceryItems()`
5. Make functions async since `catalogService.getGroceryItems()` is async
6. Add explicit JSDoc comments noting async nature and await requirement
7. **Optional:** Add local cache to prevent repeated async calls (see Step 1a)
8. Update function signatures and documentation

**Before:**
```typescript
import { mockGroceriesDB } from '../data/groceryDatabase';

export function getIngredientImage(ingredientName: string): string | undefined {
  const normalizedName = ingredientName.toLowerCase().trim();
  const exactMatch = mockGroceriesDB.find(
    item => item.name.toLowerCase() === normalizedName
  );
  // ...
}
```

**After (Basic Refactoring):**
```typescript
import { catalogService } from '../common/services/catalogService';
import type { GroceryItem } from '../features/shopping/components/GrocerySearchBar';

/**
 * Maps an ingredient name to a grocery database image URL.
 * 
 * **IMPORTANT:** This function is async and must be awaited.
 * Future consumers must use: `await getIngredientImage(name)`
 * 
 * @param ingredientName - The name of the ingredient (e.g., "Chicken Breast", "Olive Oil")
 * @returns Promise resolving to the image URL from the grocery database, or undefined if not found
 * 
 * @example
 * ```typescript
 * const imageUrl = await getIngredientImage("Chicken Breast");
 * // Returns: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100'
 * ```
 */
export async function getIngredientImage(ingredientName: string): Promise<string | undefined> {
  const normalizedName = ingredientName.toLowerCase().trim();
  const groceryItems = await catalogService.getGroceryItems();
  
  const exactMatch = groceryItems.find(
    item => item.name.toLowerCase() === normalizedName
  );
  // ...
}
```

**Impact:**
- Consistent catalog access pattern
- Benefits from API → Cache → Mock fallback
- Functions become async (breaking change, but currently unused)
- Explicit documentation warns future consumers about async nature

**Note:** Since these functions are currently unused, this is a safe refactoring that prepares them for future use.

### Step 1a: Optional - Add Local Cache to ingredientMapper.ts

**File:** `mobile/src/utils/ingredientMapper.ts`

**Purpose:** Prevent repeated async calls to `catalogService.getGroceryItems()` when functions are called multiple times (e.g., in loops).

**Implementation:**
```typescript
import { catalogService } from '../common/services/catalogService';
import type { GroceryItem } from '../features/shopping/components/GrocerySearchBar';

/**
 * Local cache for grocery items to prevent repeated async calls.
 * Cached on first access and reused for subsequent function calls.
 */
let cachedItems: GroceryItem[] | null = null;

/**
 * Gets grocery items, using local cache if available.
 * This prevents repeated async calls when ingredientMapper functions
 * are called multiple times (e.g., in loops).
 * 
 * @returns Promise resolving to array of grocery items
 */
async function getItems(): Promise<GroceryItem[]> {
  if (!cachedItems) {
    cachedItems = await catalogService.getGroceryItems();
  }
  return cachedItems;
}

/**
 * Clears the local grocery items cache.
 * Useful for forcing a fresh fetch on next call.
 * 
 * @example
 * ```typescript
 * clearIngredientImageCache();
 * clearGroceryItemsCache(); // Force fresh catalog fetch
 * ```
 */
export function clearGroceryItemsCache(): void {
  cachedItems = null;
}

// Update functions to use getItems() instead of direct catalogService call
export async function getIngredientImage(ingredientName: string): Promise<string | undefined> {
  const normalizedName = ingredientName.toLowerCase().trim();
  const groceryItems = await getItems(); // Use cached helper
  
  // ... rest of implementation
}
```

**Benefits:**
- Prevents redundant async calls in performance-sensitive code
- Maintains single source of truth (catalogService)
- Cache can be cleared when needed

**When to include:**
- If ingredientMapper will be used in loops (e.g., `getIngredientsImages()`)
- If performance is a concern
- Can be added later if needed (not blocking)

**Recommendation:** Include this optimization if keeping ingredientMapper, as it's a small addition that prevents future performance issues.

### Step 2: Remove Unused Import from RecipesScreen

**File:** `mobile/src/features/recipes/screens/RecipesScreen.tsx`

**Changes:**
1. Remove unused `mockGroceriesDB` import (line 20)

**Before:**
```typescript
import { mockGroceriesDB } from '../../../data/groceryDatabase';
```

**After:**
```typescript
// Remove this line entirely
```

**Impact:**
- Code cleanup
- Removes confusion about catalog data source
- No functional changes

### Step 3: Update Tests (if needed)

**Files to Check:**
- `mobile/src/utils/__tests__/ingredientMapper.spec.ts` (if exists)
- Any tests that mock `ingredientMapper` functions

**Test Updates:**
- Mock `catalogService.getGroceryItems()` instead of `mockGroceriesDB`
- Update function calls to handle async nature
- Test fallback behavior (API → Cache → Mock)
- Test local cache behavior (if Step 1a is implemented)

**If test files don't exist:**
- Create tests following TDD approach
- Test async behavior
- Test catalogService integration
- Test local cache (if implemented)

## Files to Modify

### Mobile Files

1. **`mobile/src/utils/ingredientMapper.ts`** (if keeping the file)
   - Remove `mockGroceriesDB` import
   - Add `catalogService` import
   - Make `getIngredientImage()` async with explicit JSDoc about async nature
   - Make `findGroceryItem()` async with explicit JSDoc about async nature
   - Update `getIngredientsImages()` to handle async (or keep sync if acceptable)
   - Update all function implementations to use `catalogService.getGroceryItems()`
   - **Optional:** Add local cache pattern to prevent repeated async calls
   - Add clear documentation that functions must be awaited

2. **`mobile/src/features/recipes/screens/RecipesScreen.tsx`**
   - Remove unused `mockGroceriesDB` import (line 20)

3. **Test Files (if they exist)**
   - Update mocks for `ingredientMapper` functions
   - Update to handle async behavior
   - Test catalogService integration
   - Test local cache (if implemented)

## Success Criteria

1. ✅ No direct `mockGroceriesDB` imports in screens or utilities (except in catalogService itself)
2. ✅ `ingredientMapper.ts` uses `catalogService.getGroceryItems()` (if kept)
3. ✅ All catalog access goes through catalog helper (catalogService or useCatalog hook)
4. ✅ No unused imports remain
5. ✅ Functions properly handle async catalog access with explicit documentation
6. ✅ Local cache pattern implemented (if keeping ingredientMapper)
7. ✅ Tests updated and passing (if they exist)
8. ✅ No breaking changes to currently used code paths

## Benefits

1. **Consistency**: All catalog access follows same pattern
2. **Reliability**: All utilities benefit from API → Cache → Mock fallback
3. **Maintainability**: Single source of truth for catalog fetching
4. **Future-proof**: Utilities ready for use with proper catalog access
5. **Code Quality**: Removed unused imports
6. **Performance**: Local cache prevents redundant async calls (if implemented)

## Testing Strategy

### Unit Tests

- Mock `catalogService.getGroceryItems()` in ingredientMapper tests
- Test async behavior of refactored functions
- Test fallback behavior through catalogService mocks
- Verify cache is used when API fails
- Test local cache behavior (if implemented)

### Integration Tests

- Test ingredientMapper with real catalogService
- Test with network on/off
- Test with cache present/empty
- Verify consistent data structure
- Test local cache invalidation

### Manual Testing

1. Test ingredient search in recipes (if ingredientMapper is used)
2. Verify no regressions in existing catalog-dependent features
3. Test offline scenarios
4. Verify all screens load catalog data correctly

## Smoke Test Flows

### Flow 1: Recipe Ingredient Search
1. Open Recipes screen
2. Click "Add Recipe"
3. Search for ingredient in search bar
4. Verify results appear (from catalog helper)
5. Add ingredient to recipe
6. Verify ingredient appears in list

### Flow 2: Shopping Item Search
1. Open Shopping screen
2. Use search bar to find grocery item
3. Verify results appear (from catalog helper)
4. Add item to list
5. Verify item appears in shopping list

### Flow 3: Offline Catalog Access
1. Disable network
2. Open Recipes screen
3. Add recipe and search for ingredients
4. Verify catalog data still available (from cache/mock)
5. Open Shopping screen
6. Search for items
7. Verify catalog data still available

### Flow 4: Category Browsing
1. Open Shopping screen
2. Click on category
3. Verify category items load (from catalog helper)
4. Add item from category
5. Verify item added successfully

## Notes

- `ingredientMapper.ts` functions are currently unused, making this a safe refactoring
- **Decision needed:** Evaluate whether ingredientMapper should be kept, moved to legacy, or removed
- Breaking change: Functions become async, but since they're unused, no impact on existing code
- All screens already use catalog helper correctly
- This task focuses on utility functions and cleanup
- No backend changes needed
- **Important:** If keeping ingredientMapper, add explicit async documentation and consider local cache pattern

## Decision Points

### ingredientMapper.ts Future

**Question:** Should `ingredientMapper.ts` be kept, moved, or removed?

**Considerations:**
- Currently unused in codebase
- May be needed for future recipe ingredient image mapping
- If kept: Refactor to use catalogService (Step 1)
- If moved: Move to `mobile/src/utils/legacy/` or `mobile/src/utils/pending-removal/`
- If removed: Delete file entirely

**Recommendation:** 
- If no immediate plans: Move to `legacy/` folder with a comment explaining it's ready for use when needed
- If there are plans: Keep and refactor with local cache pattern
- If truly dead code: Remove entirely

## Future Enhancements (Out of Scope)

### ingredientMapper Usage (if kept)
If `ingredientMapper` functions are used in the future:
- Local cache pattern already included in Step 1a (prevents repeated async calls)
- Add memoization for frequently accessed ingredients
- Consider batch loading for `getIngredientsImages()` (already benefits from local cache)

### Performance Optimization
- Consider preloading catalog data on app start
- Add catalog data to app initialization
- Cache catalog data in memory for faster access
