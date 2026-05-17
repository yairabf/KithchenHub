# Unify swipe-to-delete behavior across recipes, shopping, and chores

## Summary

Makes swipe-to-delete fire immediately when a row is swiped in either direction across the app, while preserving the extra confirmation step for recipes.

## What changed

### Shared swipe wrapper
- Added `deleteOnSwipeOpen?: boolean` to `SwipeableWrapper`.
- When enabled, crossing the swipe-open threshold immediately triggers `onSwipeDelete()` on swipe completion instead of requiring a follow-up tap on the trash action.
- Kept the existing reveal-only behavior as the default for consumers that do not enable the new prop.

### Shopping items
- Shopping list items now use `deleteOnSwipeOpen={true}`.
- Swiping either left or right deletes the item immediately.

### Chores
- Chore cards now use `deleteOnSwipeOpen={true}`.
- Swiping either left or right deletes the chore immediately.

### Recipes
- Recipe cards now use `deleteOnSwipeOpen={true}` as well.
- Swiping either left or right opens the existing delete confirmation modal immediately.
- Actual recipe deletion still requires explicit confirmation in the modal.

### Tests
- Added a dedicated `SwipeableWrapper` test covering immediate delete-on-swipe behavior.
- Added a `RecipesScreen` test covering swipe-triggered confirmation.
- Updated shopping and chore tests to assert bidirectional swipe delete configuration.

## How to test

1. **Shopping**
   - Open a shopping list.
   - Swipe an item left or right.
   - Confirm the item is removed immediately without a modal.

2. **Chores**
   - Open chores.
   - Swipe a chore left or right.
   - Confirm the chore is removed immediately without a modal.

3. **Recipes**
   - Open recipes.
   - Swipe a recipe left or right.
   - Confirm the delete confirmation modal appears immediately.
   - Confirming deletes the recipe; canceling keeps it.

## Validation run

- [x] `npx tsc --noEmit`
- [x] Targeted Jest tests for:
  - `SwipeableWrapper`
  - `ShoppingListPanel`
  - `ChoreCard`
  - `RecipesScreen`
  - `ShoppingListsScreen.deletion`

## Notes

- Existing test output still includes unrelated warnings (for example `SafeAreaView` deprecation and existing test-environment warnings), but the targeted suites pass.
- This change intentionally allows deletion-triggering swipes from **either** direction for all three surfaces; recipes remain the only flow that requires confirmation before the delete completes.
