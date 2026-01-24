# 004 - Recipe Image Uploads (Mobile-Friendly)

**Epic:** Product Improvements (KH-PROD-IMP)
**Created:** 2026-01-23
**Status:** Planning

## Overview
Implement mobile-friendly recipe image uploads with client-side processing to reduce bandwidth and storage costs. Users should be able to add photos to recipes, with images automatically resized and optimized before upload to minimize data usage and storage expenses.

**Problem:** Uploading full-resolution images from mobile devices would consume excessive bandwidth (especially on cellular networks), increase storage costs, slow down uploads, and potentially exceed Supabase Storage limits.

**Solution:** Implement client-side image processing pipeline that resizes, compresses, and validates images before upload, while maintaining good visual quality.

## Architecture

### Components Affected
- **AddRecipeModal** (`mobile/src/features/recipes/components/AddRecipeModal/`)
  - Add photo picker UI with preview
  - Image selection and removal handlers
  - Extend `NewRecipeData` interface with `imageLocalUri` and `imageUrl`

- **RecipesScreen** (`mobile/src/features/recipes/screens/RecipesScreen.tsx`)
  - Integrate image resize and upload flow
  - Handle guest mode (local URI) vs authenticated (cloud upload)
  - Error handling with user-friendly alerts

- **AuthContext** (`mobile/src/contexts/AuthContext.tsx`)
  - Add `householdId` to `User` interface
  - Extract from Supabase user metadata

- **useSupabaseAuth** (`mobile/src/hooks/useSupabaseAuth.ts`)
  - Extract `householdId` from `user_metadata.household_id`

### New Files to Create
- `mobile/src/common/utils/imageConstraints.ts` - Image processing constants
- `mobile/src/common/utils/imageResize.ts` - Client-side resize/validation utility
- `mobile/src/common/utils/imageResize.spec.ts` - Tests for resize utility
- `mobile/src/services/imageUploadService.ts` - Supabase Storage upload service
- `mobile/src/services/imageUploadService.spec.ts` - Tests for upload service

### Files to Modify
- `mobile/package.json` - Add dependencies (expo-image-picker, expo-image-manipulator, expo-file-system)
- `mobile/src/common/utils/index.ts` - Export new utilities
- `mobile/src/features/recipes/components/AddRecipeModal/AddRecipeModal.tsx` - Add photo picker UI
- `mobile/src/features/recipes/components/AddRecipeModal/styles.ts` - Add photo picker styles
- `mobile/src/features/recipes/components/AddRecipeModal/types.ts` - Extend `NewRecipeData`
- `mobile/src/features/recipes/screens/RecipesScreen.tsx` - Integrate upload flow
- `mobile/src/features/recipes/utils/recipeFactory.ts` - Include `imageUrl` in recipe creation
- `docs/features/recipes.md` - Document image upload workflow

### Dependencies Required
- `expo-image-picker@^17.0.10` - Image selection from device
- `expo-image-manipulator@^14.0.8` - Client-side resizing/compression
- `expo-file-system@^19.0.21` - File size validation

## Implementation Steps

### 1. Define Image Constraints
- Create `imageConstraints.ts` with constants:
  - Max dimension: 1024x1024
  - Max file size: 2MB
  - JPEG quality: 0.8
  - Output format: JPEG

### 2. Implement Image Resize Utility (TDD)
- **Write tests first** (`imageResize.spec.ts`):
  - Parameterized tests for validation errors
  - Resize when exceeding max dimensions
  - Keep original when under limits
  - Throw error when exceeding max bytes
  - Handle missing file size
- **Implement** (`imageResize.ts`):
  - `getImageDimensions()` - Read image dimensions
  - `calculateResizeTarget()` - Calculate resize target preserving aspect ratio
  - `getImageFileSizeBytes()` - Get file size for validation
  - `resizeAndValidateImage()` - Main export function

### 3. Implement Image Upload Service (TDD)
- **Write tests first** (`imageUploadService.spec.ts`):
  - Parameterized tests for validation errors
  - Upload success flow
  - Error scenarios (upload failures, signed URL failures)
- **Implement** (`imageUploadService.ts`):
  - `buildRecipeImagePath()` - Generate household-scoped storage path
  - `uploadRecipeImage()` - Upload to Supabase Storage and generate signed URL
  - Error handling for upload and signed URL creation

### 4. Extend Auth Context
- Add `householdId` to `User` interface
- Extract from Supabase user metadata in `useSupabaseAuth`
- Update `AuthContext` to include `householdId` in user object

### 5. Add Photo Picker UI
- Add image picker section to `AddRecipeModal`
- Implement `handleSelectImage()` with permission handling
- Implement `handleRemoveImage()`
- Add preview with placeholder icon
- Style photo picker buttons and preview

### 6. Integrate Upload Flow
- Update `RecipesScreen.handleSaveRecipe()`:
  - Resize image if `imageLocalUri` exists
  - For guests: use local URI
  - For authenticated: upload to Supabase and get signed URL
  - Handle errors with user-friendly alerts

### 7. Update Recipe Factory
- Include `imageUrl` when creating recipe from `NewRecipeData`

### 8. Update Documentation
- Add "Recipe Image Uploads (Mobile)" section to `docs/features/recipes.md`
- Document constraints, flow, and guest mode behavior

## API Changes

### Supabase Storage
- **Bucket**: `household-uploads` (already exists with RLS policies)
- **Path Pattern**: `households/{householdId}/recipes/{recipeId}/{timestamp}.jpg`
- **Signed URLs**: 1-year expiration for persistent access

### No Backend API Changes Required
- Uses existing Supabase Storage infrastructure
- RLS policies already enforce household-scoped access

## Testing Strategy

### Unit Tests
- **imageResize.spec.ts**: 11 parameterized test cases
  - Validation errors (missing/empty URI)
  - Resize scenarios (exceeds limits, under limits)
  - File size validation
  - Error handling

- **imageUploadService.spec.ts**: 11 test cases
  - Path building
  - Parameter validation
  - Upload success flow
  - Error scenarios (upload failures, signed URL failures)

### Integration Tests
- Test full flow: picker → resize → upload → recipe save
- Test guest mode: picker → resize → local URI
- Test error handling: network failures, permission denials

### Manual Testing
- Test on iOS and Android devices
- Test with various image sizes and formats
- Test permission flows
- Test guest mode vs authenticated mode
- Verify images display correctly in recipe cards and detail views

## Success Criteria
- ✅ Images resized client-side to max 1024x1024 before upload
- ✅ All images converted to JPEG format with 0.8 quality
- ✅ File size validated (max 2MB) after resize
- ✅ Images uploaded to Supabase Storage with household-scoped paths
- ✅ Signed URLs generated for persistent access
- ✅ Guest mode keeps images as local URIs
- ✅ All tests passing (target: 127/127)
- ✅ Documentation updated with complete workflow
- ✅ Error handling provides clear user feedback

## Acceptance Criteria
- [ ] User can select image from device in AddRecipeModal
- [ ] Image preview shows selected image
- [ ] User can remove selected image
- [ ] Images automatically resized to max 1024x1024 (preserves aspect ratio)
- [ ] Images converted to JPEG format
- [ ] File size validated (max 2MB)
- [ ] Authenticated users: images uploaded to Supabase Storage
- [ ] Guest users: images kept as local file URIs
- [ ] Signed URLs generated for uploaded images (1-year expiration)
- [ ] Error messages are user-friendly
- [ ] All tests passing
- [ ] Documentation complete
