# 003 - Dev-Only Seeding for LocalRecipeService

**Epic:** Guest Mode – Local Persistence  
**Created:** 2026-01-25  
**Status:** Planning

## Overview

Add dev-only seed-on-empty logic to `LocalRecipeService` to automatically populate guest storage with mock recipes when storage is empty. This ensures developers have sample data for testing while maintaining the requirement that recipes persist across restarts and no remote calls occur in guest mode.

### Problem Statement

**Wired to storage ✅**
- `getRecipes()` reads from `guestStorage.getRecipes()`
- `createRecipe()`, `updateRecipe()`, `deleteRecipe()` all persist via `guestStorage.saveRecipes()`
- No remote API calls in guest mode
- Recipes persist across app restarts

**Missing: dev-only seed-on-empty ❌**
- No automatic seeding when storage is empty
- Developers must manually create recipes for testing
- No sample data available on first app launch in dev mode

### User Story

As a developer, I want guest recipe storage to automatically seed with mock recipes when empty (dev-only) so that:
- I have sample data for testing without manual setup
- The seeding only happens in development mode
- Production/end users start with empty storage
- Recipes persist across app restarts

## Current State Analysis

### What's Already Implemented

#### 1. Guest Storage Infrastructure
- **File**: `mobile/src/common/utils/guestStorage.ts`
  - `getRecipes()`: Reads recipes from AsyncStorage (returns empty array if none exist)
  - `saveRecipes(recipes)`: Persists recipes to AsyncStorage
  - Uses envelope format with versioning support
  - Handles timestamp normalization automatically
  - **Important**: Returns ALL recipes including soft-deleted ones (no filtering)

#### 2. Recipe Service Implementation
- **File**: `mobile/src/features/recipes/services/recipeService.ts`
  - `LocalRecipeService` class fully implemented:
    - `getRecipes()`: Calls `guestStorage.getRecipes()` ✅
    - `createRecipe()`: Reads existing, appends new, saves via `guestStorage.saveRecipes()` ✅
    - `updateRecipe()`: Reads existing, updates, saves via `guestStorage.saveRecipes()` ✅
    - `deleteRecipe()`: Reads existing, soft-deletes, saves via `guestStorage.saveRecipes()` ✅
  - No remote API calls in `LocalRecipeService` ✅
  - Retry logic for concurrent writes (3 retries with 10ms delay)

#### 3. Mock Recipe Data
- **File**: `mobile/src/mocks/recipes/index.ts`
  - `mockRecipes`: Array of 6 sample recipes (Pancakes, Pasta Carbonara, Caesar Salad, Tomato Soup, Grilled Chicken, French Toast)
  - All recipes have required fields: `id`, `localId`, `name`, `cookTime`, `category`, `ingredients`, `instructions`
  - Recipes extend `BaseEntity` with proper metadata
  - May or may not include `createdAt` timestamps (safe to use `withCreatedAt()`)

#### 4. Timestamp Helper
- **File**: `mobile/src/common/utils/timestamps.ts`
  - `withCreatedAt()`: Auto-populates `createdAt` if missing
  - **Does NOT overwrite existing `createdAt`** (confirmed in implementation)
  - Safe to use on mock recipes that may already have timestamps

#### 5. Service Factory
- **File**: `mobile/src/features/recipes/services/recipeService.ts`
  - `createRecipeService(mode)`: Returns `LocalRecipeService` for 'guest' mode
  - Mode validation via `validateServiceCompatibility()`

#### 6. Hook Integration
- **File**: `mobile/src/features/recipes/hooks/useRecipes.ts`
  - Uses `createRecipeService(userMode)` to get appropriate service
  - Calls `service.getRecipes()` on mount
  - Handles loading and error states

### What's Missing

1. **Dev-Only Seed-on-Empty Logic**
   - No automatic seeding when storage is empty
   - Developers must manually create recipes for testing
   - No sample data available on first app launch in dev mode

2. **Development Mode Detection**
   - Need to detect dev mode (React Native `__DEV__` constant)
   - Seeding should only occur in development, never in production

## Architecture

### Component Structure

```
mobile/src/features/recipes/services/
└── recipeService.ts (modify - add seeding logic to LocalRecipeService.getRecipes())

mobile/src/mocks/recipes/
└── index.ts (already exists - provides mockRecipes)
```

### Key Design Decisions

1. **Seeding Location**: Add seeding logic to `LocalRecipeService.getRecipes()` method
   - Checks if recipes array is empty (truly empty - no records at all, including soft-deleted)
   - Only seeds in development mode
   - Seeds once per empty storage (idempotent)

2. **Development Mode Detection**: Use wrapper function for `__DEV__`
   - Create `isDevMode()` helper function that returns `__DEV__`
   - Wrapper can be easily mocked in tests
   - Avoids direct mocking of global `__DEV__` which can be tricky in Jest

3. **Seeding Strategy**: Seed-on-empty (not seed-on-every-read)
   - Check if `recipes.length === 0` after reading from storage
   - **Critical**: This checks total stored records (including soft-deleted)
   - If user soft-deletes all recipes, storage still contains tombstones → `recipes.length > 0` → no re-seeding
   - Only seeds when storage is truly empty (no records at all)
   - If empty and in dev mode, seed with `mockRecipes`
   - Save seeded recipes to storage immediately
   - Subsequent reads will return seeded recipes (no re-seeding)

4. **Idempotency**: Seeding is idempotent
   - Only seeds when storage is truly empty (no records, including soft-deleted)
   - If user deletes all recipes (soft-delete), storage contains tombstones → `recipes.length > 0` → no re-seeding
   - If storage has any records (even soft-deleted), no seeding occurs
   - Respects user actions (won't re-seed after user deletes all recipes)

5. **Timestamp Handling**: Use `withCreatedAt()` helper for seeded recipes
   - `withCreatedAt()` does NOT overwrite existing timestamps (confirmed in implementation)
   - Safe to use on mock recipes that may already have `createdAt`
   - Ensures all seeded recipes have proper `createdAt` timestamps
   - Maintains consistency with manually created recipes

## Implementation Steps

### Step 1: Create Development Mode Helper

**File**: `mobile/src/features/recipes/services/recipeService.ts`

**Changes**:

1. **Add development mode helper function** (before class definitions):
   ```typescript
   /**
    * Determines if the app is running in development mode.
    * Wrapper around __DEV__ for testability.
    * 
    * @returns True if in development mode, false otherwise
    */
   function isDevMode(): boolean {
     return typeof __DEV__ !== 'undefined' && __DEV__ === true;
   }
   ```

### Step 2: Add Dev-Only Seed-on-Empty Logic to LocalRecipeService

**File**: `mobile/src/features/recipes/services/recipeService.ts`

**Changes**:

1. **Import mock recipes and timestamp helper**:
   ```typescript
   import { mockRecipes } from '../../../mocks/recipes';
   import { withCreatedAt } from '../../../common/utils/timestamps';
   ```

2. **Modify `LocalRecipeService.getRecipes()` method**:
   ```typescript
   async getRecipes(): Promise<Recipe[]> {
       // Read from real guest storage, return empty array if no data exists
       let guestRecipes = await guestStorage.getRecipes();
       
       // Dev-only: Seed with mock recipes if storage is truly empty
       // Note: guestStorage.getRecipes() returns ALL recipes including soft-deleted
       // So recipes.length === 0 means storage is truly empty (no records at all)
       if (isDevMode() && guestRecipes.length === 0) {
           // Ensure all mock recipes have createdAt timestamps
           // withCreatedAt() is safe - it won't overwrite existing timestamps
           const seededRecipes = mockRecipes.map(recipe => 
               withCreatedAt(recipe)
           );
           
           // Save seeded recipes to storage
           await guestStorage.saveRecipes(seededRecipes);
           
           // Return seeded recipes
           return seededRecipes;
       }
       
       return guestRecipes;
   }
   ```

**Implementation Details**:
- Use `isDevMode()` helper (wrapper around `__DEV__`) for testability
- Only seed when `guestRecipes.length === 0` (truly empty storage - no records at all)
- **Critical**: `guestStorage.getRecipes()` returns ALL recipes including soft-deleted ones
- If user soft-deletes all recipes, storage still contains tombstones → `recipes.length > 0` → no re-seeding
- Map `mockRecipes` through `withCreatedAt()` to ensure proper timestamps (safe - won't overwrite existing)
- Save seeded recipes immediately to storage
- Return seeded recipes for this call
- Subsequent calls will read seeded recipes from storage (no re-seeding)

### Step 3: Update Tests

**File**: `mobile/src/features/recipes/services/recipeService.spec.ts`

**Changes**:

1. **Mock the `isDevMode` function** (instead of `__DEV__`):
   ```typescript
   // Mock the isDevMode function
   jest.mock('./recipeService', () => {
     const actual = jest.requireActual('./recipeService');
     return {
       ...actual,
       // We'll need to export isDevMode or mock it differently
       // Better approach: create a separate devMode module
     };
   });
   ```

   **Better approach**: Create a separate dev mode utility that can be easily mocked:
   
   **New file**: `mobile/src/common/utils/devMode.ts`
   ```typescript
   /**
    * Development mode detection utility.
    * Separated for easy mocking in tests.
    */
   export function isDevMode(): boolean {
     return typeof __DEV__ !== 'undefined' && __DEV__ === true;
   }
   ```

   Then in `recipeService.ts`:
   ```typescript
   import { isDevMode } from '../../../common/utils/devMode';
   ```

2. **Add test cases for seeding logic**:
   ```typescript
   // Mock devMode utility
   jest.mock('../../../common/utils/devMode', () => ({
     isDevMode: jest.fn(),
   }));
   
   import { isDevMode } from '../../../common/utils/devMode';
   
   describe('LocalRecipeService - Dev Seeding', () => {
       beforeEach(() => {
           service = new LocalRecipeService();
           jest.clearAllMocks();
       });
       
       it('seeds mock recipes when storage is empty in dev mode', async () => {
           (isDevMode as jest.Mock).mockReturnValue(true);
           (guestStorage.getRecipes as jest.Mock).mockResolvedValue([]);
           
           const recipes = await service.getRecipes();
           
           expect(recipes).toHaveLength(mockRecipes.length);
           expect(guestStorage.saveRecipes).toHaveBeenCalledWith(
               expect.arrayContaining([
                   expect.objectContaining({ name: 'Pancakes' }),
                   expect.objectContaining({ name: 'Pasta Carbonara' }),
               ])
           );
           // Verify all seeded recipes have createdAt
           recipes.forEach(recipe => {
               expect(recipe.createdAt).toBeInstanceOf(Date);
           });
       });
       
       it('does not seed when storage has existing recipes in dev mode', async () => {
           (isDevMode as jest.Mock).mockReturnValue(true);
           const existingRecipes = [{ id: '1', localId: 'uuid-1', name: 'Existing', cookTime: '30 min', category: 'Dinner', ingredients: [], instructions: [] }];
           (guestStorage.getRecipes as jest.Mock).mockResolvedValue(existingRecipes);
           
           const recipes = await service.getRecipes();
           
           expect(recipes).toEqual(existingRecipes);
           expect(guestStorage.saveRecipes).not.toHaveBeenCalled();
       });
       
       it('does not seed when storage has soft-deleted recipes in dev mode', async () => {
           (isDevMode as jest.Mock).mockReturnValue(true);
           // Storage contains soft-deleted recipes (tombstones)
           const deletedRecipes = [{ 
               id: '1', 
               localId: 'uuid-1', 
               name: 'Deleted Recipe', 
               cookTime: '30 min', 
               category: 'Dinner', 
               ingredients: [], 
               instructions: [],
               deletedAt: new Date() // Soft-deleted
           }];
           (guestStorage.getRecipes as jest.Mock).mockResolvedValue(deletedRecipes);
           
           const recipes = await service.getRecipes();
           
           expect(recipes).toEqual(deletedRecipes);
           expect(guestStorage.saveRecipes).not.toHaveBeenCalled();
       });
       
       it('does not seed in production mode even when storage is empty', async () => {
           (isDevMode as jest.Mock).mockReturnValue(false);
           (guestStorage.getRecipes as jest.Mock).mockResolvedValue([]);
           
           const recipes = await service.getRecipes();
           
           expect(recipes).toEqual([]);
           expect(guestStorage.saveRecipes).not.toHaveBeenCalled();
       });
       
       it('preserves existing timestamps in mock recipes when seeding', async () => {
           (isDevMode as jest.Mock).mockReturnValue(true);
           (guestStorage.getRecipes as jest.Mock).mockResolvedValue([]);
           
           // Mock recipe with existing createdAt
           const mockRecipeWithTimestamp = {
               ...mockRecipes[0],
               createdAt: new Date('2026-01-01T00:00:00.000Z'),
           };
           const mockRecipesWithTimestamps = [mockRecipeWithTimestamp, ...mockRecipes.slice(1)];
           
           // Temporarily replace mockRecipes for this test
           jest.spyOn(require('../../../mocks/recipes'), 'mockRecipes', 'get').mockReturnValue(mockRecipesWithTimestamps);
           
           const recipes = await service.getRecipes();
           
           // Verify first recipe kept its original timestamp
           expect(recipes[0].createdAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));
           // Other recipes should have new timestamps
           expect(recipes[1].createdAt).toBeInstanceOf(Date);
       });
   });
   ```

**Test Coverage**:
- ✅ Seeds when empty in dev mode
- ✅ Does not seed when storage has recipes (even in dev mode)
- ✅ Does not seed when storage has soft-deleted recipes (tombstones) - critical edge case
- ✅ Does not seed in production mode (even when empty)
- ✅ Seeded recipes have proper timestamps
- ✅ Preserves existing timestamps in mock recipes (withCreatedAt doesn't overwrite)
- ✅ Seeding is idempotent (only seeds once when empty)

## API Changes

### No Public API Changes

The public API of `LocalRecipeService` remains unchanged:
- `getRecipes()`: Still returns `Promise<Recipe[]>`
- Behavior change is internal (automatic seeding in dev mode)
- No breaking changes to existing code

### New Internal Utility

- **File**: `mobile/src/common/utils/devMode.ts` (new)
  - `isDevMode()`: Returns `__DEV__` value (wrapper for testability)

## Testing Strategy

### Unit Tests

1. **Seeding Logic Tests** (`recipeService.spec.ts`):
   - ✅ Seeds mock recipes when storage is empty in dev mode
   - ✅ Does not seed when storage has existing recipes (even in dev mode)
   - ✅ Does not seed when storage has soft-deleted recipes (tombstones) - **critical edge case**
   - ✅ Does not seed in production mode (even when empty)
   - ✅ Seeded recipes have proper `createdAt` timestamps
   - ✅ Preserves existing timestamps in mock recipes (withCreatedAt doesn't overwrite)
   - ✅ Seeding is idempotent (only seeds once when empty)

2. **Integration Tests**:
   - ✅ Verify seeded recipes persist across app restarts
   - ✅ Verify seeded recipes appear in UI
   - ✅ Verify user-created recipes work alongside seeded recipes

### Manual Testing

1. **Development Mode**:
   - Clear app data (or use fresh install)
   - Launch app in guest mode
   - Navigate to Recipes screen
   - Verify 6 mock recipes appear automatically
   - Close and reopen app
   - Verify recipes persist (still 6 recipes)

2. **Production Mode**:
   - Build production bundle (`__DEV__ = false`)
   - Clear app data
   - Launch app in guest mode
   - Navigate to Recipes screen
   - Verify empty state (no recipes)
   - Create a recipe manually
   - Verify recipe persists across restart

3. **Edge Cases**:
   - Delete all seeded recipes (soft-delete)
   - Verify recipes don't re-seed (storage contains tombstones → `recipes.length > 0`)
   - Create new recipe after seeding
   - Verify both seeded and user-created recipes coexist

## Success Criteria

- ✅ Recipes persist across app restarts (already working)
- ✅ No remote calls in guest mode (already working)
- ✅ Dev-only seed-on-empty logic implemented
- ✅ Mock recipes automatically populate storage when empty in dev mode
- ✅ Seeding only occurs in development (`isDevMode() === true`)
- ✅ Seeding is idempotent (only seeds when storage is truly empty - no records at all)
- ✅ Seeding respects user actions (won't re-seed after soft-deleting all recipes)
- ✅ Seeded recipes have proper timestamps (`createdAt`)
- ✅ Existing timestamps in mock recipes are preserved (withCreatedAt doesn't overwrite)
- ✅ All tests pass (existing + new seeding tests)
- ✅ Production builds do not seed (verified manually)

## Files to Create

1. `mobile/src/common/utils/devMode.ts` - Development mode detection utility (for testability)

## Files to Modify

1. `mobile/src/features/recipes/services/recipeService.ts`
   - Add imports: `mockRecipes`, `withCreatedAt`, `isDevMode`
   - Modify `LocalRecipeService.getRecipes()` to add seeding logic

2. `mobile/src/features/recipes/services/recipeService.spec.ts`
   - Add test cases for dev-only seeding logic
   - Mock `isDevMode` utility for testing

## Dependencies

- ✅ `mobile/src/mocks/recipes/index.ts` - Already exists (provides `mockRecipes`)
- ✅ `mobile/src/common/utils/timestamps.ts` - Already exists (provides `withCreatedAt()`)
- ✅ `mobile/src/common/utils/guestStorage.ts` - Already exists (storage operations)
- ✅ React Native `__DEV__` constant - Built-in global

## Risks & Mitigations

### Risk 1: Seeding in Production
**Mitigation**: 
- Use `isDevMode()` wrapper (checks `__DEV__`, automatically `false` in production builds)
- Add explicit test to verify no seeding in production mode
- Document that seeding is dev-only

### Risk 2: Re-seeding After User Deletes All Recipes
**Mitigation**: 
- **Critical**: `guestStorage.getRecipes()` returns ALL recipes including soft-deleted ones
- If user soft-deletes all recipes, storage still contains tombstones → `recipes.length > 0` → no re-seeding
- Only seeds when storage is truly empty (no records at all)
- This respects user actions (won't re-seed after user deletes all recipes)

### Risk 3: Timestamp Overwriting
**Mitigation**: 
- `withCreatedAt()` does NOT overwrite existing timestamps (confirmed in implementation)
- Safe to use on mock recipes that may already have `createdAt`
- Test verifies existing timestamps are preserved

### Risk 4: Performance Impact
**Mitigation**: 
- Seeding only occurs once per empty storage
- Subsequent reads are normal (no seeding logic executed)
- Seeding is synchronous operation (small array, fast)
- No performance impact after initial seed

### Risk 5: Test Mocking Complexity
**Mitigation**: 
- Use `isDevMode()` wrapper function instead of mocking `__DEV__` directly
- Wrapper can be easily mocked in Jest
- Separated into `devMode.ts` utility for better testability

## Future Enhancements (Out of Scope)

- Configurable seed data (different recipes for different dev scenarios)
- Seed-on-demand command (manual trigger for seeding)
- Seed data versioning (migrate seed data when schema changes)
- Production seed data (if needed for demos/presentations)

## Related Documentation

- [Guest Storage Backend Decision](../../../docs/architecture/GUEST_STORAGE_DECISION.md)
- [Guest Storage Utilities Plan](../002-guest-storage-utilities/002-guest-storage-utilities_plan.md)
- [Data Modes Architecture Specification](../../../docs/architecture/DATA_MODES_SPEC.md)
- [Recipe Service Implementation](../../../docs/features/recipes.md)
