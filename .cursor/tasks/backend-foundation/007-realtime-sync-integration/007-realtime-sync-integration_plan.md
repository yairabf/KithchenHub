---
name: 007-realtime-sync-integration
overview: Complete instant syncing for shopping list items by integrating realtime updates with cache events for signed-in users, and add comprehensive tests for multi-user syncing and RLS validation.
todos:
  - id: add-realtime-cache-methods
    content: Add applyRealtimeListChange() and applyRealtimeItemChange() methods to CacheAwareShoppingRepository
    status: pending
  - id: create-realtime-hook
    content: Create useShoppingRealtime custom hook following composition patterns
    status: pending
  - id: integrate-realtime-hook
    content: Update ShoppingListsScreen to use custom hook instead of inline useEffect
    status: pending
  - id: add-multi-user-tests
    content: Create integration tests for multi-user syncing scenarios
    status: pending
  - id: add-rls-validation-tests
    content: Create tests validating RLS prevents cross-household data leakage
    status: pending
isProject: false
---

# 007 - Realtime Sync Integration for Shopping Lists/Items

**Epic:** Backend Foundation

**Created:** 2026-01-28

**Status:** Planning

## Overview

Complete the instant syncing feature for shopping lists and items by integrating Supabase realtime subscriptions with the cache layer for signed-in users. Currently, realtime subscriptions work for guest users but only partially for signed-in users (there's a TODO on line 266 of `ShoppingListsScreen.tsx`).

**Problem:** When a signed-in user checks off an item or updates a list on one device, other devices don't see the change instantly because realtime events aren't updating the cache.

**User Story:** As a signed-in user, I want to see shopping list changes instantly across all my devices when another household member checks off items or updates lists.

## Current State

### What's Working

- Realtime subscriptions are set up for both `shopping_lists` and `shopping_items` tables
- Guest mode realtime updates work directly on local state
- RLS policies are in place and filter by `household_id`
- Cache-aware repository emits cache events on writes
- `useCachedEntities` hook subscribes to cache events and updates UI

### What's Missing

- Realtime events for signed-in users don't update the cache (TODO on line 266)
- No integration tests for multi-user syncing scenarios
- No tests validating RLS prevents cross-household data leakage in realtime

## Architecture

### Data Flow for Signed-In Users

```
Realtime Event → Update Cache → Emit Cache Event → useCachedEntities → UI Updates
```

The `CacheAwareShoppingRepository` already follows this pattern for user-initiated actions. We need to apply the same pattern when realtime events arrive.

### Components Affected

**Files to Modify:**

- `mobile/src/features/shopping/screens/ShoppingListsScreen.tsx` - Use custom hook for realtime subscriptions instead of inline useEffect
- `mobile/src/common/repositories/cacheAwareShoppingRepository.ts` - Add helper methods for realtime cache updates

**Files to Create:**

- `mobile/src/features/shopping/hooks/useShoppingRealtime.ts` - Custom hook for realtime subscriptions (following composition patterns)
- `mobile/src/features/shopping/utils/__tests__/realtimeCacheIntegration.test.ts` - Integration tests for multi-user syncing
- `mobile/src/features/shopping/utils/__tests__/realtimeRLSValidation.test.ts` - Tests validating RLS boundaries

## Implementation Steps

### Step 0: Create Test Files First (TDD Approach)

Following `.cursor/rules/coding_rule.mdc` TDD requirements, create test files before implementation:

1. **Create test file for repository methods**: `mobile/src/common/repositories/__tests__/cacheAwareShoppingRepository.realtime.test.ts`
   - Test `applyRealtimeListChange()` with INSERT, UPDATE, DELETE events
   - Test `applyRealtimeItemChange()` with INSERT, UPDATE, DELETE events
   - Test error handling when cache update fails
   - Use parameterized tests: `describe.each([...])` for event types

2. **Create test file for custom hook**: `mobile/src/features/shopping/hooks/__tests__/useShoppingRealtime.test.ts`
   - Test hook subscribes to correct channels
   - Test hook calls repository methods on events
   - Test hook cleanup on unmount
   - Test hook handles errors gracefully

3. **Create integration test files** (as specified in Steps 3-4)

### Step 1: Add Realtime Cache Update Methods to Repository

Add helper methods to `CacheAwareShoppingRepository` that mirror the pattern used in `updateItem`, `createItem`, etc.:

```typescript
// In cacheAwareShoppingRepository.ts

/**
 * Applies a realtime list change to cache
 * Used when realtime events arrive from Supabase
 */
private async applyRealtimeListChange(
  payload: RealtimePostgresChangesPayload<ShoppingListRealtimeRow>
): Promise<void> {
  // Read current cache
  const current = await readCachedEntitiesForUpdate<ShoppingList>('shoppingLists');
  
  // Apply change using existing utility
  const updated = applyShoppingListChange(current, payload);
  
  // Write back to cache
  await setCached('shoppingLists', updated, (l) => this.getListId(l));
  
  // Emit cache event to trigger UI update
  cacheEvents.emitCacheChange('shoppingLists');
}

/**
 * Applies a realtime item change to cache
 * Used when realtime events arrive from Supabase
 */
private async applyRealtimeItemChange(
  payload: RealtimePostgresChangesPayload<ShoppingItemRealtimeRow>,
  groceryItems: GroceryItem[]
): Promise<void> {
  // Read current cache
  const current = await readCachedEntitiesForUpdate<ShoppingItem>('shoppingItems');
  
  // Apply change using existing utility
  const updated = applyShoppingItemChange(current, payload, groceryItems);
  
  // Write back to cache
  await setCached('shoppingItems', updated, (i) => this.getItemId(i));
  
  // Emit cache event to trigger UI update
  cacheEvents.emitCacheChange('shoppingItems');
}
```

**Note:** These methods should handle errors gracefully (log but don't throw) since realtime updates are best-effort.

**Coding Standards (from `.cursor/rules/coding_rule.mdc`):**
- Use descriptive method names: `applyRealtimeListChange`, `applyRealtimeItemChange`
- Add JSDoc comments explaining purpose, parameters, and behavior
- Handle edge cases: null/undefined payloads, missing cache data
- Use try-catch with meaningful error messages

**React Native Best Practices (from `.cursor/skills/vercel-react-native-skills`):**
- Ensure proper cleanup of subscriptions in useEffect (already implemented with unsubscribe/removeChannel)
- Handle async operations in realtime handlers without blocking the UI thread
- Use try-catch for error handling to prevent crashes
- Consider debouncing rapid realtime events if needed to prevent excessive cache writes

### Step 2: Create Custom Hook for Realtime Subscriptions (Composition Pattern)

Following `.cursor/skills/vercel-composition-patterns`, extract realtime subscription logic into a custom hook to decouple state management from UI:

**Create `mobile/src/features/shopping/hooks/useShoppingRealtime.ts`:**

```typescript
/**
 * Custom hook for managing shopping list/item realtime subscriptions
 * 
 * Decouples realtime subscription logic from UI components, following composition patterns.
 * Handles both signed-in (cache-based) and guest (state-based) modes.
 * 
 * @param options - Configuration for realtime subscriptions
 * @returns Object with subscription status and manual control functions
 */
export function useShoppingRealtime(options: {
  isRealtimeEnabled: boolean;
  householdId: string | null;
  isSignedIn: boolean;
  repository: ICacheAwareShoppingRepository | null;
  groceryItems: GroceryItem[];
  listIds: string[];
  onListChange?: (lists: ShoppingList[]) => void; // For guest mode
  onItemChange?: (items: ShoppingItem[]) => void; // For guest mode
}): {
  isSubscribed: boolean;
  error: Error | null;
} {
  // Implementation:
  // 1. Set up list subscription channel
  // 2. Set up item subscription channel (filtered by listIds)
  // 3. Handle events: call repository methods for signed-in, update state for guest
  // 4. Cleanup on unmount or when dependencies change
  // 5. Return subscription status
}
```

**Benefits of Custom Hook:**
- Decouples subscription logic from UI component (composition pattern)
- Reusable across different components if needed
- Easier to test in isolation
- Follows React Native best practices for custom hooks
- Single responsibility: manages realtime subscriptions only

### Step 3: Integrate Custom Hook in ShoppingListsScreen

Update `ShoppingListsScreen.tsx` to use the custom hook instead of inline useEffect:

**Replace the two useEffect blocks (lines 197-281) with:**

```typescript
// Use custom hook for realtime subscriptions
const { isSubscribed, error: realtimeError } = useShoppingRealtime({
  isRealtimeEnabled: isSignedIn && !!user?.householdId,
  householdId: user?.householdId ?? null,
  isSignedIn,
  repository,
  groceryItems,
  listIds: shoppingLists.map(list => list.id),
  onListChange: (lists) => {
    // Guest mode callback
    if (!isSignedIn) {
      setGuestLists(lists);
    }
  },
  onItemChange: (items) => {
    // Guest mode callback
    if (!isSignedIn) {
      setGuestItems(items);
    }
  },
});
```

**Benefits:**
- Removes ~80 lines of useEffect code from component
- Component focuses on UI, hook handles subscriptions
- Easier to test and maintain
- Follows composition patterns (decoupled state management)

**React Native Best Practices:**
- Wrap async operations in try-catch to prevent unhandled promise rejections
- Use `void` operator for fire-and-forget async calls in event handlers: `void repository.applyRealtimeItemChange(...)`
- Ensure handlers don't cause unnecessary re-renders by batching cache updates if multiple events arrive rapidly

### Step 4: Add Multi-User Syncing Integration Tests

Create `mobile/src/features/shopping/utils/__tests__/realtimeCacheIntegration.test.ts`:

**Test Scenarios:**

1. **User A checks item, User B sees update instantly**

            - Mock two repository instances
            - Simulate realtime event for item update
            - Verify cache is updated and event is emitted
            - Verify second repository's cache reflects the change

2. **User A creates item, User B sees it instantly**

            - Test INSERT events update cache correctly

3. **User A deletes item, User B sees removal instantly**

            - Test DELETE events remove from cache correctly

4. **Concurrent updates resolve correctly**

            - Test timestamp-based conflict resolution when realtime events arrive

5. **Cache events trigger UI updates**

            - Mock `useCachedEntities` hook
            - Verify cache events cause hook to re-read cache

### Step 5: Add RLS Validation Tests

Create `mobile/src/features/shopping/utils/__tests__/realtimeRLSValidation.test.ts`:

**Test Scenarios:**

1. **Realtime filter respects household boundaries**

            - Verify subscription filter uses `household_id=eq.${user.householdId}`
            - Verify events from other households are not received

2. **Cross-household data leakage prevention**

            - Mock realtime payload with different household_id
            - Verify cache is not updated with foreign household data

3. **Channel naming includes household ID**

            - Verify channel name format: `shopping-lists-${householdId}`
            - Verify channel name format: `shopping-items-${householdId}`

## Testing Strategy

### Unit Tests

- Test repository realtime update methods handle all event types (INSERT, UPDATE, DELETE)
- Test error handling when cache update fails
- Test cache events are emitted correctly

### Integration Tests

- Multi-user syncing scenarios (Step 4)
- RLS boundary validation (Step 5)
- End-to-end: realtime event → cache update → UI update
- Custom hook integration with repository

### Manual Testing

1. Open app on two devices with same household account
2. Check off item on Device A
3. Verify Device B shows checked state instantly (within 1-2 seconds)
4. Create new item on Device A
5. Verify Device B shows new item instantly
6. Test with different households - verify no cross-household updates

## Success Criteria

- [ ] Realtime events update cache for signed-in users
- [ ] Cache events are emitted, triggering UI updates via `useCachedEntities`
- [ ] Items checked off on one device appear checked on other devices instantly
- [ ] New items created on one device appear on other devices instantly
- [ ] Multi-user syncing integration tests pass
- [ ] RLS validation tests pass
- [ ] No cross-household data leakage in realtime subscriptions
- [ ] TODO comment on line 266 is resolved
- [ ] Error handling is graceful (realtime failures don't crash app)

## Dependencies

- Existing realtime subscriptions (already implemented)
- `CacheAwareShoppingRepository` (already exists)
- `cacheEvents` utility (already exists)
- `useCachedEntities` hook (already exists)
- `applyShoppingListChange` and `applyShoppingItemChange` utilities (already exist)

## Notes

- Realtime updates are best-effort - if cache update fails, log error but don't throw
- Consider adding retry logic for failed cache updates in future enhancement
- The existing conflict resolution logic (`mergeEntitiesWithTombstones`) will handle concurrent modifications correctly

## React Native Performance Considerations

Following `.cursor/skills/vercel-react-native-skills` best practices:

1. **Minimize Re-renders**: Since we're updating cache (not React state directly), and `useCachedEntities` handles UI updates, we avoid unnecessary component re-renders. The cache event system is already optimized.

2. **Proper Cleanup**: The custom hook's `useEffect` cleanup (unsubscribe/removeChannel) follows React Native patterns.

3. **Async Error Handling**: All async operations in realtime handlers must be wrapped in try-catch to prevent unhandled promise rejections that could crash the app.

4. **Fire-and-Forget Pattern**: Use `void` operator for async calls in event handlers to explicitly mark them as fire-and-forget:
   ```typescript
   void repository.applyRealtimeItemChange(typedPayload, groceryItems);
   ```

5. **Performance Monitoring**: Consider adding performance markers if realtime updates become a bottleneck, but initial implementation should be sufficient.

## Composition Patterns Considerations

Following `.cursor/skills/vercel-composition-patterns` best practices:

1. **Decouple State Management from UI**: The custom hook (`useShoppingRealtime`) isolates subscription logic from the UI component, allowing the component to focus on rendering.

2. **Single Responsibility**: Each piece has a clear role:
   - Hook: Manages realtime subscriptions
   - Repository: Handles cache updates
   - Component: Renders UI

3. **Reusability**: The custom hook can be reused in other components if needed without duplicating subscription logic.

4. **Testability**: Extracted hook is easier to test in isolation than inline useEffect logic.

## Coding Standards Compliance

Following `.cursor/rules/coding_rule.mdc`:

1. **Descriptive Names**: 
   - `applyRealtimeListChange` - clearly describes what it does
   - `useShoppingRealtime` - follows hook naming convention

2. **TDD Approach**: Tests are created first (Step 0) before implementation

3. **Parameterized Tests**: All test scenarios use `describe.each([...])` for multiple cases

4. **File Purpose Documentation**: Each new file includes JSDoc explaining its responsibility

5. **Error Handling**: All methods handle edge cases gracefully with meaningful error messages

6. **Type Safety**: Strict TypeScript types for all parameters and return values
