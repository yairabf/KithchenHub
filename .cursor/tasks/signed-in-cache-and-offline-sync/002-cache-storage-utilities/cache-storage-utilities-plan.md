# Cache Storage Utilities Implementation Plan

**Epic:** Signed-In Cache and Offline Sync  
**Task:** Cache Storage Utilities  
**Created:** 2026-01-25  
**Status:** Completed

## Overview

Create a thin wrapper layer for safe cache access with TTL support. This layer uses existing cache infrastructure (`cacheMetadata`, `cacheConfig`) without duplicating logic. Provides minimal, practical validation and focuses on safe read/write operations.

## Current Status Analysis

### ✅ Already Implemented (Mobile)

1. **Cache Metadata Utilities** (`mobile/src/common/utils/cacheMetadata.ts`)
   - `getCacheMetadata()`, `updateCacheMetadata()`, `clearCacheMetadata()`
   - Manages `lastSyncedAt` timestamps per entity type

2. **TTL Configuration** (`mobile/src/common/config/cacheConfig.ts`)
   - `CACHE_TTL_CONFIG` with TTL and stale thresholds
   - `getCacheState()`, `isCacheStale()`, `isCacheExpired()`, `isCacheFresh()`
   - Pure functions for cache state calculation (uses `lastSyncedAt`)

3. **Cache-Aware Repository** (`mobile/src/common/repositories/cacheAwareRepository.ts`)
   - High-level `getCached()`, `setCached()`, `invalidateCache()`
   - Implements full cache-first strategy with background refresh

4. **Storage Helpers** (`mobile/src/common/utils/storageHelpers.ts`)
   - `normalizePersistedArray()` for low-level storage normalization

5. **Storage Key Management** (`mobile/src/common/storage/dataModeStorage.ts`)
   - `getSignedInCacheKey()` for generating cache keys
   - `ENTITY_TYPES` constants

### ❌ Missing Implementation

1. **Cache Storage Wrappers** - Thin, safe wrapper layer that:
   - Reads/writes signed-in cache keys safely
   - Uses existing `cacheMetadata` + `cacheConfig` to compute state
   - Does NOT re-implement stale/expired math
   - Provides minimal validation (safeParseJSON, array checks, optional validator)

## Implementation Plan

### Phase 1: Cache Storage Wrappers

**File**: `mobile/src/common/utils/cacheStorage.ts`

**Purpose**: Thin wrapper layer for safe cache access that leverages existing utilities.

**Functions to Implement**:

1. `readCacheArray<T>(entityType: SyncEntityType, validator?: (x: unknown) => x is T): Promise<CacheReadResult<T>>`
   - Safe cache read with error handling
   - Uses `getCacheMetadata()` and `getCacheState()` from existing utilities
   - Handles corruption, missing data, and parse errors gracefully
   - Returns empty array on corruption, marks `isValid=false`
   - Optional validator callback filters invalid items

2. `writeCacheArray<T>(entityType: SyncEntityType, items: T[], validator?: (x: unknown) => x is T): Promise<void>`
   - Safe cache write with minimal validation
   - Uses `updateCacheMetadata()` to update `lastSyncedAt`
   - Uses `getSignedInCacheKey()` for storage key
   - Optional validator ensures only valid items are written

3. `getCacheState(entityType: SyncEntityType): Promise<CacheStateResult>`
   - Returns cache state information
   - Uses existing `getCacheMetadata()` and `getCacheState()` from `cacheConfig.ts`
   - Does NOT re-implement stale/expired math

4. `shouldRefreshCache(entityType: SyncEntityType, isOnline: boolean): Promise<boolean>`
   - Determines if cache should be refreshed based on state and network
   - Uses existing `getCacheState()` from `cacheConfig.ts`
   - Returns true if stale/expired and online, or expired and offline

**Type Definitions**:

```typescript
interface CacheReadResult<T> {
  data: T[];
  state: CacheState; // 'fresh' | 'stale' | 'expired' | 'missing'
  age: number | null; // milliseconds, null if missing
  lastSyncedAt: string | null; // ISO timestamp
  isValid: boolean; // false if corrupted or invalid
}

interface CacheStateResult {
  state: CacheState;
  age: number | null; // milliseconds
  lastSyncedAt: string | null; // ISO timestamp
}
```

**Implementation Notes**:

- Use `getSignedInCacheKey()` from `dataModeStorage.ts` for storage keys
- Use `getCacheMetadata()` from `cacheMetadata.ts` to read metadata
- Use `getCacheState()` from `cacheConfig.ts` to compute state (pass `lastSyncedAt`)
- Use `normalizePersistedArray()` from `storageHelpers.ts` for parsing
- Use `updateCacheMetadata()` from `cacheMetadata.ts` to update metadata on write
- Minimal validation: `safeParseJSON()`, array checks, optional validator callback
- Return `[]` on corruption and mark `isValid=false`

**Helper Functions**:

```typescript
/**
 * Safely parses JSON with error handling
 * @param raw - Raw JSON string or null
 * @param key - Storage key (for error messages)
 * @returns Parsed value or null if invalid
 */
function safeParseJSON(raw: string | null, key: string): unknown | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error(`Failed to parse JSON from ${key}:`, error);
    return null;
  }
}
```

### Phase 2: Test Suite

**File**: `mobile/src/common/utils/__tests__/cacheStorage.test.ts`

**Purpose**: Comprehensive test coverage for cache storage utilities only.

**Test Cases** (using `describe.each()` for parameterization):

1. **Empty cache (no value)**
   - `readCacheArray()` → `state='missing'`, `data=[]`, `age=null`, `isValid=true`

2. **Invalid JSON**
   - `readCacheArray()` with corrupted JSON → `state='missing'`, `data=[]`, `isValid=false`

3. **Valid cached array + metadata**
   - `readCacheArray()` with valid data → correct state (fresh/stale/expired) based on `lastSyncedAt`
   - Test all states: fresh (age ≤ staleThreshold), stale (age > staleThreshold && ≤ TTL), expired (age > TTL)

4. **Validator filters invalid items**
   - `readCacheArray()` with validator callback → filters out invalid items
   - `writeCacheArray()` with validator → only writes valid items

5. **Write updates metadata**
   - `writeCacheArray()` → updates `lastSyncedAt` via `updateCacheMetadata()`
   - Subsequent `readCacheArray()` → shows fresh state

6. **shouldRefreshCache logic**
   - Test all combinations: (fresh/stale/expired/missing) × (online/offline)
   - Returns true when: (stale/expired + online) OR (expired + offline)

**Test Patterns**:

- Use `describe.each()` for parameterized tests
- Mock AsyncStorage using `@react-native-async-storage/async-storage/jest/async-storage-mock`
- Mock existing utilities (`getCacheMetadata`, `getCacheState`) to test wrapper logic
- Test edge cases: null, corrupted JSON, missing metadata, invalid timestamps

## File Structure

```
mobile/src/common/utils/
├── cacheStorage.ts          # NEW: Thin cache storage wrapper
├── cacheMetadata.ts         # EXISTS: Metadata management (used by cacheStorage)
├── backgroundRefresh.ts     # EXISTS: Background refresh (not tested here)
└── __tests__/
    └── cacheStorage.test.ts  # NEW: Tests for cache storage only

mobile/src/common/config/
└── cacheConfig.ts            # EXISTS: TTL config (used by cacheStorage)

mobile/src/common/repositories/
└── cacheAwareRepository.ts   # EXISTS: High-level cache operations (not tested here)
```

## Success Criteria

1. ✅ Safe cache access wrappers implemented (`readCacheArray`, `writeCacheArray`)
2. ✅ Uses existing `cacheMetadata` + `cacheConfig` utilities (no logic duplication)
3. ✅ Minimal validation: safeParseJSON, array checks, optional validator
4. ✅ `getCacheState()` helper returns state/age/lastSyncedAt
5. ✅ `shouldRefreshCache()` helper determines refresh need
6. ✅ Comprehensive test coverage for this layer only
7. ✅ All edge cases handled (corruption, missing data, invalid timestamps)
8. ✅ Type-safe implementations with proper TypeScript types

## Dependencies

- **Existing utilities** (use, don't re-implement):
  - `cacheMetadata.ts`: `getCacheMetadata()`, `updateCacheMetadata()`
  - `cacheConfig.ts`: `getCacheState()`, `CACHE_TTL_CONFIG`
  - `dataModeStorage.ts`: `getSignedInCacheKey()`, `ENTITY_TYPES`
  - `storageHelpers.ts`: `normalizePersistedArray()` (optional, may use directly)

- **Testing**:
  - Jest
  - `@react-native-async-storage/async-storage/jest/async-storage-mock`

## Implementation Order

1. **Create test file first** (TDD approach)
   - Write parameterized tests for all functions
   - Cover all edge cases and scenarios

2. **Implement cacheStorage.ts**
   - Implement `readCacheArray()` with minimal validation
   - Implement `writeCacheArray()` with metadata update
   - Implement `getCacheState()` using existing utilities
   - Implement `shouldRefreshCache()` using existing utilities
   - Add `safeParseJSON()` helper

3. **Verify tests pass**
   - All test cases should pass
   - Edge cases handled gracefully

## Out of Scope (Future Plans)

- ❌ `checkCacheIntegrity()` - Deep integrity checks
- ❌ `sanitizeCacheData()` - Deep sanitization
- ❌ `cacheAwareRepository` tests - Belongs in repository test plan
- ❌ `backgroundRefresh` tests - Belongs in background refresh test plan
- ❌ Backend cache utilities - Not needed for this task
- ❌ `getCacheFreshnessInfo()` - Detailed freshness info (can add later)
- ❌ `isCacheUsable()` - Usability checks (can add later)

## Notes

- **Thin wrapper principle**: `cacheStorage.ts` should be a thin layer that uses existing utilities. It should NOT re-implement stale/expired math or metadata management.
- **Minimal validation**: Only validate what's necessary for safe access. Use optional validator callback for type-specific validation.
- **Test this layer only**: Tests should focus on the wrapper logic, not the underlying utilities (which may be tested separately).
- **Error handling**: Return empty arrays and mark `isValid=false` on corruption. Don't throw errors for expected cases (missing cache, invalid JSON).
- **Type safety**: Use TypeScript generics and type guards (validator callback) for type-safe operations.
