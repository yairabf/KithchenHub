# 002 - Define Shared Data Shapes and Metadata - Implementation Summary

**Epic:** Architecture & Cross-Cutting Foundations
**Completed:** 2026-01-25
**Status:** Completed

## What Was Implemented

### 1. Created Shared Metadata Interfaces
Created `mobile/src/common/types/entityMetadata.ts` with:
- **`EntityTimestamps`** interface: Defines `createdAt`, `updatedAt`, and `deletedAt` fields that accept `Date | string` for flexibility between in-memory and persisted representations
- **`BaseEntity`** interface: Extends `EntityTimestamps` and adds required `id` and `localId` fields
- **Type guards**: `isEntityDeleted()` and `isEntityActive()` for checking entity deletion status
- **Helper functions**: 
  - `serializeTimestamps()` - Converts `Date` objects to ISO strings for persistence
  - `deserializeTimestamps()` - Converts ISO strings to `Date` objects for in-memory use
- Comprehensive documentation explaining conventions and usage patterns

### 2. Updated Entity Interfaces
Modified entity interfaces to extend `BaseEntity`:

**Shopping entities** (`mobile/src/mocks/shopping/shoppingItems.ts`):
- `ShoppingItem` - extends `BaseEntity`
- `ShoppingList` - extends `BaseEntity`
- `Category` - extends `BaseEntity`
- Added `localId` fields to all mock category data

**Recipe entities** (`mobile/src/mocks/recipes/index.ts`):
- `Recipe` - extends `BaseEntity` (top-level entity)
- `Ingredient` - simple interface with `id` only (nested sub-entity, not top-level)
- `Instruction` - simple interface with `id` only (nested sub-entity, not top-level)

**Chore entities** (`mobile/src/mocks/chores/index.ts`):
- `Chore` - extends `BaseEntity`

### 3. Exported Shared Types
Updated `mobile/src/common/types/index.ts` to export all entity metadata types, making them available throughout the app.

### 4. Created Comprehensive Tests
Created `mobile/src/common/types/__tests__/entityMetadata.test.ts` with 26 test cases covering:
- Type flexibility (`Date` vs `string` timestamps)
- Type guards (`isEntityDeleted`, `isEntityActive`)
- Serialization/deserialization functions
- Round-trip data integrity
- Edge cases (undefined, null, mixed types)

**All 26 tests pass successfully.**

## Deviations from Plan

**Minor refinement on nested entities:**
- **Nested sub-entities** (`Ingredient`, `Instruction`) do NOT extend `BaseEntity`
  - Rationale: These are nested within recipes, not top-level domain entities
  - They only need simple `id` fields for ordering/uniqueness within their parent
  - Full metadata (timestamps, soft-delete) managed at the `Recipe` level
  - This avoids unnecessary complexity and reduces storage overhead
- **Top-level entities** (`Recipe`, `ShoppingList`, `ShoppingItem`, `Category`, `Chore`) extend `BaseEntity` as planned
- Used tombstone pattern for soft-delete (no `isDeleted` flag) ✅
- Timestamps support both `Date` and `string` types ✅
- All specified top-level entities updated ✅
- Comprehensive documentation and tests included ✅

## Testing Results

### Unit Tests
- ✅ 26/26 tests passing
- Coverage includes all interfaces, type guards, and helper functions
- Round-trip serialization/deserialization validated

### Type Safety
- ✅ No linter errors
- ✅ Strict TypeScript mode enabled
- ✅ No `any` types used
- ✅ All entities properly typed

### Integration
- ✅ Existing services and components continue to work without modification
- ✅ Type system correctly enforces required fields (`id`, `localId`)
- ✅ Optional timestamp fields allow gradual migration

## Design Decisions

### Nested Entities vs Top-Level Entities
**Decision**: Nested sub-entities (`Ingredient`, `Instruction`) do NOT extend `BaseEntity`.

**Rationale**:
1. **Scope of concern**: Ingredients and instructions are always part of a recipe, never exist independently
2. **Metadata ownership**: Timestamps and soft-delete tracking belong to the parent `Recipe`, not individual sub-items
3. **Storage efficiency**: Avoid redundant timestamp fields on potentially hundreds of nested items
4. **Simpler interfaces**: Component authors can work with simpler types when they don't need full entity metadata
5. **Flexibility**: Sub-entities can be reordered/modified without timestamp management complexity

**Rule of thumb**: Extend `BaseEntity` only for entities that:
- Exist independently at the domain level
- Need their own audit trail (create/update/delete timestamps)
- Can be soft-deleted independently
- Are synced/cached as standalone records

## Lessons Learned

### What Went Well
1. **Clear conventions**: Documenting timestamp and soft-delete patterns upfront made implementation straightforward
2. **Type flexibility**: Using `Date | string` union types provides flexibility for both in-memory and persisted states
3. **Helper functions**: Providing `serializeTimestamps` and `deserializeTimestamps` utilities will make it easy to convert between representations
4. **Tombstone pattern**: Using presence/absence of `deletedAt` is cleaner than boolean flags and provides audit timestamps
5. **Comprehensive testing**: 26 test cases ensure the foundation is solid for future use

### What Could Be Improved
1. **Migration strategy**: While timestamp fields are optional, there's no automated migration for existing data - will need to be addressed when implementing persistence
2. **Documentation**: Could add examples showing how to use these types in services and components
3. **Validation**: Could add runtime validators to ensure timestamp strings are valid ISO 8601 format
4. **Nested entity guidance**: Could document when to use `BaseEntity` vs simple `id`-only interfaces for nested entities

## Technical Debt Introduced

**None.** This is foundation work that reduces technical debt by:
- Standardizing entity shapes across the app
- Providing clear patterns for timestamps and soft-deletes
- Establishing type safety for entity metadata

## Next Steps

### Immediate Follow-ups
1. Update backend schema to align with these metadata conventions
2. Implement persistence layer that uses `serializeTimestamps` when saving
3. Update service layers to populate timestamps when creating/updating entities

### Related Tasks
- **Backend Foundation**: Define matching database schema with timestamp columns
- **Persistence Layer**: Implement AsyncStorage/Supabase integration using these types
- **Sync Logic**: Use timestamps for conflict resolution in offline-first sync
- **Audit Trail**: Leverage `createdAt`/`updatedAt`/`deletedAt` for user-facing change history

## Files Created/Modified

### Created
- `mobile/src/common/types/entityMetadata.ts` (117 lines)
- `mobile/src/common/types/__tests__/entityMetadata.test.ts` (377 lines)
- `.cursor/tasks/architecture-cross-cutting-foundations/002-define-shared-data-shapes-and-metadata/` (task docs)

### Modified
- `mobile/src/common/types/index.ts` - Added export for `entityMetadata`
- `mobile/src/mocks/shopping/shoppingItems.ts` - Updated interfaces, added `localId` to categories
- `mobile/src/mocks/recipes/index.ts` - Updated all recipe-related interfaces
- `mobile/src/mocks/chores/index.ts` - Updated `Chore` interface

## Impact Assessment

### Breaking Changes
**None.** All timestamp fields are optional, allowing existing code to continue working without modification.

### Performance Impact
**Negligible.** Type-only changes with no runtime overhead. Helper functions add minimal processing.

### Migration Required
**No immediate migration.** Timestamp fields are optional, so entities without them remain valid. Future persistence implementation will need to populate these fields.
