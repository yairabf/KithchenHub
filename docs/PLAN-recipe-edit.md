# PLAN-recipe-edit

**Epic:** Recipes
**Created:** 2026-02-08
**Status:** Planning

## Overview
Enable users to edit existing recipes. This will reuse the existing `AddRecipeModal` logic by refactoring it into a generalized `RecipeFormModal` that supports both creation and editing. Integration points will be added to `RecipeDetailScreen` (header action) and `RecipeCard` (via long-press or direct action).

## Architecture
- **Frontend Refactor:** Convert `AddRecipeModal` to `RecipeFormModal` to accept `initialData`.
- **State Management:** Leverage existing `useRecipes` hook which already supports `updateRecipe`.
- **Navigation/UX:**
  - **Detail View:** Add "Edit" pencil icon to header.
  - **List View:** Add long-press action on `RecipeCard` to trigger edit (or delete).

## Implementation Steps

### Phase 1: Refactor Editor Component
1.  **Rename & Refactor:** Copy/Rename `AddRecipeModal.tsx` to `RecipeFormModal.tsx`.
2.  **Props Update:** Add `initialRecipe?: Recipe` to props.
3.  **State Initialization:** Initialize form state (title, ingredients, instructions, etc.) from `initialRecipe` if present, otherwise use defaults.
4.  **Button Logic:** Change "Save Recipe" to "Update Recipe" when in edit mode.
5.  **Refactor Parent:** Update `AddRecipeModal` usages to use new `RecipeFormModal`.

### Phase 2: Recipe Detail Integration
1.  **Update Screen:** In `RecipeDetailScreen.tsx`:
    - Add logic to open `RecipeFormModal`.
    - Add "Edit" action to `ScreenHeader` (alongside Share).
2.  **Connect State:**
    - Pass current recipe to modal.
    - Handle `onSave` by calling `updateRecipe(id, data)`.
    - Handle success/error states (toast).

### Phase 3: List View Integration (RecipeCard)
1.  **RecipeCard:** Add `onLongPress` prop to `RecipeCard`.
2.  **RecipesScreen:**
    - Handle `onLongPress` to show options (Edit/Delete).
    - If Edit selected, open `RecipeFormModal` with that recipe.
    - *Decision:* Will use standard `ActionSheet` or `Alert` (iOS/Android) for the menu: "Edit Recipe", "Delete Recipe", "Cancel".

## Verification Plan

### Automated Tests
- **Unit Tests:**
  - Update `RecipeFormModal` tests to cover initialization with data.
  - Verify form submission calls correct prop (`onSave`) with updated data.
- **Integration Tests:**
  - Mock `updateRecipe` in `useRecipes`.
  - additional tests in `RecipeDetailScreen` to verify edit flow triggers.

### Manual Verification
1.  **Edit from Detail:**
    - Go to a recipe.
    - Tap Edit icon.
    - Change Title and add an Ingredient.
    - Save.
    - Verify Toast shows success.
    - Verify Detail screen shows new Title/Ingredient immediately.
2.  **Edit from List:**
    - Long press a recipe card.
    - Select "Edit".
    - Change Prep Time.
    - Save.
    - Verify Card updates in the list.
3.  **Cancel:**
    - Open Edit, make changes, close without saving.
    - Verify no changes applied.
