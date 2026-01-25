---
name: Decide Guest Storage Backend (AsyncStorage v1)
overview: Select AsyncStorage for guest persistence and document a clear migration path to a database-backed solution when scale or complexity requires it.
todos:
  - id: create-decision-doc
    content: Create docs/architecture/GUEST_STORAGE_DECISION.md with decision, limits, triggers, and migration outline
    status: completed
  - id: update-architecture-spec
    content: Update DATA_MODES_SPEC.md to reference decision doc and clarify AsyncStorage v1 status
    status: completed
  - id: add-inline-docs
    content: Add module-level JSDoc to guestStorage.ts documenting AsyncStorage choice and limits
    status: completed
  - id: add-monitoring-hooks
    content: Add optional performance logging to guestStorage methods for trigger detection
    status: completed
isProject: false
---

# 001 - Decide Guest Storage Backend (AsyncStorage v1)

**Epic:** Guest Mode – Local Persistence  
**Created:** 2026-01-25  
**Status:** Completed

## Overview

Select **AsyncStorage** as the persistence mechanism for **Guest Mode (v1)** and document its operational limits along with clear, measurable triggers for migrating to a database-backed solution (e.g., SQLite or WatermelonDB).

This plan exists to:
- Lock the initial decision
- Avoid premature complexity
- Prevent future ambiguity about *when* and *why* a migration should happen

## Decision

**AsyncStorage is the chosen backend for Guest Mode v1.**

### Rationale
- Guest data scope is limited (shopping lists, recipes, chores)
- AsyncStorage is fast to implement and easy to reason about
- JSON persistence aligns with current guest-only data flows
- Avoids introducing database complexity before it is justified

## Known Limits (Documented)

AsyncStorage is acceptable **only while the following constraints hold**:

### 1. Performance Limits
- **Read/Write Pattern**: Full collection read → modify → full collection write
- **Scalability**: Linear degradation with payload size
- **No Partial Updates**: Updating one item requires rewriting entire collection
- **No Indexing**: All filtering is done in-memory

### 2. Atomicity Limits
- **No Transactions**: Multiple related writes cannot be atomic
- **Race Conditions**: Concurrent writes can overwrite data without a single-writer pattern
- **Partial Writes**: If app crashes mid-write, data may be corrupted

### 3. Query Limitations
- **No SQL Queries**: Cannot filter, sort, or join at storage level
- **No Indexing**: No performance optimization for large datasets
- **Full Collection Load**: Must load entire collection to find one item

### 4. Concurrency Limits
- **Single Writer Pattern Required**: Must implement application-level locking
- **No Optimistic Locking**: No built-in conflict detection
- **Write Conflicts**: Last write wins (no merge semantics)

## Migration Triggers

Migration to SQLite / WatermelonDB should be initiated when **any** of the following become true:

### 1. Data Size
- Guest data regularly exceeds **~1,000 total entities**, or
- Any single persisted payload exceeds **~1–2 MB**

### 2. Performance
- Read or write operations exceed **~100–200ms** on mid-range devices
- UI stutters during AsyncStorage operations

### 3. Feature Requirements
- Need partial updates (update one item without rewriting full collection)
- Need local indexing or complex queries
- Guest mode begins to require offline sync or conflict resolution logic

### 4. Reliability
- Evidence of lost updates due to overlapping writes
- Increased reports of guest data being overwritten or disappearing

## Migration Plan (Outlined)

When a trigger is hit:

1. Read existing AsyncStorage guest data
2. Transform data into DB-ready entities
3. Write data into SQLite / WatermelonDB
4. Mark migration as completed (version flag or meta key)
5. Stop writing to AsyncStorage keys
6. (Optional) Clean up old AsyncStorage data after verification

Rollback rule:
- If migration fails, do **not** mark as completed and continue using AsyncStorage

## Implementation Steps

1. **Create Decision Document**
   - Document AsyncStorage choice, rationale, and limits
   - Define measurable migration triggers
   - Outline migration plan with rollback strategy

2. **Update Architecture Documentation**
   - Update `DATA_MODES_SPEC.md` to reference decision document
   - Clarify AsyncStorage v1 status

3. **Add Inline Documentation**
   - Add module-level JSDoc to `guestStorage.ts`
   - Reference decision document
   - Note operational limits

4. **Add Performance Monitoring**
   - Add performance logging to `guestStorage` methods
   - Track entity counts and payload sizes
   - Log operation durations for trigger detection

## Files to Create/Modify

### New Files
1. `docs/architecture/GUEST_STORAGE_DECISION.md` - Decision document

### Modified Files
1. `docs/architecture/DATA_MODES_SPEC.md` - Reference decision, clarify v1 status
2. `mobile/src/common/utils/guestStorage.ts` - Add inline documentation and performance monitoring

## Success Criteria

- ✅ Decision to use AsyncStorage is explicitly documented in architecture docs
- ✅ Operational limits are clearly stated and measurable
- ✅ Migration triggers are unambiguous and measurable
- ✅ High-level migration plan exists to guide future work
- ✅ Architecture spec references the decision document
- ✅ Code includes inline documentation referencing the decision
- ✅ Performance monitoring enables trigger detection

## Testing Strategy

- Verify all existing tests pass (403/403 tests)
- Confirm no regressions in guest storage functionality
- Validate performance monitoring works correctly
- Ensure validation logic is correct

## Related Tasks

- **007-guest-local-persistence**: Initial guest storage implementation (completed)
- Future: Migration to SQLite/WatermelonDB when triggers are met
