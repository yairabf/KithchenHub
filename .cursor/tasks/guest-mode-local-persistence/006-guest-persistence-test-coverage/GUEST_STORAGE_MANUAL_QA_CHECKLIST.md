# Guest Storage Manual QA Checklist

**Purpose**: Systematic validation of guest storage behavior across all entity types and scenarios.

**Test Environment**: 
- iOS device/simulator
- Android device/emulator
- Web (if applicable)

---

## 1. Storage Initialization

- [ ] App starts with empty storage (no data visible in any section)
- [ ] No errors in console on first launch
- [ ] Storage keys are created correctly (verify via React Native Debugger or similar tool)
- [ ] App functions normally with empty storage (no crashes, UI loads correctly)

---

## 2. Empty Cases

### Recipes
- [ ] Recipes screen shows empty state when storage is empty
- [ ] No crashes when reading empty recipes storage
- [ ] Creating first recipe works correctly

### Shopping Lists
- [ ] Shopping screen shows empty state when storage is empty
- [ ] No crashes when reading empty shopping lists storage
- [ ] Creating first list works correctly

### Shopping Items
- [ ] Shopping items list is empty when storage is empty
- [ ] No crashes when reading empty shopping items storage
- [ ] Creating first item works correctly

### Chores
- [ ] Chores screen shows empty state when storage is empty
- [ ] No crashes when reading empty chores storage
- [ ] Creating first chore works correctly

---

## 3. Invalid Cases

### Corrupted Storage Data
- [ ] App handles corrupted JSON gracefully (returns empty arrays)
  - **How to test**: Use React Native Debugger to inject corrupted JSON into AsyncStorage
  - **Expected**: App continues to function, shows empty state, no crashes
- [ ] App handles invalid JSON gracefully (returns empty arrays)
- [ ] App handles wrong data shapes gracefully (returns empty arrays)
- [ ] No crashes on invalid data
- [ ] Console shows appropriate error messages (for debugging)

### Storage Operation Failures
- [ ] App handles storage write failures gracefully
  - **How to test**: Simulate storage full scenario (if possible) or mock storage failure
  - **Expected**: Error is shown to user, app doesn't crash

---

## 4. Populated Cases - Recipes

### Create Recipe
- [ ] Create recipe → recipe appears in list immediately
- [ ] Close and reopen app → recipe persists and appears in list
- [ ] Recipe data is correct (name, category, ingredients, etc.)

### Update Recipe
- [ ] Update recipe name → change appears immediately
- [ ] Close and reopen app → updated name persists
- [ ] Update recipe category → change persists after app restart
- [ ] Update recipe ingredients → changes persist after app restart

### Delete Recipe
- [ ] Delete recipe → recipe disappears from list immediately
- [ ] Close and reopen app → recipe remains deleted (doesn't reappear)
- [ ] Soft-delete pattern: recipe remains in storage but filtered from UI

### Multiple Recipes
- [ ] Create multiple recipes (5-10) → all appear in list
- [ ] Close and reopen app → all recipes persist correctly
- [ ] No duplicate recipes created
- [ ] Recipe order is preserved (or sorted correctly)

---

## 5. Populated Cases - Shopping

### Shopping Lists

#### Create List
- [ ] Create shopping list → list appears immediately
- [ ] Close and reopen app → list persists and appears in list
- [ ] List data is correct (name, icon, color)

#### Update List
- [ ] Update list name → change appears immediately
- [ ] Close and reopen app → updated name persists
- [ ] Update list icon/color → changes persist after app restart

#### Delete List
- [ ] Delete list → list disappears immediately
- [ ] Close and reopen app → list remains deleted (doesn't reappear)
- [ ] Items in deleted list are handled correctly (orphaned or deleted)

### Shopping Items

#### Create Item
- [ ] Create item in list → item appears immediately
- [ ] Close and reopen app → item persists and appears in list
- [ ] Item data is correct (name, quantity, category, listId)

#### Toggle Item Checked
- [ ] Toggle item checked status → state changes immediately
- [ ] Close and reopen app → checked state persists
- [ ] Multiple toggles work correctly

#### Update Item Quantity
- [ ] Update item quantity → change appears immediately
- [ ] Close and reopen app → updated quantity persists
- [ ] Quantity changes work correctly (increase/decrease)

#### Delete Item
- [ ] Delete item → item disappears immediately
- [ ] Close and reopen app → item remains deleted (doesn't reappear)
- [ ] Soft-delete pattern: item remains in storage but filtered from UI

---

## 6. Populated Cases - Chores

### Create Chore
- [ ] Create chore → chore appears in list immediately
- [ ] Close and reopen app → chore persists and appears in list
- [ ] Chore data is correct (name, assignee, dueDate, section)

### Update Chore
- [ ] Update chore name → change appears immediately
- [ ] Close and reopen app → updated name persists
- [ ] Update chore assignee → change persists after app restart
- [ ] Update chore dueDate → change persists after app restart

### Toggle Chore Completion
- [ ] Toggle chore completion → state changes immediately
- [ ] Close and reopen app → completion state persists
- [ ] Multiple toggles work correctly

### Delete Chore
- [ ] Delete chore → chore disappears immediately
- [ ] Close and reopen app → chore remains deleted (doesn't reappear)
- [ ] Soft-delete pattern: chore remains in storage but filtered from UI

---

## 7. Data Integrity

### No Data Loss
- [ ] Create data in all sections (recipes, shopping, chores)
- [ ] Close and reopen app → all data persists correctly
- [ ] No data corruption after multiple app restarts
- [ ] Data persists after device restart (if possible to test)

### No Duplicate Entities
- [ ] Create multiple entities rapidly → no duplicates created
- [ ] Verify each entity has unique localId
- [ ] No duplicate entities after app restart

### Soft-Deleted Items Don't Reappear
- [ ] Delete recipe → verify it doesn't reappear after app restart
- [ ] Delete shopping item → verify it doesn't reappear after app restart
- [ ] Delete chore → verify it doesn't reappear after app restart
- [ ] Verify deleted items remain in storage (tombstone pattern) but are filtered from UI

### Timestamps Preserved
- [ ] Create entity → verify createdAt timestamp is set
- [ ] Update entity → verify updatedAt timestamp is updated
- [ ] Close and reopen app → timestamps are preserved correctly
- [ ] Timestamps are in correct format (Date objects or ISO strings as expected)

---

## 8. Performance

### Operation Speed
- [ ] Create single entity → completes in <100ms
- [ ] Read all entities (small dataset <100 entities) → completes in <100ms
- [ ] Update single entity → completes in <100ms
- [ ] Delete single entity → completes in <100ms

### UI Responsiveness
- [ ] No UI lag during storage operations
- [ ] App remains responsive during bulk operations (create 10+ entities)
- [ ] No blocking operations that freeze UI
- [ ] Optimistic UI updates work correctly (UI updates immediately, storage happens in background)

### Bulk Operations
- [ ] Create 50+ entities → all persist correctly
- [ ] Read 50+ entities → completes in reasonable time (<500ms)
- [ ] Update multiple entities → all updates persist correctly
- [ ] Delete multiple entities → all deletions persist correctly

---

## 9. Cross-Platform

### iOS
- [ ] All persistence tests pass on iOS device/simulator
- [ ] Storage works correctly on iOS
- [ ] No iOS-specific crashes or errors
- [ ] Performance is acceptable on iOS

### Android
- [ ] All persistence tests pass on Android device/emulator
- [ ] Storage works correctly on Android
- [ ] No Android-specific crashes or errors
- [ ] Performance is acceptable on Android

### Web (if applicable)
- [ ] All persistence tests pass on web
- [ ] Storage works correctly on web (localStorage fallback)
- [ ] No web-specific crashes or errors

---

## 10. Edge Cases

### Rapid Operations
- [ ] Rapid create/update/delete operations → all persist correctly
- [ ] No race conditions or data loss
- [ ] App handles rapid operations without crashes

### Large Datasets
- [ ] Create 100+ entities → all persist correctly
- [ ] App remains responsive with large datasets
- [ ] Read operations complete in reasonable time

### App Lifecycle
- [ ] Data persists after app backgrounded and foregrounded
- [ ] Data persists after app killed and restarted
- [ ] Data persists after device restart (if possible to test)

### Storage Limits
- [ ] App handles storage full scenario gracefully (if possible to test)
- [ ] Error messages are clear and helpful
- [ ] App doesn't crash when storage is full

---

## Test Results

**Tester**: _________________  
**Date**: _________________  
**Platform**: iOS / Android / Web  
**Build Version**: _________________

### Summary
- **Total Tests**: ___
- **Passed**: ___
- **Failed**: ___
- **Blocked**: ___

### Notes
_Add any additional notes, issues, or observations here._

---

## Related Documentation

- [Guest Storage Backend Decision](../../../../docs/architecture/GUEST_STORAGE_DECISION.md)
- [Data Modes Architecture Specification](../../../../docs/architecture/DATA_MODES_SPEC.md)
- [Guest Mode Specifications](../../../../docs/design/GUEST_MODE_SPECS.md)
