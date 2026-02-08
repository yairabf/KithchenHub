# Task: Implement Recipe Image Pipeline

## Goal
Implement a robust, storage-agnostic recipe image pipeline with server-side processing, canonical storage, and optimized caching.

## Project Type
**BACKEND** (Primary Logic) + **MOBILE** (Consumption/Upload)

## Success Criteria
- [ ] Backend accepts image uploads, resizes/optimizes (WebP 1600px/400px), and stores to S3-compatible storage.
- [ ] Database stores versioned keys, not direct URLs.
- [ ] Mobile app uploads via new endpoint and displays images using signed/public URLs with correct caching behavior.
- [ ] Existing images are migrated to the new structure.
- [ ] Integration tests verify the full pipeline using a mock storage adapter.

## Tech Stack
-   **Backend**: NestJS, Prisma, `sharp` (for image processing), `@aws-sdk/client-s3` (for storage).
-   **Storage**: MinIO (S3 Compatible) / Supabase Storage (Future).
-   **Mobile**: React Native, `expo-image` (for caching/display).

## File Structure & Components

### Backend
-   `src/infrastructure/storage/`
    -   `storage.interface.ts` (Interface for getSignedUrl, upload, delete)
    -   `s3-storage.adapter.ts` (Implementation using AWS SDK)
    -   `mock-storage.adapter.ts` (For testing)
-   `src/modules/recipes/`
    -   `images/image-processing.service.ts` (Logic for resizing/converting)
    -   `recipe-images.controller.ts` (Upload endpoint)
    -   `recipe-images.service.ts` (Orchestration)
-   `prisma/schema.prisma` (Update Recipe model)

### Mobile
-   `src/features/recipes/api/recipe-api.ts` (Update upload/fetch logic)
-   `src/features/recipes/components/RecipeImage.tsx` (Component handling cache busting/versions)

## Task Breakdown

### Phase 1: Foundation (Backend)
- [ ] **Install Dependencies**: Add `sharp` and `@types/sharp` to backend.
- [ ] **Define Storage Interface**: Create `StoragePort` interface with methods: `upload(key, buffer, mime)`, `getSignedUrl(key)`.
- [ ] **Implement S3 Adapter**: Create `S3StorageAdapter` implementing `StoragePort` using `@aws-sdk/client-s3`.
- [ ] **Configure Environment**: Add `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` to `.env` and `ConfigService`.
- [ ] **WebP Processing Service**: Create `ImageProcessingService` to convert buffers to WebP (1600px optimized + 400px thumb).

### Phase 2: Database & Data Model
- [ ] **Update Schema**: Add `imageVersion` (Int, default 1), `imageKey` (String?), `thumbKey` (String?) to `Recipe` model in `schema.prisma`.
- [ ] **Generate Migration**: Run `prisma migrate dev --name add_recipe_image_versioning`.

### Phase 3: API Implementation
- [ ] **Upload Endpoint**: Create `POST /recipes/:id/image`.
    -   Validates file type/size.
    -   Increments `imageVersion`.
    -   Processes image -> Main + Thumb.
    -   Uploads to storage with keys: `recipes/{id}/image_v{version}.webp`.
    -   Updates DB record.
    -   Returns new URLs + keys.
- [ ] **Get Recipe Logic**: Update logic to generate signed URLs for `imageKey` and `thumbKey` on read (if private) or public URLs.

### Phase 4: Mobile Integration
- [ ] **Update Upload**: specific `multipart/form-data` upload in `RecipeForm`.
- [ ] **Image Component**: usage of `imageVersion` to bust cache (e.g., append `?v={version}` if needed, or rely on key change).
- [ ] **Verify Display**: Ensure images load correctly in list (thumb) and detail (large).

### Phase 5: Migration & Cleanup
- [ ] **Migration Script**: Create a script `scripts/migrate-recipe-images.ts`.
    -   Iterates all recipes with old `image` URLs.
    -   Downloads old image -> Process -> Upload new format -> Update DB.
- [ ] **Verify Migration**: Run script in staging/local and verify data integrity.

### Phase X: Verification
- [ ] **Unit Tests**: Test `ImageProcessingService` (mock sharp), `RecipeImagesService` (mock storage).
- [ ] **Integration Tests**: Test upload flow with `MockStorageAdapter`.
- [ ] **Manual Verify**: Upload from mobile, check MinIO console, check DB record, check mobile display.
