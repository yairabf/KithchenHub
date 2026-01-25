---
name: Update Guest Shopping Service to Use Storage
overview: Wire ShoppingListsScreen handlers to always use shoppingService methods (no userMode branching), ensuring all CRUD operations persist to storage. The service implementation handles guest vs signed-in internally. Also ensure getShoppingData() filters deleted items and add create item handler support.
todos:
  - id: update-toggle-handler
    content: Update handleToggleItemChecked() to always call shoppingService.toggleItem() (remove userMode branching)
    status: pending
  - id: update-delete-handler
    content: Update handleDeleteItem() to always call shoppingService.deleteItem() (remove userMode branching)
    status: pending
  - id: update-quantity-handler
    content: Update handleQuantityChange() to always call shoppingService.updateItem() (remove userMode branching)
    status: pending
  - id: update-create-handlers
    content: Update handleQuickAddItem() and handleAddToList() to always call shoppingService.createItem() (remove userMode branching)
    status: pending
  - id: filter-deleted-items
    content: Ensure getShoppingData() filters out deleted items using isEntityActive()
    status: pending
  - id: add-service-tests
    content: Create LocalShoppingService.spec.ts with tests for toggle/delete/create persistence and soft-delete filtering
    status: pending
  - id: add-integration-tests
    content: Add integration tests for persistence across service recreation
    status: pending
  - id: manual-testing
    content: "Manual testing: verify toggle/delete/create/quantity changes persist after app restart"
    status: pending
isProject: false
---

# 004 - Update Guest Shopping Service to Use Storage

**Epic:** Guest Mode – Local Persistence  
**Created:** 2026-01-25  
**Status:** Planning

## Overview

Wire ShoppingListsScreen handlers to always use shoppingService methods (no userMode branching), ensuring all CRUD operations persist to storage. The service implementation handles guest vs signed-in internally. Also ensure getShoppingData() filters deleted items and add create item handler support.

## Current State Analysis

### What's Already Implemented ✅

1. **Guest Storage Infrastructure**:
   - `guestStorage.ts` - Fully implemented with envelope versioning
   - `guestStorageHelpers.ts` - Generic typed helpers with envelope support
   - Storage keys use centralized `dataModeStorage` utilities
   - All CRUD operations support guest storage

2. **LocalShoppingService** - Fully wired to storage:
   - `getShoppingData()` - Reads from `guestStorage.getShoppingLists()` and `guestStorage.getShoppingItems()` (⚠️ **Missing**: Should filter deleted items)
   - `createList()` - Saves via `guestStorage.saveShoppingLists()`
   - `updateList()` - Saves via `guestStorage.saveShoppingLists()`
   - `deleteList()` - Saves via `guestStorage.saveShoppingLists()` (soft delete)
   - `createItem()` - Saves via `guestStorage.saveShoppingItems()` ✅ **Already uses service**
   - `updateItem()` - Saves via `guestStorage.saveShoppingItems()`
   - `deleteItem()` - Saves via `guestStorage.saveShoppingItems()` (soft delete)
   - `toggleItem()` - Saves via `guestStorage.saveShoppingItems()`
   - **ID Matching**: `findEntityIndex()` already handles both `id` and `localId` matching (`e.id === entityId || e.localId === entityId`)

3. **Service Factory**:
   - `createShoppingService(userMode)` correctly returns `LocalShoppingService` for guest mode
   - `ShoppingListsScreen` creates service instance via `useMemo`

### What's Missing ❌

1. **Screen Handlers Not Using Service** (Branching on userMode):
   - `handleToggleItemChecked()` - Only updates local state, branches on `userMode` to call API directly for signed-in
   - `handleDeleteItem()` - Only updates local state, branches on `userMode` to call API directly for signed-in
   - `handleQuantityChange()` - Only updates local state, branches on `userMode` to call API directly for signed-in
   - `handleQuickAddItem()` / `handleAddToList()` - Only updates local state, branches on `shouldUseMockData` to create items locally vs API

2. **Missing Deleted Item Filtering**:
   - `getShoppingData()` doesn't filter out deleted items (should use `isEntityActive()`)

3. **Persistence Validation**:
   - No tests verifying toggle/delete/create operations persist across service recreation
   - No integration tests for guest mode CRUD flows
   - No tests verifying soft-delete filtering in `getShoppingData()`

4. **Error Handling**:
   - Handlers don't handle service method errors gracefully
   - No user feedback for storage failures

## Implementation Steps

### Step 1: Update ShoppingListsScreen Handlers (Remove userMode Branching)

**File**: `mobile/src/features/shopping/screens/ShoppingListsScreen.tsx`

**Principle**: Screen handlers should always call service methods. The service implementation (LocalShoppingService vs RemoteShoppingService) handles guest vs signed-in internally. This keeps UI code consistent and prevents drift.

**ID Matching**: Handlers use `item.id` to find items. Service methods accept both `id` and `localId` via `findEntityIndex()` which checks `e.id === entityId || e.localId === entityId`. This is already handled correctly.

**Changes**:

1. **Update `handleToggleItemChecked()`**:
   ```typescript
   const handleToggleItemChecked = async (itemId: string) => {
     const targetItem = allItems.find((item) => item.id === itemId || item.localId === itemId);
     if (!targetItem) {
       return;
     }

     const nextChecked = !targetItem.isChecked;

     // Optimistic UI update
     setAllItems((prev) => prev.map((item) =>
       item.id === itemId || item.localId === itemId
         ? { ...item, isChecked: nextChecked }
         : item,
     ));

     // Always call service method (service handles guest vs signed-in internally)
     try {
       await shoppingService.toggleItem(itemId);
     } catch (error) {
       // Revert optimistic update on error
       setAllItems((prev) => prev.map((item) =>
         item.id === itemId || item.localId === itemId
           ? { ...item, isChecked: targetItem.isChecked }
           : item,
       ));
       logShoppingError('Failed to toggle shopping item:', error);
     }
   };
   ```

2. **Update `handleDeleteItem()`**:
   ```typescript
   const handleDeleteItem = async (itemId: string) => {
     const targetItem = allItems.find((item) => item.id === itemId || item.localId === itemId);
     if (!targetItem) {
       return;
     }

     // Optimistic UI update (filter from UI)
     setAllItems((prev) => prev.filter((item) => item.id !== itemId && item.localId !== itemId));

     // Always call service method (service handles soft-delete internally)
     try {
       await shoppingService.deleteItem(itemId);
     } catch (error) {
       // Revert optimistic update on error
       setAllItems((prev) => [...prev, targetItem]);
       logShoppingError('Failed to delete shopping item:', error);
     }
   };
   ```

3. **Update `handleQuantityChange()`**:
   ```typescript
   const handleQuantityChange = async (itemId: string, delta: number) => {
     const targetItem = allItems.find((item) => item.id === itemId || item.localId === itemId);
     if (!targetItem) {
       return;
     }

     const nextQuantity = Math.max(1, targetItem.quantity + delta);
     if (nextQuantity === targetItem.quantity) {
       return;
     }

     // Optimistic UI update
     setAllItems((prev) => prev.map((item) =>
       item.id === itemId || item.localId === itemId
         ? { ...item, quantity: nextQuantity }
         : item,
     ));

     // Always call service method
     try {
       await shoppingService.updateItem(itemId, { quantity: nextQuantity });
     } catch (error) {
       // Revert optimistic update on error
       setAllItems((prev) => prev.map((item) =>
         item.id === itemId || item.localId === itemId
           ? { ...item, quantity: targetItem.quantity }
           : item,
       ));
       logShoppingError('Failed to update shopping item quantity:', error);
     }
   };
   ```

4. **Update `handleQuickAddItem()` and `handleAddToList()`**:
   ```typescript
   const handleQuickAddItem = async (groceryItem: GroceryItem) => {
     const quantity = groceryItem.defaultQuantity;

     // Check if item already exists in the selected list
     const existingItem = allItems.find(
       item => item.name === groceryItem.name && item.listId === activeList.id
     );

     if (existingItem) {
       // Update existing item quantity
       const nextQuantity = existingItem.quantity + quantity;

       // Optimistic UI update
       setAllItems((prev) => prev.map((item) =>
         item.id === existingItem.id || item.localId === existingItem.localId
           ? { ...item, quantity: nextQuantity }
           : item,
       ));

       // Always call service method
       try {
         await shoppingService.updateItem(existingItem.id, { quantity: nextQuantity });
       } catch (error) {
         // Revert optimistic update on error
         setAllItems((prev) => prev.map((item) =>
           item.id === existingItem.id || item.localId === existingItem.localId
             ? { ...item, quantity: existingItem.quantity }
             : item,
         ));
         logShoppingError('Failed to update shopping item quantity:', error);
       }
     } else {
       // Create new item - always call service method
       try {
         const newItem = await shoppingService.createItem({
           name: groceryItem.name,
           listId: activeList.id,
           quantity,
           category: groceryItem.category,
           image: groceryItem.image,
         });
         
         // Update UI with created item
         setAllItems((prev) => [...prev, newItem]);
       } catch (error) {
         logShoppingError('Failed to create shopping item:', error);
       }
     }
   };

   const handleAddToList = async () => {
     if (!selectedGroceryItem) return;

     const quantity = parseInt(quantityInput, 10);
     if (isNaN(quantity) || quantity <= 0) return;

     // Check if item already exists in the selected list
     const existingItem = allItems.find(
       item => item.name === selectedGroceryItem.name && item.listId === activeList.id
     );

     if (existingItem) {
       // Update existing item quantity
       const nextQuantity = existingItem.quantity + quantity;

       // Optimistic UI update
       setAllItems((prev) => prev.map((item) =>
         item.id === existingItem.id || item.localId === existingItem.localId
           ? { ...item, quantity: nextQuantity }
           : item,
       ));

       // Always call service method
       try {
         await shoppingService.updateItem(existingItem.id, { quantity: nextQuantity });
       } catch (error) {
         // Revert optimistic update on error
         setAllItems((prev) => prev.map((item) =>
           item.id === existingItem.id || item.localId === existingItem.localId
             ? { ...item, quantity: existingItem.quantity }
             : item,
         ));
         logShoppingError('Failed to update shopping item quantity:', error);
       }
     } else {
       // Create new item - always call service method
       try {
         const newItem = await shoppingService.createItem({
           name: selectedGroceryItem.name,
           listId: activeList.id,
           quantity,
           category: selectedGroceryItem.category,
           image: selectedGroceryItem.image,
         });
         
         // Update UI with created item
         setAllItems((prev) => [...prev, newItem]);
       } catch (error) {
         logShoppingError('Failed to create shopping item:', error);
       }
     }

     // Reset and close
     setShowQuantityModal(false);
     setSelectedGroceryItem(null);
     setQuantityInput('1');
   };
   ```

**Key Points**:
- **No userMode branching** - Always call service methods
- **Service handles mode internally** - LocalShoppingService writes to AsyncStorage, RemoteShoppingService calls API
- **ID matching** - Use `item.id === itemId || item.localId === itemId` for consistency
- **Optimistic UI updates** - Maintain responsive UX
- **Error handling** - Revert optimistic updates on error
- **Remove direct API calls** - Delete `updateRemoteShoppingItem`, `deleteRemoteShoppingItem`, `addRemoteItems` calls from handlers

### Step 2: Filter Deleted Items in getShoppingData()

**File**: `mobile/src/features/shopping/services/LocalShoppingService.ts`

**Change**: Filter out deleted items when returning shopping data:

```typescript
import { isEntityActive } from '../../../common/types/entityMetadata';

async getShoppingData(): Promise<ShoppingData> {
  // Read from real guest storage, return empty arrays if no data exists
  const guestLists = await guestStorage.getShoppingLists();
  const guestItems = await guestStorage.getShoppingItems();

  // Filter out deleted items (soft-delete tombstone pattern)
  const activeLists = guestLists.filter(isEntityActive);
  const activeItems = guestItems.filter(isEntityActive);

  return {
    shoppingLists: activeLists,
    shoppingItems: activeItems,
    // Categories and grocery items are still from mocks (they're reference data, not user data)
    categories: [...mockCategories],
    groceryItems: [...mockGroceriesDB],
    frequentlyAddedItems: [...mockFrequentlyAddedItems],
  };
}
```

**Note**: This ensures deleted items (with `deletedAt` set) don't appear in the UI, but remain in storage as tombstones.

### Step 3: Add Tests for LocalShoppingService

**File**: `mobile/src/features/shopping/services/LocalShoppingService.spec.ts` (NEW)

**Test Cases**:

1. **Toggle Item Persistence**:
   ```typescript
   describe('toggleItem', () => {
     it('should toggle item checked status and persist to storage', async () => {
       // Create test item
       const item = createShoppingItem(mockGroceryItem, 'list-1', 1);
       await guestStorage.saveShoppingItems([item]);
       
       // Toggle item (use id or localId - both should work)
       const service = new LocalShoppingService();
       const toggled = await service.toggleItem(item.localId);
       
       // Verify toggle
       expect(toggled.isChecked).toBe(!item.isChecked);
       
       // Verify persistence
       const persisted = await guestStorage.getShoppingItems();
       const persistedItem = persisted.find(i => i.localId === item.localId);
       expect(persistedItem?.isChecked).toBe(!item.isChecked);
     });
     
     it('should work with both id and localId', async () => {
       // Test that service accepts both id and localId
       const item = createShoppingItem(mockGroceryItem, 'list-1', 1);
       await guestStorage.saveShoppingItems([item]);
       
       const service = new LocalShoppingService();
       // Should work with localId
       await service.toggleItem(item.localId);
       // Should also work with id
       await service.toggleItem(item.id);
     });
   });
   ```

2. **Delete Item Persistence (Soft-Delete)**:
   ```typescript
   describe('deleteItem', () => {
     it('should soft-delete item and persist to storage', async () => {
       // Create test item
       const item = createShoppingItem(mockGroceryItem, 'list-1', 1);
       await guestStorage.saveShoppingItems([item]);
       
       // Delete item
       const service = new LocalShoppingService();
       await service.deleteItem(item.localId);
       
       // Verify soft-delete (deletedAt set, item still in storage)
       const persisted = await guestStorage.getShoppingItems();
       const deletedItem = persisted.find(i => i.localId === item.localId);
       expect(deletedItem).toBeDefined();
       expect(deletedItem?.deletedAt).toBeDefined();
       expect(deletedItem?.deletedAt).not.toBeNull();
     });
     
     it('should not return deleted items in getShoppingData', async () => {
       // Create and delete item
       const item = createShoppingItem(mockGroceryItem, 'list-1', 1);
       const service = new LocalShoppingService();
       await service.createItem(item);
       await service.deleteItem(item.localId);
       
       // Verify deleted item is filtered out
       const data = await service.getShoppingData();
       const deletedItem = data.shoppingItems.find(i => i.localId === item.localId);
       expect(deletedItem).toBeUndefined();
       
       // But item still exists in storage (tombstone)
       const allItems = await guestStorage.getShoppingItems();
       const tombstone = allItems.find(i => i.localId === item.localId);
       expect(tombstone).toBeDefined();
       expect(tombstone?.deletedAt).toBeDefined();
     });
   });
   ```

3. **Create Item Persistence**:
   ```typescript
   describe('createItem', () => {
     it('should create item and persist to storage', async () => {
       const service = new LocalShoppingService();
       const newItem = await service.createItem({
         name: 'Test Item',
         listId: 'list-1',
         quantity: 2,
         category: 'Other',
       });
       
       // Verify item was created
       expect(newItem.localId).toBeDefined();
       expect(newItem.name).toBe('Test Item');
       
       // Verify persistence
       const persisted = await guestStorage.getShoppingItems();
       const persistedItem = persisted.find(i => i.localId === newItem.localId);
       expect(persistedItem).toBeDefined();
       expect(persistedItem?.name).toBe('Test Item');
     });
   });
   ```

4. **Integration Test - Persistence Across Service Recreation**:
   ```typescript
   describe('Persistence across service recreation', () => {
     it('should persist toggle state after service recreation', async () => {
       // Create item and toggle
       const item = createShoppingItem(mockGroceryItem, 'list-1', 1);
       const service1 = new LocalShoppingService();
       await service1.createItem(item);
       await service1.toggleItem(item.localId);
       
       // Simulate service recreation (new service instance)
       const service2 = new LocalShoppingService();
       const data = await service2.getShoppingData();
       const persistedItem = data.shoppingItems.find(i => i.localId === item.localId);
       
       expect(persistedItem?.isChecked).toBe(true);
     });
     
     it('should persist delete state after service recreation', async () => {
       // Create and delete item
       const item = createShoppingItem(mockGroceryItem, 'list-1', 1);
       const service1 = new LocalShoppingService();
       await service1.createItem(item);
       await service1.deleteItem(item.localId);
       
       // Simulate service recreation
       const service2 = new LocalShoppingService();
       const data = await service2.getShoppingData();
       
       // Deleted item should not appear in active items
       const deletedItem = data.shoppingItems.find(i => i.localId === item.localId);
       expect(deletedItem).toBeUndefined();
     });
   });
   ```

### Step 4: Update Existing Tests

**File**: `mobile/src/features/shopping/services/shoppingService.spec.ts` (if exists)

- Verify service factory returns correct service for guest mode
- Verify service factory returns correct service for signed-in mode
- Add tests verifying service methods handle both modes correctly

### Step 5: Manual Testing Checklist

1. **Toggle Persistence**:
   - [ ] Create shopping item in guest mode
   - [ ] Toggle item checked status
   - [ ] Close and reopen app
   - [ ] Verify item checked status persists

2. **Delete Persistence**:
   - [ ] Create shopping item in guest mode
   - [ ] Delete item (swipe to delete)
   - [ ] Close and reopen app
   - [ ] Verify item remains deleted (not visible)

3. **Quantity Change Persistence**:
   - [ ] Create shopping item in guest mode
   - [ ] Change quantity
   - [ ] Close and reopen app
   - [ ] Verify quantity persists

4. **Error Handling**:
   - [ ] Simulate storage error (if possible)
   - [ ] Verify optimistic update reverts
   - [ ] Verify error is logged

## Files to Modify

1. `mobile/src/features/shopping/screens/ShoppingListsScreen.tsx`
   - Update `handleToggleItemChecked()` to always call `shoppingService.toggleItem()` (remove userMode branching)
   - Update `handleDeleteItem()` to always call `shoppingService.deleteItem()` (remove userMode branching)
   - Update `handleQuantityChange()` to always call `shoppingService.updateItem()` (remove userMode branching)
   - Update `handleQuickAddItem()` to always call `shoppingService.createItem()` or `updateItem()` (remove shouldUseMockData branching)
   - Update `handleAddToList()` to always call `shoppingService.createItem()` or `updateItem()` (remove shouldUseMockData branching)
   - Remove direct API calls (`updateRemoteShoppingItem`, `deleteRemoteShoppingItem`, `addRemoteItems`) from handlers

2. `mobile/src/features/shopping/services/LocalShoppingService.ts`
   - Update `getShoppingData()` to filter deleted items using `isEntityActive()`

## Files to Create

1. `mobile/src/features/shopping/services/LocalShoppingService.spec.ts`
   - Tests for `toggleItem()` persistence
   - Tests for `deleteItem()` persistence
   - Integration tests for persistence across service recreation

## Success Criteria

- ✅ All handlers always call service methods (no userMode branching in screen)
- ✅ `handleToggleItemChecked()` calls `shoppingService.toggleItem()` (works for both guest and signed-in)
- ✅ `handleDeleteItem()` calls `shoppingService.deleteItem()` (works for both guest and signed-in)
- ✅ `handleQuantityChange()` calls `shoppingService.updateItem()` (works for both guest and signed-in)
- ✅ `handleQuickAddItem()` and `handleAddToList()` call `shoppingService.createItem()` or `updateItem()` (works for both guest and signed-in)
- ✅ `getShoppingData()` filters out deleted items (only returns active items)
- ✅ Delete operations use soft-delete (tombstone pattern - `deletedAt` set, item remains in storage)
- ✅ ID matching works with both `id` and `localId` (handlers and service both handle this)
- ✅ Toggle operations persist across service recreation
- ✅ Delete operations persist across service recreation (deleted items don't reappear)
- ✅ Create operations persist across service recreation
- ✅ Quantity changes persist across service recreation
- ✅ Optimistic UI updates maintained for responsive UX
- ✅ Error handling with revert on failure
- ✅ All tests pass (including soft-delete filtering tests)
- ✅ Manual testing confirms persistence

## Testing Strategy

### Unit Tests
- Test `LocalShoppingService` methods persist to `guestStorage`
- Test error handling and revert behavior
- Test persistence across service recreation

### Integration Tests
- Test full CRUD flows in guest mode
- Test persistence across service recreation (simulated app restart)
- Test soft-delete filtering in `getShoppingData()`

### Manual Testing
- Verify toggle/delete/quantity changes persist after app restart
- Verify error handling works correctly
- Verify UI remains responsive during operations

## Risks & Mitigations

### Risk 1: Breaking Existing Signed-In Flow
**Mitigation**: 
- Service abstraction handles both modes - RemoteShoppingService already implements API calls
- Remove direct API calls from handlers, always use service
- Comprehensive testing for both guest and signed-in modes
- Verify RemoteShoppingService methods work correctly

### Risk 2: Performance Impact
**Mitigation**:
- Maintain optimistic UI updates
- Service calls are async and non-blocking
- Storage operations are fast (<100ms typically)

### Risk 3: Error Handling Complexity
**Mitigation**:
- Revert optimistic updates on error
- Use existing error logging pattern
- Clear error messages for debugging