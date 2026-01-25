---
name: 002-public-catalog-helper-standardization
overview: Standardize all catalog data fetching to use CatalogService with API → Cache → Mock fallback pattern, ensuring consistent behavior across all services and repositories.
todos:
  - id: create-shared-types
    content: Create shared catalog types file and move GrocerySearchItemDto to central location
    status: pending
  - id: enhance-logging
    content: Add enhanced logging to CatalogService to track which fallback path was taken
    status: pending
  - id: refactor-cache-aware-repo
    content: Refactor CacheAwareShoppingRepository.getGroceryItems() to use catalogService
    status: pending
  - id: refactor-remote-service
    content: Refactor RemoteShoppingService.getGroceryItems() to use catalogService
    status: pending
  - id: remove-duplicates
    content: Remove duplicate GrocerySearchItemDto types and mapGroceryItem functions
    status: pending
  - id: update-tests
    content: Update or create tests for refactored services
    status: pending
  - id: verify-integration
    content: Verify all services work correctly online/offline with consistent behavior
    status: pending
isProject: false
---

# 002 - Public Catalog Helper (API → Fallback) - Standardization Plan

**Epic:** Public Catalog Guest and Signed-In

**Created:** January 25, 2026

**Status:** Planning

## Overview

Standardize all catalog data fetching across the mobile app to use the centralized `CatalogService` with consistent API → Cache → Mock fallback behavior. Currently, `CatalogService` and `useCatalog` hook are fully implemented, but `CacheAwareShoppingRepository` and `RemoteShoppingService` still make direct API calls without fallback support.

## Current Implementation Status

### ✅ Already Implemented

1. **CatalogService** (`mobile/src/common/services/catalogService.ts`)

   - Full API → Cache → Mock fallback implementation
   - Memoization to prevent redundant API calls
   - Comprehensive tests (`catalogService.spec.ts`)

2. **useCatalog Hook** (`mobile/src/common/hooks/useCatalog.ts`)

   - React hook wrapping CatalogService
   - Loading/error states
   - Comprehensive tests (`useCatalog.test.tsx`)

3. **catalogUtils** (`mobile/src/common/utils/catalogUtils.ts`)

   - `buildCategoriesFromGroceries()` - Builds categories from items
   - `buildFrequentlyAddedItems()` - Returns first N items
   - Comprehensive tests (`catalogUtils.spec.ts`)

4. **LocalShoppingService** (`mobile/src/features/shopping/services/LocalShoppingService.ts`)

   - ✅ Already uses `catalogService.getCatalogData()` (line 30)

5. **RecipesScreen** (`mobile/src/features/recipes/screens/RecipesScreen.tsx`)

   - ✅ Already uses `useCatalog()` hook (line 95)

### ❌ Needs Refactoring

1. **CacheAwareShoppingRepository** (`mobile/src/common/repositories/cacheAwareShoppingRepository.ts`)

   - ❌ Direct API call in `getGroceryItems()` (line 196-210)
   - ❌ Returns empty array on network error (inconsistent with CatalogService)
   - ❌ Duplicate `GrocerySearchItemDto` type (line 32)
   - ❌ Duplicate `mapGroceryItem` function (line 97)

2. **RemoteShoppingService** (`mobile/src/features/shopping/services/RemoteShoppingService.ts`)

   - ❌ Direct API call in `getGroceryItems()` (line 274-277)
   - ❌ No error handling (throws on network errors)
   - ❌ Duplicate `GrocerySearchItemDto` type (line 9)
   - ❌ Duplicate `mapGroceryItem` function (line 42)

## Architecture

### Current Flow (Inconsistent)

```
CacheAwareShoppingRepository
  └─> Direct API call → Empty array on error ❌

RemoteShoppingService
  └─> Direct API call → Throws on error ❌

LocalShoppingService
  └─> catalogService.getCatalogData() ✅

RecipesScreen
  └─> useCatalog() hook ✅
```

### Target Flow (Standardized)

```
All Services/Repositories
  └─> catalogService.getGroceryItems()
      ├─> Try API first
      ├─> Fallback to cache on NetworkError
      └─> Fallback to mock data if cache empty
```

## Implementation Steps

### Step 0: Create Shared Catalog Types

**File:** `mobile/src/common/types/catalog.ts` (new file)

**Purpose:** Centralize catalog-related DTOs and types to prevent future duplication.

**Content:**
```typescript
/**
 * Catalog Types
 * 
 * Shared type definitions for catalog-related DTOs and data structures.
 * Used across services, repositories, and components.
 */

/**
 * DTO type for API response from /groceries/search endpoint
 */
export interface GrocerySearchItemDto {
  id: string;
  name: string;
  category: string;
  imageUrl?: string | null;
  defaultQuantity?: number | null;
}
```

**Update:** `mobile/src/common/types/index.ts`
- Add `export * from './catalog';`

**Impact:**
- Single source of truth for catalog DTOs
- Prevents future duplication
- Improves type safety and maintainability

### Step 1: Enhance CatalogService Logging

**File:** `mobile/src/common/services/catalogService.ts`

**Changes:**
1. Add enum or constants for fallback paths
2. Enhance logging to explicitly track which path was taken
3. Use structured logging for better debugging

**Enhanced Logging:**
```typescript
enum CatalogSource {
  API = 'api',
  CACHE = 'cache',
  MOCK = 'mock',
}

private async fetchGroceryItemsWithFallback(): Promise<GroceryItem[]> {
  // Try API first
  try {
    const results = await api.get<GrocerySearchItemDto[]>('/groceries/search?q=');
    const items = results.map(mapGroceryItem);
    
    // Cache successful response
    await this.cacheGroceryItems(items);
    
    console.log('[CatalogService] Fetched from API', { itemCount: items.length, source: CatalogSource.API });
    return items;
  } catch (error) {
    // Handle network errors - fallback to cache
    if (error instanceof NetworkError) {
      console.warn('[CatalogService] Network unavailable, falling back to cache', { source: CatalogSource.CACHE });
      const cached = await this.getCachedGroceryItems();
      
      if (cached.length > 0) {
        console.log('[CatalogService] Using cached catalog data', { itemCount: cached.length, source: CatalogSource.CACHE });
        return cached;
      }
      
      // Cache empty - fallback to mock data
      console.warn('[CatalogService] Cache empty, using mock catalog data', { itemCount: mockGroceriesDB.length, source: CatalogSource.MOCK });
      return mockGroceriesDB;
    }
    
    // Re-throw non-network errors
    throw error;
  }
}
```

**Benefits:**
- Clear visibility into which data source was used
- Easier debugging of offline/online scenarios
- Better production monitoring capabilities

### Step 2: Update CatalogService to Use Shared Types

**File:** `mobile/src/common/services/catalogService.ts`

**Changes:**
1. Import `GrocerySearchItemDto` from `'../types/catalog'`
2. Remove local type definition
3. Update imports

**Before:**
```typescript
type GrocerySearchItemDto = {
  id: string;
  name: string;
  category: string;
  imageUrl?: string | null;
  defaultQuantity?: number | null;
};
```

**After:**
```typescript
import { GrocerySearchItemDto } from '../types/catalog';
```

### Step 3: Refactor CacheAwareShoppingRepository

**File:** `mobile/src/common/repositories/cacheAwareShoppingRepository.ts`

**Changes:**

1. Import `catalogService` from `'../../services/catalogService'`
2. Replace `getGroceryItems()` method to use `catalogService.getGroceryItems()`
3. Remove duplicate `GrocerySearchItemDto` type definition
4. Remove duplicate `mapGroceryItem` function
5. Update method documentation to reflect fallback behavior

**Before:**

```typescript
private async getGroceryItems(): Promise<GroceryItem[]> {
  try {
    const results = await api.get<GrocerySearchItemDto[]>('/groceries/search?q=');
    return results.map(mapGroceryItem);
  } catch (error) {
    if (error instanceof NetworkError) {
      return []; // Returns empty array
    }
    throw error;
  }
}
```

**After:**

```typescript
private async getGroceryItems(): Promise<GroceryItem[]> {
  return catalogService.getGroceryItems();
}
```

**Impact:**

- Consistent fallback behavior (API → Cache → Mock)
- Never returns empty array (always has mock fallback)
- Removes ~15 lines of duplicate code

### Step 4: Refactor RemoteShoppingService

**File:** `mobile/src/features/shopping/services/RemoteShoppingService.ts`

**Changes:**

1. Import `catalogService` from `'../../../common/services/catalogService'`
2. Replace `getGroceryItems()` method to use `catalogService.getGroceryItems()`
3. Remove duplicate `GrocerySearchItemDto` type definition
4. Remove duplicate `mapGroceryItem` function
5. Update method documentation

**Before:**

```typescript
private async getGroceryItems(): Promise<GroceryItem[]> {
  const results = await api.get<GrocerySearchItemDto[]>('/groceries/search?q=');
  return results.map(mapGroceryItem);
}
```

**After:**

```typescript
private async getGroceryItems(): Promise<GroceryItem[]> {
  return catalogService.getGroceryItems();
}
```

**Impact:**

- Consistent fallback behavior
- Graceful offline handling (no throws on network errors)
- Removes ~10 lines of duplicate code

### Step 5: Update Tests

**Files to Update:**

1. `mobile/src/common/repositories/__tests__/cacheAwareShoppingRepository.spec.ts` (if exists)
2. `mobile/src/features/shopping/services/__tests__/RemoteShoppingService.spec.ts` (if exists)

**Test Updates:**

- Mock `catalogService` instead of `api.get`
- Update test expectations to account for fallback behavior
- Ensure tests verify catalogService is called correctly

**If test files don't exist:**

- Create comprehensive tests following TDD approach
- Test that services use catalogService correctly
- Test fallback behavior through catalogService mocks

### Step 4: Verify Integration

**Verification Checklist:**

- [ ] `CacheAwareShoppingRepository.getShoppingData()` works online
- [ ] `CacheAwareShoppingRepository.getShoppingData()` works offline (uses cache)
- [ ] `CacheAwareShoppingRepository.getShoppingData()` works with no cache (uses mock)
- [ ] `RemoteShoppingService.getShoppingData()` works online
- [ ] `RemoteShoppingService.getShoppingData()` works offline (uses cache)
- [ ] `RemoteShoppingService.getShoppingData()` works with no cache (uses mock)
- [ ] All services return consistent data structure
- [ ] No duplicate type definitions remain
- [ ] No duplicate mapping functions remain

## Files to Modify

### Mobile Files

1. **`mobile/src/common/types/catalog.ts`** (new file)
   - Create shared catalog types file
   - Export `GrocerySearchItemDto` interface

2. **`mobile/src/common/types/index.ts`**
   - Add export for catalog types

3. **`mobile/src/common/services/catalogService.ts`**
   - Import `GrocerySearchItemDto` from shared types
   - Remove local type definition
   - Enhance logging with fallback path tracking

4. **`mobile/src/common/repositories/cacheAwareShoppingRepository.ts`**
   - Import `GrocerySearchItemDto` from shared types
   - Import `catalogService` from `'../../services/catalogService'`
   - Remove duplicate type definition (lines 32-40)
   - Remove duplicate `mapGroceryItem` function (lines 97-103)
   - Replace `getGroceryItems()` method (lines 196-210) to use `catalogService.getGroceryItems()`

5. **`mobile/src/features/shopping/services/RemoteShoppingService.ts`**
   - Import `GrocerySearchItemDto` from shared types
   - Import `catalogService` from `'../../../common/services/catalogService'`
   - Remove duplicate type definition (lines 9-15)
   - Remove duplicate `mapGroceryItem` function (lines 42-48)
   - Replace `getGroceryItems()` method (lines 274-277) to use `catalogService.getGroceryItems()`

6. **Test Files (if they exist)**
   - Update mocks and expectations
   - Add tests for fallback behavior
   - Update tests to use shared types

## Success Criteria

1. ✅ Shared catalog types file created with `GrocerySearchItemDto`
2. ✅ Enhanced logging tracks which fallback path was taken (API/Cache/Mock)
3. ✅ All catalog fetching uses `catalogService.getGroceryItems()`
4. ✅ Consistent fallback behavior: API → Cache → Mock
5. ✅ No duplicate type definitions
6. ✅ No duplicate mapping functions
7. ✅ All services work online and offline
8. ✅ Tests updated and passing
9. ✅ No breaking changes to existing functionality

## Benefits

1. **Consistency**: All catalog access follows same pattern
2. **Reliability**: Always returns data (never empty, always has mock fallback)
3. **Maintainability**: Single source of truth for catalog fetching
4. **Code Reduction**: Removes ~25 lines of duplicate code
5. **Better UX**: Graceful offline handling across all services

## Testing Strategy

### Unit Tests

- Mock `catalogService` in repository/service tests
- Verify correct method calls
- Test error propagation (non-network errors should still throw)

### Integration Tests

- Test full flow: API → Cache → Mock
- Test with network on/off
- Test with cache present/empty
- Verify consistent data structure across all services

### Manual Testing

1. Test signed-in user shopping screen (uses CacheAwareShoppingRepository)
2. Test signed-in user shopping screen offline
3. Test signed-in user shopping screen with no cache
4. Verify all catalog-dependent features work correctly

## Notes

- `CatalogService` already handles memoization, so multiple calls from different services won't cause redundant API calls
- Mock data fallback ensures app always has catalog data, even on first launch offline
- Cache is automatically populated on successful API calls
- No changes needed to backend (API endpoints already public and working)

## Future Enhancements (Out of Scope)

### Force Refresh Option

For advanced UX improvements, consider adding a `forceRefresh` option to `CatalogService.getGroceryItems()`:

```typescript
async getGroceryItems(options?: { forceRefresh?: boolean }): Promise<GroceryItem[]> {
  if (options?.forceRefresh) {
    // Clear memoization and cache, force fresh API call
    this.groceryItemsPromise = null;
    await this.clearCache();
  }
  // ... existing implementation
}
```

**Benefits:**
- Allows users to manually refresh catalog data
- Useful for pull-to-refresh scenarios
- Enables cache invalidation when needed

**Considerations:**
- May be out of scope for this standardization task
- Would require updating all call sites
- Should be added as a separate enhancement if needed