# 006 - Fix Import Service to Always Use Local Data

**Epic:** Developer Experience
**Created:** 2026-01-23
**Status:** Planning

## Overview

Fix the `gatherLocalData` method in `ImportService` to always use local services regardless of the `config.mockData.enabled` toggle. Currently, when the toggle is false (production), the import service attempts to fetch data from remote APIs instead of local guest data, causing incorrect import payloads that duplicate server data and ignore local guest data.

## Problem Statement

### Current Issue

**Import Service** (`mobile/src/services/import/importService.ts`):
- Uses `config.mockData.enabled` to select service layer
- When `config.mockData.enabled = false` (production), creates `RemoteRecipeService` and `RemoteShoppingService`
- Attempts to fetch data from API instead of local guest data
- Import payload contains remote API data instead of local guest data
- Guest users trying to import their local data end up importing server data instead

### Root Cause

The `gatherLocalData` method is intended to gather **local guest data** for import, but it incorrectly respects the `config.mockData.enabled` flag. This flag should only control development/testing behavior, not production guest data gathering.

### Expected Behavior

- `gatherLocalData()` should **always** use local services (`LocalRecipeService`, `LocalShoppingService`)
- Should gather data from mocks and AsyncStorage, not remote APIs
- Should work correctly regardless of `config.mockData.enabled` value
- Should ensure guest users import their actual local data, not server data

## Architecture

### Service Selection Pattern

```typescript
// ❌ CURRENT (WRONG):
const isMockDataEnabled = config.mockData.enabled;
const recipeService = createRecipeService(isMockDataEnabled);
const shoppingService = createShoppingService(isMockDataEnabled);

// ✅ CORRECT:
// Always use local services for gathering guest data
const recipeService = createRecipeService(true);
const shoppingService = createShoppingService(true);
```

### Data Flow

**Current (Broken)**:
1. User clicks "Import local guest data"
2. `gatherLocalData()` checks `config.mockData.enabled`
3. If `false` → Creates remote services
4. Remote services fetch from API → Returns server data
5. Import payload contains server data instead of guest data ❌

**Fixed**:
1. User clicks "Import local guest data"
2. `gatherLocalData()` always uses local services
3. Local services return guest data from mocks/AsyncStorage
4. Import payload contains actual guest data ✅

## Implementation Steps

### 1. Update ImportService.gatherLocalData()
**File**: `mobile/src/services/import/importService.ts`

**Changes**:
- Remove `import { config } from '../../config';` (line 4)
- Replace service creation to always use local services
- Update docstring to clarify behavior
- Add inline comment explaining why we force local services

**Code changes**:
```typescript
// Remove this import:
import { config } from '../../config';

// Replace lines 32-34:
// Always use local services for gathering guest data, regardless of mock toggle
const recipeService = createRecipeService(true);
const recipes = await recipeService.getRecipes();

// Replace line 54:
const shoppingService = createShoppingService(true);
const shoppingData = await shoppingService.getShoppingData();

// Update docstring (lines 27-30):
/**
 * Gathers all "local" guest data from various sources (mocks and AsyncStorage)
 * and constructs the payload for the import API.
 * 
 * Note: Always uses local services regardless of config.mockData.enabled
 * to ensure guest data is gathered, not remote API data.
 */
```

### 2. Update Tests
**File**: `mobile/src/services/import/importService.spec.ts`

**Changes**:
- Verify that services are created with `true` (local) regardless of config
- Add test case to verify local services are used even when `config.mockData.enabled = false`
- Update mocks if needed to reflect new behavior

**Test cases to add**:
```typescript
describe('gatherLocalData service selection', () => {
  it('should always use local services regardless of config.mockData.enabled', async () => {
    // Mock config with mockData.enabled = false
    jest.mocked(config.mockData.enabled).mockReturnValue(false);
    
    await ImportService.gatherLocalData();
    
    // Verify local services were created
    expect(createRecipeService).toHaveBeenCalledWith(true);
    expect(createShoppingService).toHaveBeenCalledWith(true);
  });
});
```

## Testing Strategy

### Unit Tests
1. **Service Selection**:
   - Test that `createRecipeService(true)` is called
   - Test that `createShoppingService(true)` is called
   - Test that config value doesn't affect service selection

2. **Data Gathering**:
   - Verify local data is gathered correctly
   - Verify import payload structure is correct
   - Verify all local data sources are queried

### Integration Tests
1. **Import Flow**:
   - Create guest data locally
   - Call `gatherLocalData()` with `config.mockData.enabled = false`
   - Verify returned data matches local guest data
   - Verify no API calls are made

2. **Production Scenario**:
   - Simulate production environment (`config.mockData.enabled = false`)
   - Verify import still gathers local guest data correctly

### Manual Testing Steps
1. Start app in production mode (`config.mockData.enabled = false`)
2. Create some guest data (recipes, shopping lists)
3. Sign in with Google
4. Click "Import local guest data"
5. ✅ Verify imported data matches the guest data created, not server data
6. ✅ Verify no API errors occur during import

## Success Criteria

- [ ] `gatherLocalData()` always uses local services regardless of `config.mockData.enabled`
- [ ] Import payload contains actual guest data, not server data
- [ ] No API calls are made during `gatherLocalData()`
- [ ] Tests verify local services are always used
- [ ] Documentation updated to reflect behavior
- [ ] Works correctly in both development and production environments

## Files to Modify

1. `mobile/src/services/import/importService.ts`
   - Remove config import
   - Force local services in `gatherLocalData()`
   - Update docstring

2. `mobile/src/services/import/importService.spec.ts`
   - Add test for service selection
   - Verify local services are always used

## Potential Risks

1. **Breaking Changes**: None expected - this fixes incorrect behavior
2. **Test Failures**: Existing tests might need updates if they mock config
3. **Import Behavior**: Users who previously imported (incorrectly) might see different results
   - Mitigation: This is actually the correct behavior, so it's a bug fix

## Notes

- The `config.mockData.enabled` flag should only control development/testing behavior in UI components
- Import service has a specific purpose: gather LOCAL guest data for import
- This is a bug fix, not a feature change
- Related to task 005 (guest user data separation) - ensures import respects guest data boundaries
