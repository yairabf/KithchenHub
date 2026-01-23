# 005 - Recipe Image Orphan Cleanup

**Epic:** product-improvements
**Created:** 2026-01-23
**Status:** Planning

## Overview
- Prevent orphaned Supabase Storage uploads by creating recipes before image upload.
- Use the server recipe ID in storage paths, then update the recipe with the image URL.
- Delete uploaded images if the post-upload update fails.

## Architecture
- **Components affected:** `RecipesScreen`, `useRecipes`, recipe service, image upload service.
- **New files to create:** none.
- **Files to modify:** recipe creation flow, services, tests.
- **Dependencies required:** none.

## Implementation Steps
1. Add unit tests for `deleteRecipeImage` and `updateRecipe` using parameterized cases.
2. Implement `deleteRecipeImage` in `imageUploadService` using Supabase storage remove.
3. Extend recipe service contract with `updateRecipe` and implement local/remote versions.
4. Expose `updateRecipe` in `useRecipes` and update local state immutably.
5. Refactor recipe creation flow to create → upload → update with cleanup on failure.

## API Changes (if applicable)
- `PUT /recipes/:id` used to update `imageUrl` after upload.

## Testing Strategy
- Unit tests for new service methods and error handling.
- Manual test: create recipe with image as authenticated user, simulate update failure, confirm cleanup.

## Success Criteria
- Uploaded images use server recipe ID in the path.
- Uploaded image is deleted when update fails after upload.
- New tests pass and no lint errors introduced.
