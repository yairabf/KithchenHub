# 002 - Guest Storage Utilities

**Epic:** Guest Mode Local Persistence  
**Created:** 2026-01-25  
**Status:** Planning

## Overview

Build typed, generic helpers for guest storage operations with safe parsing, centralized key management, and envelope-based versioning. This task refactors the existing `guestStorage.ts` to use reusable utilities that eliminate code duplication and enable future schema migrations.

### Problem Statement

Currently, `guestStorage.ts` has:
- ✅ Entity-specific methods with safe error handling
- ✅ Validation functions for each entity type
- ✅ Performance monitoring
- ✅ Timestamp normalization

However, it's missing:
- ❌ Generic typed read/write helpers (code duplication across entity types)
- ❌ Centralized key definitions (keys hardcoded instead of using `dataModeStorage` utilities)
- ❌ Versioning mechanism for schema migrations
- ❌ Reusable safe parsing utilities
- ❌ Type-safe generic storage operations

### User Story

As a developer, I want typed, reusable storage utilities so that:
- Adding new entity types requires minimal code duplication
- Storage keys are managed centrally and consistently
- Data versioning enables safe schema migrations
- Parsing errors are handled gracefully with clear error messages
- Type safety prevents runtime errors from invalid data structures

## Current State Analysis

### What's Already Implemented

#### 1. `mobile/src/common/utils/guestStorage.ts` (496 lines)
- **Entity-specific methods**: `getRecipes()`, `saveRecipes()`, `getShoppingLists()`, `saveShoppingLists()`, `getShoppingItems()`, `saveShoppingItems()`, `getChores()`, `saveChores()`, `clearAll()`
- **Hardcoded storage keys**: 
  - `GUEST_RECIPES_KEY = '@kitchen_hub_guest_recipes'`
  - `GUEST_SHOPPING_LISTS_KEY = '@kitchen_hub_guest_shopping_lists'`
  - `GUEST_SHOPPING_ITEMS_KEY = '@kitchen_hub_guest_shopping_items'`
  - `GUEST_CHORES_KEY = '@kitchen_hub_guest_chores'`
- **Validation functions**: `validateRecipe()`, `validateShoppingList()`, `validateShoppingItem()`, `validateChore()`
- **Performance monitoring**: `getPerformanceNow()`, `logPerformanceIfNeeded()`, `logSlowEmptyRead()`
- **Error handling**: Returns empty arrays on parse errors, logs errors with context
- **Timestamp normalization**: Uses `fromPersistedTimestamps()` and `toPersistedTimestamps()` from `entityMetadata.ts`

#### 2. `mobile/src/common/storage/dataModeStorage.ts` (199 lines)
- **Storage key utilities**: `getGuestStorageKey()`, `getSignedInCacheKey()`, `getPublicCatalogCacheKey()`
- **Constants**: 
  - `STORAGE_PREFIXES.guest = '@kitchen_hub_guest_'`
  - `ENTITY_TYPES` (shoppingLists, shoppingItems, recipes, chores, etc.)
- **Key validation**: `validateStorageKey()`, `validateGuestStorageKey()`, etc.
- **Key extraction**: `getModeFromStorageKey()`, `extractEntityTypeFromKey()`

#### 3. `mobile/src/common/types/entityMetadata.ts` (190 lines)
- **Safe timestamp parsing**: `parseTimestampSafely()` with validation
- **Timestamp conversion**: `toPersistedTimestamps()`, `fromPersistedTimestamps()`
- **Type guards**: `isEntityDeleted()`, `isEntityActive()`
- **Base types**: `EntityTimestamps`, `BaseEntity`

#### 4. Tests
- `mobile/src/common/utils/guestStorage.spec.ts` - Comprehensive tests for all entity types
- `mobile/src/common/storage/__tests__/dataModeStorage.test.ts` - Key management tests

### What's Missing

1. **Generic Typed Read/Write Helpers**
   - No reusable `readEntityArray<T>()` or `writeEntityArray<T>()` functions
   - Each entity type duplicates parsing, validation, and error handling logic
   - Adding a new entity type requires copying ~100 lines of code

2. **Centralized Key Management**
   - Storage keys are hardcoded in `guestStorage.ts` instead of using `getGuestStorageKey()` from `dataModeStorage.ts`
   - Inconsistency risk: keys could drift between files
   - No single source of truth for storage key definitions

3. **Versioning System**
   - No version metadata stored with data
   - No migration path for schema changes
   - No way to detect incompatible data formats
   - Future schema changes could break existing data
   - Need envelope format: `{ version, updatedAt, data }` per key (not global version)

4. **Generic Safe Parsing Utilities**
   - Parsing logic duplicated in each `get*()` method
   - No reusable `safeParseJSON()` or `safeParseEntityArray<T>()` helpers
   - Error messages are entity-specific, not generic

5. **Type-Safe Generic Storage Operations**
   - No way to create storage operations for new entity types without code duplication
   - Validation is entity-specific, but should be composable (pass as arguments)

## Architecture

### Component Structure

```
mobile/src/common/utils/
├── guestStorage.ts (refactored - uses new utilities)
└── guestStorageHelpers.ts (NEW - generic typed helpers + versioning)

mobile/src/common/storage/
└── dataModeStorage.ts (no changes needed)
```

### Key Design Decisions

1. **Generic Helpers First**: Create reusable typed helpers before refactoring existing code
2. **Backward Compatible**: Existing `guestStorage` API remains unchanged
3. **Envelope Versioning**: Version stored per key in envelope format: `{ version: 1, updatedAt: "...", data: [...] }`
   - Allows independent migration per entity type
   - No global version key needed
   - Version defaults to 1 if missing (backward compatible)
4. **Type Safety**: Use TypeScript generics with constraints (`T extends BaseEntity`)
5. **Validation Strategy**: Keep entity-specific validators in `guestStorage.ts` (pass as arguments to helpers)
6. **Internal Helpers**: Generic helpers are internal to guest storage module (not widely exported)

## Implementation Steps

### Step 1: Create Generic Typed Helpers with Envelope Support

**File**: `mobile/src/common/utils/guestStorageHelpers.ts`

**Purpose**: Provide reusable, type-safe storage operations with envelope versioning.

**Envelope Format**:
```typescript
interface StorageEnvelope<T> {
  version: number;        // Schema version (defaults to 1)
  updatedAt: string;      // ISO timestamp of last write
  data: T[];              // Array of entities
}
```

**Key Functions**:

```typescript
/**
 * Current storage schema version
 */
const CURRENT_STORAGE_VERSION = 1;

/**
 * Generic typed read helper with envelope support
 * @template T - Entity type extending BaseEntity
 * @param storageKey - Storage key to read from
 * @param validator - Type guard function to validate entities
 * @returns Promise<StorageEnvelope<T>> - Envelope with version and data, or default envelope on error
 */
async function readEntityEnvelope<T extends BaseEntity>(
  storageKey: string,
  validator: (item: unknown) => item is T
): Promise<StorageEnvelope<T>>

/**
 * Generic typed write helper with envelope support
 * @template T - Entity type extending BaseEntity
 * @param storageKey - Storage key to write to
 * @param entities - Array of entities to write
 * @param validator - Type guard function to validate entities before write
 * @throws Error if validation fails or storage operation fails
 */
async function writeEntityEnvelope<T extends BaseEntity>(
  storageKey: string,
  entities: T[],
  validator: (item: unknown) => item is T
): Promise<void>

/**
 * Safe JSON parsing with error handling
 * @param data - Raw string data from storage
 * @param storageKey - Storage key for error context
 * @returns Parsed data or null if parsing fails
 */
function safeParseJSON<T>(data: string | null, storageKey: string): T | null

/**
 * Validates and normalizes an array of entities
 * @template T - Entity type extending BaseEntity
 * @param rawData - Raw parsed data (unknown type)
 * @param storageKey - Storage key for error context
 * @param validator - Type guard function
 * @returns Array of validated and normalized entities
 */
function validateAndNormalizeArray<T extends BaseEntity>(
  rawData: unknown,
  storageKey: string,
  validator: (item: unknown) => item is T
): T[]

/**
 * Migrates envelope data if version mismatch detected
 * @template T - Entity type extending BaseEntity
 * @param envelope - Envelope to migrate
 * @returns Migrated envelope (or original if no migration needed)
 */
function migrateEnvelopeIfNeeded<T extends BaseEntity>(
  envelope: StorageEnvelope<T>
): StorageEnvelope<T>
```

**Implementation Details**:
- Envelope format: `{ version: 1, updatedAt: ISO string, data: [...] }`
- Backward compatibility: If raw array is found (legacy format), wrap in envelope with version 1
- Version defaults to 1 if missing
- Use `fromPersistedTimestamps()` for normalization
- Filter invalid items with clear error logging
- Return default envelope `{ version: 1, updatedAt: now, data: [] }` on any error
- Include performance monitoring (reuse existing helpers from guestStorage.ts)

### Step 2: Refactor guestStorage to Use New Helpers

**File**: `mobile/src/common/utils/guestStorage.ts`

**Changes**:
1. **Replace hardcoded keys** with `getGuestStorageKey()` calls:
   ```typescript
   // Before:
   const GUEST_RECIPES_KEY = '@kitchen_hub_guest_recipes';
   
   // After:
   import { getGuestStorageKey, ENTITY_TYPES } from '../storage/dataModeStorage';
   const GUEST_RECIPES_KEY = getGuestStorageKey(ENTITY_TYPES.recipes);
   ```

2. **Refactor methods to use envelope helpers**:
   ```typescript
   // Before: ~50 lines of parsing/validation logic
   async getRecipes(): Promise<Recipe[]> {
     // ... 50 lines of duplicated code
   }
   
   // After: ~5 lines using generic helper
   async getRecipes(): Promise<Recipe[]> {
     const envelope = await readEntityEnvelope(
       GUEST_RECIPES_KEY,
       validateRecipe
     );
     return envelope.data;
   }
   
   async saveRecipes(recipes: Recipe[]): Promise<void> {
     await writeEntityEnvelope(
       GUEST_RECIPES_KEY,
       recipes,
       validateRecipe
     );
   }
   ```

3. **Keep existing API**: All public methods remain unchanged (still return `T[]`, not envelopes)
4. **Keep performance monitoring**: Reuse existing helpers from guestStorage.ts
5. **Keep validation functions**: Leave validators in guestStorage.ts (pass as arguments to helpers)

### Step 3: Update Tests

**File**: `mobile/src/common/utils/guestStorage.spec.ts`

**Changes**:
- Update tests to verify new key generation (using `getGuestStorageKey()`)
- Ensure all existing tests still pass (backward compatibility)
- Add tests for envelope format (version defaults to 1 if missing)

**New Test File**:
- `mobile/src/common/utils/guestStorageHelpers.spec.ts` - Test generic helpers and envelope format
  - ✅ `readEntityEnvelope()` with valid envelope
  - ✅ `readEntityEnvelope()` with legacy array format (backward compatibility)
  - ✅ `readEntityEnvelope()` with invalid JSON (returns default envelope)
  - ✅ `readEntityEnvelope()` with wrong shape (not envelope, not array)
  - ✅ `readEntityEnvelope()` with invalid entities (filtered out)
  - ✅ `readEntityEnvelope()` with empty storage (returns default envelope)
  - ✅ `readEntityEnvelope()` version defaults to 1 if missing
  - ✅ `writeEntityEnvelope()` with valid entities
  - ✅ `writeEntityEnvelope()` with invalid entities (throws)
  - ✅ `writeEntityEnvelope()` creates envelope with version 1 and updatedAt
  - ✅ `safeParseJSON()` with valid/invalid JSON
  - ✅ `validateAndNormalizeArray()` with various inputs

## API Changes

### New Internal APIs (Not Exported)

```typescript
// Internal helpers in guestStorageHelpers.ts (not exported)
// Only used internally by guestStorage.ts
function readEntityEnvelope<T>(...)
function writeEntityEnvelope<T>(...)
function safeParseJSON<T>(...)
function validateAndNormalizeArray<T>(...)
```

### Existing APIs (Unchanged)

```typescript
// guestStorage API remains exactly the same
export const guestStorage = {
  getRecipes(): Promise<Recipe[]>,
  saveRecipes(recipes: Recipe[]): Promise<void>,
  getShoppingLists(): Promise<ShoppingList[]>,
  saveShoppingLists(lists: ShoppingList[]): Promise<void>,
  getShoppingItems(): Promise<ShoppingItem[]>,
  saveShoppingItems(items: ShoppingItem[]): Promise<void>,
  getChores(): Promise<Chore[]>,
  saveChores(chores: Chore[]): Promise<void>,
  clearAll(): Promise<void>,
};
```

## Testing Strategy

### Unit Tests

1. **Generic Helpers** (`guestStorageHelpers.spec.ts`):
   - ✅ `readEntityEnvelope()` with valid envelope format
   - ✅ `readEntityEnvelope()` with legacy array format (backward compatibility - wraps in envelope)
   - ✅ `readEntityEnvelope()` with invalid JSON (returns default envelope)
   - ✅ `readEntityEnvelope()` with wrong shape (not envelope, not array - returns default envelope)
   - ✅ `readEntityEnvelope()` with invalid entities (filtered out, valid ones returned)
   - ✅ `readEntityEnvelope()` with empty storage (returns default envelope)
   - ✅ `readEntityEnvelope()` version defaults to 1 if missing from envelope
   - ✅ `writeEntityEnvelope()` with valid entities (creates envelope with version 1)
   - ✅ `writeEntityEnvelope()` with invalid entities (throws before write)
   - ✅ `writeEntityEnvelope()` sets updatedAt timestamp
   - ✅ `safeParseJSON()` with valid/invalid JSON
   - ✅ `validateAndNormalizeArray()` with various inputs

2. **Refactored guestStorage** (`guestStorage.spec.ts`):
   - ✅ All existing tests pass (backward compatibility)
   - ✅ Verify keys use `getGuestStorageKey()` (indirectly via key values)
   - ✅ Verify methods return arrays (not envelopes) - API unchanged

### Integration Tests

- ✅ Round-trip persistence (save → read) for all entity types
- ✅ Envelope format persists across app restarts
- ✅ Legacy array format is automatically upgraded to envelope on read
- ✅ Error handling maintains current behavior (empty arrays on error)

### Manual Testing

1. **Existing Functionality**:
   - Create recipes, shopping lists, items, chores in guest mode
   - Verify data persists across app restarts
   - Verify data appears correctly in UI

2. **Envelope Format**:
   - Check envelope format is created with version 1 after first write
   - Verify envelope persists across app restarts
   - Verify legacy array data is automatically upgraded to envelope format

## Success Criteria

- ✅ Generic typed read/write helpers exist with envelope support
- ✅ Storage keys use centralized `dataModeStorage` utilities (no hardcoded keys)
- ✅ Envelope versioning per key is in place (v1, extensible for future migrations)
- ✅ All existing `guestStorage` functionality works unchanged (API returns arrays, not envelopes)
- ✅ Safe parsing handles empty/invalid data gracefully (returns default envelope)
- ✅ Legacy array format is automatically upgraded to envelope format
- ✅ All tests pass (existing + new)
- ✅ Code duplication reduced (entity methods < 10 lines each)
- ✅ Type safety enforced (TypeScript generics with constraints)
- ✅ Helpers are internal (not widely exported, only used by guestStorage)

## Files to Create

1. `mobile/src/common/utils/guestStorageHelpers.ts` - Generic typed helpers with envelope versioning
2. `mobile/src/common/utils/guestStorageHelpers.spec.ts` - Helper tests

## Files to Modify

1. `mobile/src/common/utils/guestStorage.ts` - Refactor to use helpers and centralized keys
2. `mobile/src/common/utils/guestStorage.spec.ts` - Update tests

## Dependencies

- ✅ `@react-native-async-storage/async-storage` - Already installed
- ✅ `mobile/src/common/types/entityMetadata.ts` - Already exists
- ✅ `mobile/src/common/storage/dataModeStorage.ts` - Already exists

## Risks & Mitigations

### Risk 1: Breaking Existing Functionality
**Mitigation**: 
- Keep existing `guestStorage` API unchanged
- Comprehensive test coverage before refactoring
- Gradual migration (helpers first, then refactor)

### Risk 2: Performance Regression
**Mitigation**:
- Reuse existing performance monitoring
- Benchmark before/after (should be same or better)
- Generic helpers have same performance characteristics

### Risk 3: Type Safety Issues
**Mitigation**:
- Use strict TypeScript generics with `extends BaseEntity` constraint
- Comprehensive type tests
- Type guards for runtime validation

## Future Enhancements (Out of Scope)

- Migration functions for v2+ (when schema changes) - envelope format supports this
- Batch operations (read/write multiple entity types atomically)
- Storage size monitoring and warnings
- Automatic data cleanup for orphaned entities

## Related Documentation

- [Guest Storage Backend Decision](../../../docs/architecture/GUEST_STORAGE_DECISION.md)
- [Data Modes Architecture Specification](../../../docs/architecture/DATA_MODES_SPEC.md)
- [Guest Mode Specifications](../../../docs/design/GUEST_MODE_SPECS.md)
