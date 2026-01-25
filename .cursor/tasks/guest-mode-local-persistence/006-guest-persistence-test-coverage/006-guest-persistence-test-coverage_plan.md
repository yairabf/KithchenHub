---
name: Guest Persistence Test Coverage
overview: Test coverage plan for guest storage behavior, focusing on storage layer tests (guestStorageHelpers and guestStorage) with empty, invalid, and populated data cases. Includes minimal service smoke tests to verify storage persistence and a manual QA checklist.
todos:
  - id: audit-storage-tests
    content: Audit existing guestStorageHelpers and guestStorage tests to identify gaps in empty/invalid/populated cases
    status: completed
  - id: close-storage-gaps
    content: Close any remaining gaps in storage layer tests (envelope parsing, invalid data, version defaults, key wiring)
    status: completed
  - id: add-integration-tests
    content: Add minimal stable integration tests (corruption recovery, clearAll, cross-entity independence)
    status: completed
  - id: add-service-smoke-tests
    content: Add minimal service smoke tests to verify storage persistence (one test per service, not full CRUD)
    status: completed
  - id: create-manual-qa-checklist
    content: Create manual QA checklist documenting storage behavior validation steps
    status: completed
isProject: false
---

# 006 - Guest Persistence Test Coverage

**Epic:** Guest Mode – Local Persistence  
**Created:** 2026-01-25  
**Completed:** 2026-01-25  
**Status:** Completed

## Goal

Test guest storage behavior thoroughly with focus on:
- **Empty cases**: Read returns `[]` with no crash
- **Invalid cases**: Corrupted JSON, wrong shape, invalid entities → safe fallback
- **Populated cases**: Round-trip read/write works, legacy format upgrades, version defaults

## Current State Analysis

### Storage Layer Tests (Core Focus) ✅

#### `guestStorageHelpers.spec.ts` (351 lines)
**Status**: Strong coverage, verify completeness

- ✅ Empty storage → default envelope
- ✅ Invalid JSON → default envelope
- ✅ Wrong shape → default envelope
- ✅ Valid envelope format → returns envelope
- ✅ Legacy array format → upgrades to envelope
- ✅ Invalid entities → filtered out
- ✅ Version defaults to 1 if missing
- ✅ Future version detection → graceful degradation
- ✅ Round-trip persistence

**Potential Gaps to Verify**:
- [ ] All entity validators tested with edge cases (empty strings, null values, missing fields)
- [ ] Performance monitoring thresholds tested (if applicable)
- [ ] Timestamp normalization edge cases

#### `guestStorage.spec.ts` (348 lines)
**Status**: Strong coverage, verify completeness

- ✅ All entity types tested: recipes, shopping lists, items, chores
- ✅ Empty storage → empty arrays
- ✅ Invalid JSON → empty arrays
- ✅ Valid envelope format → returns data
- ✅ Legacy array format → returns data (upgraded)
- ✅ Non-array data → empty arrays
- ✅ Array with invalid items → empty arrays (filtered)
- ✅ Round-trip persistence for all entity types
- ✅ Storage operation failures → errors thrown
- ✅ Key wiring verified (uses `getGuestStorageKey()`)

**Potential Gaps to Verify**:
- [ ] All entity types have identical test coverage
- [ ] Key generation consistency verified
- [ ] `clearAll()` removes all keys correctly

### Service Layer Tests (Out of Scope for This Plan)

**Note**: Comprehensive service CRUD tests are a separate task. This plan includes only minimal smoke tests to verify storage persistence.

- **LocalShoppingService.spec.ts**: Comprehensive (23 tests) - ✅ Good reference
- **recipeService.spec.ts**: Basic coverage - ⚠️ Not focus of this plan
- **choresService.spec.ts**: Minimal - ⚠️ Not focus of this plan

### What's Missing ❌

#### Storage Layer Gaps
1. **Integration tests** - Cross-entity independence, corruption recovery, clearAll
2. **Service smoke tests** - Minimal verification that services persist to storage correctly
3. **Manual QA documentation** - No formal checklist exists

#### Backend Tests
- No backend tests needed (guest mode is mobile-only, no API calls)

## Implementation Plan

### Task 1: Audit and Close Storage Test Gaps

**Files**: 
- `mobile/src/common/utils/guestStorageHelpers.spec.ts`
- `mobile/src/common/utils/guestStorage.spec.ts`

**Goal**: Verify all empty/invalid/populated cases are covered, close any gaps.

#### Test Groups to Verify

**1. Empty Cases**:
- [ ] `readEntityEnvelope()` with `null` storage → returns default envelope
- [ ] `guestStorage.get*()` with empty storage → returns `[]`
- [ ] All entity types tested for empty case

**2. Invalid Cases**:
- [ ] Corrupted JSON → safe fallback (default envelope or `[]`)
- [ ] Wrong shape (not envelope, not array) → safe fallback
- [ ] Invalid entities (missing required fields) → filtered out
- [ ] Storage operation failures → errors thrown (not swallowed)
- [ ] All entity types tested for invalid cases

**3. Populated Cases**:
- [ ] Round-trip read/write works for all entity types
- [ ] Legacy array format upgrades to envelope on read
- [ ] Version defaults to 1 if missing
- [ ] Envelope format persists correctly
- [ ] Timestamps normalized correctly (ISO ↔ Date)

**Action Items**:
1. Review existing tests against these groups
2. Identify missing test cases
3. Add tests for any gaps found
4. Ensure consistent coverage across all entity types

**Success Criteria**:
- All empty cases covered for all entity types
- All invalid cases covered with safe fallbacks
- All populated cases covered with round-trip verification
- No regressions in existing tests

### Task 2: Add Minimal Integration Tests

**File**: `mobile/src/common/utils/__tests__/guestStorage.integration.spec.ts` (NEW)

**Test Cases** (Minimal, Stable):

1. **Cross-Entity Independence**:
   ```typescript
   describe('Cross-entity independence', () => {
     it('should persist all entity types independently', async () => {
       // Create recipe, shopping list, item, chore
       // Verify all persist correctly
       // Verify no cross-contamination (keys are separate)
     });
   });
   ```

2. **Storage Corruption Recovery**:
   ```typescript
   describe('Storage corruption recovery', () => {
     describe.each([
       ['recipes', ENTITY_TYPES.recipes],
       ['shoppingLists', ENTITY_TYPES.shoppingLists],
       ['shoppingItems', ENTITY_TYPES.shoppingItems],
       ['chores', ENTITY_TYPES.chores],
     ])('for %s', (entityName, entityType) => {
       it('should recover from corrupted data gracefully', async () => {
         // Simulate corrupted JSON in storage
         // Verify returns empty array, doesn't crash
         // Verify app continues to function
       });
     });
   });
   ```

3. **Clear All Operation**:
   ```typescript
   describe('clearAll', () => {
     it('should clear all entity types', async () => {
       // Create data for all types
       // Call clearAll
       // Verify all keys are removed
       // Verify subsequent reads return empty arrays
     });
   });
   ```

**Note**: Concurrent writes test removed - AsyncStorage is inherently last-write-wins, and concurrent tests can be flaky. This behavior is documented in `GUEST_STORAGE_DECISION.md`.

**Success Criteria**:
- Cross-entity independence verified
- Corruption recovery tested for all entity types
- ClearAll operation verified
- Tests are stable and non-flaky

### Task 3: Add Service Smoke Tests (Minimal)

**Goal**: Verify services persist to storage correctly. Not comprehensive CRUD tests.

**Files**:
- `mobile/src/features/recipes/services/recipeService.spec.ts` (add one smoke test)
- `mobile/src/features/chores/services/choresService.spec.ts` (add one smoke test)

**Test Cases** (One per service):

1. **LocalRecipeService Smoke Test**:
   ```typescript
   describe('Storage persistence (smoke test)', () => {
     it('should persist recipe to guestStorage', async () => {
       const service = new LocalRecipeService();
       const recipe = await service.createRecipe({ name: 'Test Recipe' });
       
       // Verify storage was called
       expect(guestStorage.saveRecipes).toHaveBeenCalled();
       
       // Verify recipe can be retrieved
       (guestStorage.getRecipes as jest.Mock).mockResolvedValue([recipe]);
       const retrieved = await service.getRecipes();
       expect(retrieved).toContainEqual(expect.objectContaining({ name: 'Test Recipe' }));
     });
   });
   ```

2. **LocalChoresService Smoke Test**:
   ```typescript
   describe('Storage persistence (smoke test)', () => {
     it('should persist chore to guestStorage', async () => {
       const service = new LocalChoresService();
       const chore = await service.createChore({ name: 'Test Chore' });
       
       // Verify storage was called
       expect(guestStorage.saveChores).toHaveBeenCalled();
       
       // Verify chore can be retrieved
       (guestStorage.getChores as jest.Mock).mockResolvedValue([chore]);
       const retrieved = await service.getChores();
       expect(retrieved).toContainEqual(expect.objectContaining({ name: 'Test Chore' }));
     });
   });
   ```

**Note**: LocalShoppingService already has comprehensive tests (23 tests). These smoke tests are only for services missing storage persistence verification.

**Success Criteria**:
- One smoke test per service verifies storage persistence
- Tests verify storage methods are called
- Tests verify data can be round-tripped through storage
- Not comprehensive CRUD tests (those are separate task)

### Task 4: Create Manual QA Checklist

**File**: `.cursor/tasks/guest-mode-local-persistence/006-guest-persistence-test-coverage/GUEST_STORAGE_MANUAL_QA_CHECKLIST.md` (NEW)

**Checklist Sections**:

1. **Storage Initialization**:
   - [ ] App starts with empty storage (no data visible)
   - [ ] No errors in console on first launch
   - [ ] Storage keys are created correctly

2. **Empty Cases**:
   - [ ] All entity types return empty arrays when storage is empty
   - [ ] No crashes when reading empty storage
   - [ ] App functions normally with empty storage

3. **Invalid Cases**:
   - [ ] App handles corrupted storage gracefully (returns empty arrays)
   - [ ] App handles invalid JSON gracefully (returns empty arrays)
   - [ ] App handles wrong data shapes gracefully (returns empty arrays)
   - [ ] No crashes on invalid data

4. **Populated Cases - Recipes**:
   - [ ] Create recipe → persists after app restart
   - [ ] Update recipe → changes persist after app restart
   - [ ] Delete recipe → remains deleted after app restart
   - [ ] Multiple recipes → all persist correctly

5. **Populated Cases - Shopping**:
   - [ ] Create list → persists after app restart
   - [ ] Update list → changes persist after app restart
   - [ ] Delete list → remains deleted after app restart
   - [ ] Create item → persists after app restart
   - [ ] Toggle item checked → state persists after app restart
   - [ ] Update item quantity → persists after app restart
   - [ ] Delete item → remains deleted after app restart

6. **Populated Cases - Chores**:
   - [ ] Create chore → persists after app restart
   - [ ] Update chore → changes persist after app restart
   - [ ] Toggle chore completion → state persists after app restart
   - [ ] Delete chore → remains deleted after app restart

7. **Data Integrity**:
   - [ ] No data loss after app restart
   - [ ] No duplicate entities created
   - [ ] Soft-deleted items don't reappear
   - [ ] Timestamps are preserved correctly

8. **Performance**:
   - [ ] Operations complete in <100ms for small datasets (<100 entities)
   - [ ] No UI lag during storage operations
   - [ ] App remains responsive during bulk operations

9. **Cross-Platform**:
   - [ ] iOS: All persistence tests pass
   - [ ] Android: All persistence tests pass
   - [ ] Web (if applicable): All persistence tests pass

**Success Criteria**:
- Comprehensive checklist covering all test groups (empty, invalid, populated)
- Clear pass/fail criteria for each item
- Includes error scenarios and performance checks
- Platform-specific validation included

## Files to Create

1. `mobile/src/common/utils/__tests__/guestStorage.integration.spec.ts` (NEW)
2. `.cursor/tasks/guest-mode-local-persistence/006-guest-persistence-test-coverage/GUEST_STORAGE_MANUAL_QA_CHECKLIST.md` (NEW)

## Files to Modify

1. `mobile/src/common/utils/guestStorageHelpers.spec.ts` (close any gaps found in audit)
2. `mobile/src/common/utils/guestStorage.spec.ts` (close any gaps found in audit)
3. `mobile/src/features/recipes/services/recipeService.spec.ts` (add one smoke test)
4. `mobile/src/features/chores/services/choresService.spec.ts` (add one smoke test)

## Testing Strategy

### Storage Layer Tests (Core)

**Test Groups**:
1. **Empty Cases**: Read returns `[]` with no crash
   - All entity types
   - All read methods (`getRecipes`, `getShoppingLists`, etc.)
   
2. **Invalid Cases**: Corrupted JSON, wrong shape, invalid entities → safe fallback
   - Invalid JSON strings
   - Wrong data shapes (not envelope, not array)
   - Invalid entities (missing required fields)
   - Storage operation failures
   
3. **Populated Cases**: Round-trip read/write works, legacy format upgrades, version defaults
   - Valid envelope format
   - Legacy array format (upgrades on read)
   - Version defaults to 1 if missing
   - Round-trip persistence for all entity types

### Integration Tests (Minimal, Stable)

- Cross-entity independence (no cross-contamination)
- Corruption recovery (graceful degradation)
- ClearAll operation (all keys removed)

### Service Smoke Tests (Minimal)

- One test per service to verify storage persistence
- Not comprehensive CRUD tests (separate task)

### Manual QA

- Use checklist for systematic validation
- Test on real devices (iOS and Android)
- Verify performance characteristics
- Test error scenarios

## Success Criteria

### Storage Layer Tests
- ✅ **Empty cases**: All entity types return `[]` when storage is empty
- ✅ **Invalid cases**: All invalid data scenarios handled gracefully (safe fallback)
- ✅ **Populated cases**: Round-trip read/write works for all entity types
- ✅ Legacy format upgrades verified
- ✅ Version defaults verified

### Integration Tests
- ✅ Cross-entity independence verified
- ✅ Corruption recovery tested for all entity types
- ✅ ClearAll operation verified

### Service Smoke Tests
- ✅ One smoke test per service verifies storage persistence
- ✅ Tests verify storage methods are called correctly

### Manual QA
- ✅ Comprehensive checklist documents all validation steps
- ✅ Clear pass/fail criteria for each item

### Code Quality
- ✅ All tests follow coding standards (parameterized, descriptive names)
- ✅ Tests prevent regressions in storage behavior

## Dependencies

- Existing test infrastructure (Jest, mocks)
- `guestStorage` and `guestStorageHelpers` modules
- Service implementations (LocalRecipeService, LocalShoppingService, LocalChoresService)
- Entity types and factories

## Out of Scope

### Service Layer Comprehensive Tests
- Full CRUD test coverage for LocalChoresService (separate task)
- Full CRUD test coverage for LocalRecipeService (separate task)
- These test service logic, not storage behavior

### Concurrent Write Tests
- AsyncStorage is inherently last-write-wins
- Concurrent tests can be flaky
- Behavior is documented in `GUEST_STORAGE_DECISION.md`

## Risks & Mitigations

### Risk 1: Missing Storage Test Gaps
**Mitigation**: Systematic audit of existing tests against empty/invalid/populated groups, document any gaps found

### Risk 2: Integration Test Flakiness
**Mitigation**: Keep integration tests minimal and stable (no concurrent writes), focus on deterministic scenarios

### Risk 3: Manual QA Incomplete
**Mitigation**: Create detailed checklist with clear pass/fail criteria, include error scenarios and performance checks

## Related Documentation

- [Guest Storage Backend Decision](../../../docs/architecture/GUEST_STORAGE_DECISION.md)
- [Data Modes Architecture Specification](../../../docs/architecture/DATA_MODES_SPEC.md)
- [Guest Mode Specifications](../../../docs/design/GUEST_MODE_SPECS.md)
