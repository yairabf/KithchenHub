---
name: Conflict Resolution with Timestamps
overview: Implement and validate timestamp-based conflict resolution for offline-first sync using updatedAt (LWW) and deletedAt tombstones with deterministic outcomes. This includes creating merge utilities, extending sync logic to handle conflicts, and comprehensive test coverage.
todos:
  - id: create-lww-merge-utility
    content: Create conflictResolution.ts with LWW merge utility (compareTimestamps, determineConflictWinner, mergeEntitiesLWW)
    status: pending
  - id: extend-tombstone-handling
    content: Extend merge rules to respect deletedAt tombstones (shouldTreatAsDeleted, mergeEntitiesWithTombstones)
    status: pending
  - id: create-array-merge-utility
    content: Create array merge utility (mergeEntityArrays) to handle collections with additions, updates, deletions
    status: pending
  - id: create-sync-application
    content: Create syncApplication.ts to apply remote updates to local state with conflict resolution
    status: pending
  - id: integrate-realtime-sync
    content: Update shoppingRealtime.ts to use merge utilities instead of simple replace logic
    status: pending
  - id: integrate-sync-pipeline
    content: Integrate syncApplication.applyRemoteUpdatesToLocal() in sync pipeline/repository layer after fetching (do NOT modify Remote*Service methods)
    status: pending
  - id: add-conflict-resolution-tests
    content: Create conflictResolution.test.ts with parameterized tests for LWW, tombstones, and edge cases
    status: pending
  - id: add-sync-application-tests
    content: Create syncApplication.test.ts with integration tests for offline/online conflict scenarios
    status: pending
isProject: false
---

# Conflict Resolution with Timestamps (LWW + Offline Sync Scenarios)

## Overview

Implement timestamp-based conflict resolution for offline-first sync using `updatedAt` (Last-Write-Wins) and `deletedAt` tombstones. This ensures deterministic outcomes when merging local and remote state during sync operations.

## Current State Analysis

### ✅ Already Implemented

1. **Timestamp Infrastructure** (`mobile/src/common/utils/timestamps.ts`, `mobile/src/common/types/entityMetadata.ts`):
   - `EntityTimestamps` interface with `createdAt`, `updatedAt`, `deletedAt`
   - Helpers: `withCreatedAt()`, `withUpdatedAt()`, `markDeleted()`
   - Serialization: `toSupabaseTimestamps()`, `fromSupabaseTimestamps()`, `toPersistedTimestamps()`, `fromPersistedTimestamps()`
   - Type guards: `isEntityDeleted()`, `isEntityActive()`

2. **Service Layer Timestamp Management** (Task 005 completed):
   - All services consistently apply timestamps
   - Guest mode persists timestamps to AsyncStorage
   - Signed-in mode normalizes API responses
   - Server timestamps are authoritative

3. **Backend Soft-Delete Support**:
   - Prisma schema includes `deletedAt` on all user-owned entities
   - Repositories have soft-delete methods
   - `ACTIVE_RECORDS_FILTER` constant for querying active records

4. **Backend Sync Endpoint** (`backend/src/modules/auth/services/auth.service.ts`):
   - `/auth/sync` endpoint exists
   - Handles shopping lists, recipes, chores
   - Uses simple `upsert` without timestamp-based conflict resolution
   - Returns conflicts array but doesn't check timestamps

5. **Client Realtime Sync** (`mobile/src/features/shopping/utils/shoppingRealtime.ts`):
   - `applyShoppingItemChange()` and `applyShoppingListChange()` handlers
   - Currently uses simple replace logic (no timestamp comparison)
   - Handles DELETE events but doesn't check `deletedAt` tombstones

### ❌ Missing Implementation

1. **LWW Merge Utility**: No utility to compare `updatedAt` timestamps and choose the most recent
2. **Conflict Resolution Logic**: No logic to handle concurrent modifications deterministically
3. **Tombstone Handling**: No logic to respect `deletedAt` during merges
4. **Sync Application Step**: No client-side code that applies remote updates to local state with conflict resolution
5. **Backend Sync Enhancement**: Backend sync doesn't check timestamps before upserting
6. **Comprehensive Tests**: No tests for conflict scenarios

## Architecture

### Timestamp Representation

**In-memory**: `Date` objects
- All timestamps in memory are `Date` objects for easy manipulation
- Use `parseTimestampSafely()` to convert ISO strings to `Date` objects

**Persisted / Transport**: ISO 8601 strings
- When persisting to AsyncStorage: ISO strings (via `toPersistedTimestamps()`)
- When sending to API: ISO strings (via `toSupabaseTimestamps()`)
- When receiving from API: ISO strings (normalized to `Date` via `fromSupabaseTimestamps()`)

**In conflict resolution utilities:**
- Normalize both timestamps to `Date` objects using `parseTimestampSafely()` before comparison
- This ensures consistent comparison regardless of input format

### Conflict Resolution Strategy

**Last-Write-Wins (LWW) for Scalar Conflicts:**
- Compare `updatedAt` timestamps
- **Timestamp representation**: In-memory as `Date` objects, persisted/transport as ISO strings
- Normalize both to `Date` objects for comparison using `parseTimestampSafely()`
- Choose the entity with the most recent `updatedAt`
- **Winner record wins wholesale** (entire entity from winner, not partial field mixing)
- Preserve local-only fields (e.g., `localId`, client-only flags) from local side

**Tombstone Handling:**
- If one side has `deletedAt` and its `updatedAt` is newer → treat as deleted
- If one side has `deletedAt` and its `updatedAt` is older → delete still wins (no resurrection)
- **Resurrection Policy: Delete always wins unless recreate** (see Recreate Policy below)
- **No resurrection unless explicit recreate action exists** (see Recreate Policy below)

**Additive Merges:**
- New entities (not present in one side) are always added
- Additions are never removed during merge
- Only existing entities are subject to conflict resolution

**Recreate Policy:**
- **Resurrection Policy: Delete always wins unless recreate** (recommended)
- **Recreate = create new entity with new ID; never reuse IDs after deletion**
- Once an entity is deleted (has `deletedAt`), its ID is permanently retired
- To "recreate" a deleted entity, create a new entity with a new ID
- This prevents ID reuse confusion and ensures clean tombstone semantics
- No special "recreate" flag or operation type needed - just new ID
- **Key principle**: Once deleted, always deleted (unless explicitly recreated with new ID)

### Data Flow

```
┌─────────────────┐
│  Local State    │
│  (AsyncStorage) │
└────────┬────────┘
         │
         │ Fetch local entities
         ▼
┌─────────────────┐
│  Remote State   │
│  (API Response) │
└────────┬────────┘
         │
         │ Fetch remote entities
         ▼
┌─────────────────┐
│  Merge Utility   │
│  (LWW + Tombs)   │
└────────┬────────┘
         │
         │ Resolve conflicts
         ▼
┌─────────────────┐
│  Merged State    │
│  (Apply to Local)│
└─────────────────┘
```

## Implementation Plan

### Phase 1: Core Merge Utilities

#### 1.1 Create LWW Merge Utility (`mobile/src/common/utils/conflictResolution.ts`)

**Purpose**: Centralized conflict resolution logic using timestamps.

**Functions to implement:**

```typescript
/**
 * Compares two timestamps and returns the most recent one.
 * Normalizes both to Date objects using parseTimestampSafely() before comparison.
 * Handles both Date objects and ISO strings (in-memory vs persisted/transport).
 * 
 * @param timestamp1 - First timestamp (Date or ISO string)
 * @param timestamp2 - Second timestamp (Date or ISO string)
 * @returns -1 if first is newer, 0 if equal, 1 if second is newer
 * @throws Error if timestamp strings are invalid ISO 8601 format
 */
function compareTimestamps(
  timestamp1: Date | string | undefined,
  timestamp2: Date | string | undefined
): number

/**
 * Determines which entity should win in a conflict based on updatedAt.
 * Returns 'local' | 'remote' | 'equal'
 */
function determineConflictWinner<T extends EntityTimestamps>(
  local: T,
  remote: T
): 'local' | 'remote' | 'equal'

/**
 * Merges two entities using LWW strategy for scalar fields.
 * Preserves metadata (createdAt, localId) from the winning side.
 */
function mergeEntitiesLWW<T extends EntityTimestamps>(
  local: T,
  remote: T
): T
```

**Key Logic:**
- Normalize timestamps to Date objects for comparison using `parseTimestampSafely()`
- Handle missing timestamps (treat as oldest)
- **Winner record wins wholesale**: Return entire winning entity (not partial field mixing)
- Preserve local-only fields (e.g., `localId`, client-only flags) from local side
- Preserve metadata (`createdAt`, `updatedAt`, `deletedAt`) from winning side

#### 1.2 Extend Merge Rules for Tombstones

**Functions to implement:**

```typescript
/**
 * Checks if an entity should be treated as deleted based on deletedAt tombstone.
 * Returns true if deletedAt exists and is newer than the other side's updatedAt.
 */
function shouldTreatAsDeleted<T extends EntityTimestamps>(
  entity: T,
  otherEntity: T
): boolean

/**
 * Merges entities with tombstone awareness.
 * Handles delete vs update conflicts.
 */
function mergeEntitiesWithTombstones<T extends EntityTimestamps>(
  local: T,
  remote: T
): T | null // Returns null if both sides agree on deletion
```

**Key Logic:**
- **Resurrection Policy: Delete always wins unless recreate**
- If local has `deletedAt` and `local.updatedAt > remote.updatedAt` → delete wins
- If remote has `deletedAt` and `remote.updatedAt > local.updatedAt` → delete wins
- If both have `deletedAt` → return null (both agree on deletion)
- **If one has `deletedAt` but older → delete still wins (no resurrection)**
- **Resurrection only occurs if explicit recreate action exists** (new entity with new ID)

#### 1.3 Array Merge Utility

**Functions to implement:**

```typescript
/**
 * Merges two arrays of entities using LWW + tombstone rules.
 * Handles additions, updates, and deletions.
 */
function mergeEntityArrays<T extends EntityTimestamps>(
  local: T[],
  remote: T[],
  getId: (entity: T) => string
): T[]
```

**Key Logic:**
- Create maps by ID for O(1) lookup
- For each entity in both arrays:
  - If only in local → keep if not deleted
  - If only in remote → add if not deleted
  - If in both → merge using LWW + tombstone rules
- Return merged array (filter out nulls from deletions)

### Phase 2: Integration Points

#### 2.1 Client-Side Sync Application

**Location**: `mobile/src/common/utils/syncApplication.ts` (new file)

**Purpose**: Apply remote updates to local state with conflict resolution.

**Functions to implement:**

```typescript
/**
 * Applies remote updates to local state for a single entity type.
 * Uses merge utilities to resolve conflicts.
 */
async function applyRemoteUpdatesToLocal<T extends EntityTimestamps>(
  entityType: 'recipes' | 'shoppingLists' | 'chores' | 'shoppingItems',
  remoteEntities: T[],
  getId: (entity: T) => string
): Promise<void>
```

**Integration Points:**
- After fetching remote data (e.g., after API call)
- Before displaying data in UI
- During background sync operations
- In sync pipeline / repository layer (not inside Remote*Service methods)

**Important**: Remote services should return remote data normalized (as they currently do). The sync application layer merges remote into local store/cache. This keeps services focused on transport and prevents surprising behavior if callers expect "remote truth".

**Files to modify:**
- Sync pipeline / repository layer - Call `syncApplication.applyRemoteUpdatesToLocal()` after fetching
- Do NOT modify Remote*Service methods to apply merge internally

#### 2.2 Realtime Sync Enhancement

**Location**: `mobile/src/features/shopping/utils/shoppingRealtime.ts`

**Current behavior**: Simple replace logic without timestamp comparison.

**Changes needed:**
- Update `applyShoppingItemChange()` to use merge utilities
- Update `applyShoppingListChange()` to use merge utilities
- Compare timestamps before applying changes
- Respect `deletedAt` tombstones from realtime events

**Example:**
```typescript
export const applyShoppingItemChange = (
  items: ShoppingItem[],
  payload: RealtimePostgresChangesPayload<ShoppingItemRow>,
  groceryItems: GroceryItem[],
): ShoppingItem[] => {
  // ... existing mapping logic ...
  
  if (existing) {
    // Use merge utility instead of simple replace
    const merged = mergeEntitiesWithTombstones(existing, nextItem);
    return merged 
      ? items.map((item) => (item.id === nextItem.id ? merged : item))
      : items.filter((item) => item.id !== nextItem.id); // Filter out deleted
  }
  
  // ... rest of logic ...
};
```

#### 2.3 Backend Sync Enhancement (Out of Scope)

**Location**: `backend/src/modules/auth/services/auth.service.ts`

**Current behavior**: Simple `upsert` without checking timestamps.

**Decision**: **Out of scope for this task** unless we decide server must enforce LWW.

**Rationale**:
- Client-side resolution is sufficient for offline-first architecture
- If both client and server do conflict resolution differently, you can get loops
- Backend can remain simple (just upsert) while client handles all conflicts
- Server timestamps are still authoritative (Prisma auto-manages them)

### Phase 3: Test Coverage

#### 3.1 Unit Tests for Merge Utilities

**Location**: `mobile/src/common/utils/__tests__/conflictResolution.test.ts` (new file)

**Test scenarios:**

1. **LWW Scalar Conflicts:**
   - Local newer → local wins
   - Remote newer → remote wins
   - Equal timestamps → remote wins (deterministic tie-breaker)
   - Missing timestamps → handle gracefully

2. **Tombstone Handling:**
   - Local deleted, newer → delete wins
   - Remote deleted, newer → delete wins
   - Local deleted, older → delete still wins (no resurrection)
   - Remote deleted, older → delete still wins (no resurrection)
   - Both deleted → return null
   - Resurrection only via explicit recreate (new entity with new ID)

3. **Additive Merges:**
   - New entity in local only → keep
   - New entity in remote only → add
   - New entity in both → merge

4. **Array Merges:**
   - Multiple entities with various conflicts
   - Mixed additions, updates, deletions
   - Preserve order where possible

#### 3.2 Integration Tests for Sync Scenarios

**Location**: `mobile/src/common/utils/__tests__/syncApplication.test.ts` (new file)

**Test scenarios:**

1. **Offline Toggle vs Online Delete:**
   - Local: item toggled (updatedAt = T1)
   - Remote: item deleted (deletedAt = T2, updatedAt = T2)
   - Expected: If T2 > T1 → delete wins, else toggle wins

2. **Offline Rename vs Online Rename:**
   - Local: name changed to "A" (updatedAt = T1)
   - Remote: name changed to "B" (updatedAt = T2)
   - Expected: Newer timestamp wins

3. **Delete vs Update Ordering:**
   - Local: deleted (deletedAt = T1, updatedAt = T1)
   - Remote: updated (updatedAt = T2)
   - Expected: **Delete always wins** (no resurrection), even if T2 > T1
   - Resurrection only occurs if explicit recreate action exists (new entity with new ID)

4. **Additions Never Removed:**
   - Local: has entity X
   - Remote: doesn't have entity X
   - Expected: Entity X remains in merged result

#### 3.3 Parameterized Tests

Use `describe.each` for comprehensive coverage:

```typescript
describe.each([
  ['local newer', localNewer, remoteOlder, 'local'],
  ['remote newer', localOlder, remoteNewer, 'remote'],
  ['equal timestamps', localEqual, remoteEqual, 'remote'], // Tie-breaker
])('LWW conflict resolution: %s', (description, local, remote, expectedWinner) => {
  it(`should choose ${expectedWinner}`, () => {
    const result = mergeEntitiesLWW(local, remote);
    expect(result).toMatchObject(expectedWinner === 'local' ? local : remote);
  });
});
```

## Files to Create

1. `mobile/src/common/utils/conflictResolution.ts` - Core merge utilities
2. `mobile/src/common/utils/__tests__/conflictResolution.test.ts` - Unit tests
3. `mobile/src/common/utils/syncApplication.ts` - Sync application logic
4. `mobile/src/common/utils/__tests__/syncApplication.test.ts` - Integration tests

## Files to Modify

1. `mobile/src/features/shopping/utils/shoppingRealtime.ts` - Use merge utilities
2. Sync pipeline / repository layer - Call `syncApplication.applyRemoteUpdatesToLocal()` after fetching
3. Do NOT modify Remote*Service methods (keep them focused on transport)
4. Backend sync enhancement is out of scope (see Design Decisions)

## Success Criteria

- ✅ LWW merge utility compares `updatedAt` and chooses most recent
- ✅ Tombstone handling respects `deletedAt` with proper ordering
- ✅ Concurrent modifications resolve deterministically
- ✅ Additions are never removed during merge
- ✅ Realtime sync uses conflict resolution
- ✅ Automated tests cover all representative conflict cases
- ✅ All tests passing with no regressions
- ✅ Sync application utility created (`applyRemoteUpdatesToLocal`)
- ✅ Services remain focused on transport (conflict resolution in utilities)
- ✅ Comprehensive test coverage with parameterized tests
- ✅ Documentation updated for all three features (shopping, recipes, chores)
- ✅ Backend documentation updated with sync endpoint clarification

## Testing Strategy

1. **Unit Tests**: Test merge utilities in isolation with various timestamp scenarios
2. **Integration Tests**: Test sync application with realistic conflict scenarios
3. **Parameterized Tests**: Cover edge cases systematically
4. **Manual Testing**: Verify offline/online sync behavior in real app

## Design Decisions

### 1. Client-Side Resolution

**Decision**: Implement conflict resolution on client-side.

**Rationale**:
- Offline-first architecture requires client to handle conflicts
- Server can remain simple (just upsert)
- Client has full context of local state

### 2. Deterministic Tie-Breaker

**Decision**: When timestamps are equal, remote wins.

**Rationale**:
- Ensures deterministic outcomes
- Server is authoritative source
- Prevents infinite loops in conflict resolution

### 3. Resurrection Prevention

**Decision**: **Resurrection Policy: Delete always wins unless recreate** (recommended).

**Rationale**:
- Prevents accidental resurrection of deleted entities
- Maintains data integrity
- Clear semantics: once deleted, always deleted (unless recreated with new ID)
- Recreate = create new entity with new ID; never reuse IDs after deletion
- This prevents ID reuse confusion and ensures clean tombstone semantics
- **Key principle**: Delete always wins, regardless of timestamp ordering, unless explicit recreate action exists

### 4. Additive Merges

**Decision**: New entities are always added, never removed.

**Rationale**:
- Preserves user data
- Offline additions should not be lost
- Simpler mental model for users

## Related Tasks

- **004-persistence-timestamps**: Foundation for timestamp serialization (completed)
- **005-service-layer-timestamps**: Foundation for timestamp application (completed)
- **008-signed-in-local-cache-sync**: Will leverage conflict resolution for cache updates (planned)
