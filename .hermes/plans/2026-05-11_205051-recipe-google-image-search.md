# Recipe Google Image Search Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Let users choose a recipe photo from a web image search while creating or editing a recipe, without requiring them to take or upload their own photo.

**Architecture:** Add a backend-owned Google Programmable Search / Custom Search JSON API integration so mobile never receives the Google API key. Mobile adds a polished "Search web images" path inside `AddRecipeModal`, lets the user search/select an image, previews it immediately, and saves the selected remote image URL through the existing `imageUrl` recipe field. Keep local photo upload unchanged.

**Tech Stack:** NestJS backend, Google Custom Search JSON API, React Native / Expo mobile, existing recipe image fields (`imageUrl`, `thumbUrl`, `imageVersion`), Jest tests.

---

## Current Context

### Existing mobile flow

- Create/edit recipe UI lives in:
  - `mobile/src/features/recipes/components/AddRecipeModal/AddRecipeModal.tsx`
  - `mobile/src/features/recipes/components/AddRecipeModal/types.ts`
  - `mobile/src/features/recipes/components/AddRecipeModal/styles.ts`
- It currently uses `expo-image-picker`:
  - `handleSelectImage()` asks photo-library permission.
  - `ImagePicker.launchImageLibraryAsync(...)` selects a local photo.
  - Local photo state is tracked with:
    - `imageUri`
    - `imageIsLocal`
    - `removeImage`
- Save payload already distinguishes local vs remote image:
  - `imageLocalUri: imageIsLocal ? imageUri : undefined`
  - `imageUrl: !imageIsLocal && !removeImage ? imageUri : undefined`
- `RecipesScreen.tsx` already passes local image URIs through existing recipe service upload logic.
- `RemoteRecipeService.createRecipe()` / `updateRecipe()` already upload only local image URIs; non-local URLs pass through as `imageUrl`.

### Existing backend/image flow

- Backend recipe DTOs already accept `imageUrl?: string`:
  - `backend/src/modules/recipes/dtos/create-recipe.dto.ts`
  - `backend/src/modules/recipes/dtos/update-recipe.dto.ts`
- Existing dedicated image upload endpoint exists for local uploads:
  - `backend/src/modules/recipes/controllers/recipe-images.controller.ts`
  - `backend/src/modules/recipes/services/recipe-images.service.ts`
- Env validation already supports Google OAuth keys, but **not** Google image search keys:
  - `backend/src/config/env.validation.ts`
  - `backend/src/config/configuration.ts`

## Product Decisions / Recommendations

1. Use the phrase **"Search web images"** or **"Search Google images"** in UI, but include a small note like:
   - "Images come from the web. Check usage rights before publishing or sharing."
2. Do **not** scrape Google Images pages.
3. Use Google Programmable Search / Custom Search JSON API with `searchType=image`.
4. Keep the MVP snappy and low-risk by storing the selected image URL in `imageUrl` first.
5. Later, if broken/hotlinked images become a problem, add a second phase where backend imports/downloads the selected image into app storage.

## Proposed UX

Inside the Recipe Photo section:

- Keep existing primary photo button: **Add photo** / **Change photo**.
- Add secondary button: **Search web images**.
- Tapping opens a bottom sheet/full-screen selector:
  - Search field prefilled from recipe title when available.
  - Search results grid: 2 columns on phone, larger grid on tablet.
  - Each result shows thumbnail, source domain/page title, and optional provider label.
  - Selecting a result closes selector and updates the recipe preview immediately.
- If a selected web image exists:
  - Save button should send it as `imageUrl`, not `imageLocalUri`.
  - Remove Photo still clears it.
- If user later picks a local photo:
  - Replace selected web URL and set `imageIsLocal = true`.

## Existing Supabase / Storage Limits Found

Current code does **not** appear to enforce a persistent per-household total image quota/count. What exists today is upload safety and per-user rate limiting:

- Storage provider is selected via `STORAGE_PROVIDER`; `supabase` uses `SupabaseStorageAdapter`, otherwise the infrastructure adapter falls back to S3/MinIO.
- Supabase storage requires:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `STORAGE_BUCKET`
- The recommended/final env template sets:
  - `STORAGE_PROVIDER=supabase`
  - `STORAGE_BUCKET=household-uploads`
- Recipe image object paths are versioned by household and recipe:
  - `households/{householdId}/recipes/{recipeId}/image_v{version}.webp`
  - `households/{householdId}/recipes/{recipeId}/thumb_v{version}.webp`
- Each upload stores two objects: main image + thumbnail.
- Upload file size limit: `RECIPE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024` (5MB), also registered in Fastify multipart limits.
- Allowed upload MIME types: JPG/JPEG, PNG, WebP.
- Image processing limits:
  - max input side: `10000px`
  - max pixels: `25_000_000`
  - main output max dimension: `1600px`
  - thumbnail size: `400px`
  - outputs are WebP.
- Signed URL TTL default: `RECIPE_IMAGE_SIGNED_URL_TTL_SECONDS=604800` (7 days).
- Upload rate limit defaults:
  - `RECIPE_IMAGE_UPLOADS_PER_HOUR=60`
  - `RECIPE_IMAGE_UPLOAD_BURST=10`
- Important detail: the rate limiter key is currently `userId`, not `householdId`, even though objects are stored under household paths.
- Important storage cleanup gap: uploading a new version increments `imageVersion` and writes new `image_vN` / `thumb_vN` objects, but I did not find deletion of older versions when an image is replaced or a recipe is deleted.
- Web/remote images stored as `imageUrl` do not hit Supabase storage and do not consume this upload rate limit/storage path.

### Implication for Google image search

For the first PR, selecting a Google/web result as a remote `imageUrl` should **not** count against Supabase storage uploads, because it does not upload a file. That keeps the feature lightweight and avoids burning household storage quota.

If we later add "import selected web image into Supabase storage", then it should intentionally go through the same recipe image pipeline and probably add/adjust a real household-level quota before launch.

## Backend API Design

### New endpoint

`GET /v1/recipe-images/search?query=omelet&limit=12`

Authenticated route. Return:

```ts
type RecipeImageSearchResultDto = {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  sourceDisplayName?: string;
  width?: number;
  height?: number;
};
```

Suggested files:

- Create: `backend/src/modules/recipes/dtos/recipe-image-search.dto.ts`
- Create: `backend/src/modules/recipes/services/recipe-image-search.service.ts`
- Modify: `backend/src/modules/recipes/controllers/recipe-images.controller.ts`
- Modify: `backend/src/modules/recipes/recipes.module.ts`
- Modify: `backend/src/config/env.validation.ts`
- Modify: `backend/src/config/configuration.ts`

### Env vars

Add optional env vars:

```env
GOOGLE_IMAGE_SEARCH_API_KEY=
GOOGLE_IMAGE_SEARCH_CX=
GOOGLE_IMAGE_SEARCH_SAFE=active
```

Validation:

- API key and CX should be optional by default so local/dev/test can boot without them.
- If only one of API key/CX is set, fail env validation with a clear message.
- Backend search endpoint should return `503` or an empty typed response with a useful error when not configured. Prefer `503` so mobile can show "Image search is not configured yet".

### Google request

Use Google Custom Search JSON API:

```text
https://www.googleapis.com/customsearch/v1
  ?key=...
  &cx=...
  &searchType=image
  &q=omelet recipe
  &num=10
  &safe=active
```

Implementation notes:

- Use backend `axios` dependency already available in `backend/package.json`.
- Clamp query length, trim whitespace, reject empty query.
- Clamp limit between 1 and 10 because Google API `num` max is 10 per request.
- Return only image results with a valid `link`.
- Map `image.thumbnailLink`, `displayLink`, and `image.contextLink` where available.
- Do not log API keys or full URLs containing keys.

## Mobile API Design

Suggested files:

- Create: `mobile/src/features/recipes/services/recipeImageSearchService.ts`
- Create: `mobile/src/features/recipes/components/RecipeImageSearchModal/RecipeImageSearchModal.tsx`
- Create: `mobile/src/features/recipes/components/RecipeImageSearchModal/styles.ts`
- Create: `mobile/src/features/recipes/components/RecipeImageSearchModal/types.ts`
- Modify: `mobile/src/features/recipes/components/AddRecipeModal/AddRecipeModal.tsx`
- Modify: `mobile/src/features/recipes/components/AddRecipeModal/types.ts`
- Modify: `mobile/src/features/recipes/components/AddRecipeModal/styles.ts`
- Modify i18n:
  - `mobile/src/i18n/locales/en/recipes.json`
  - `mobile/src/i18n/locales/he/recipes.json`
  - `mobile/src/i18n/locales/ar/recipes.json`

### Service API

```ts
export type RecipeImageSearchResult = {
  id: string;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  sourceDisplayName?: string;
  width?: number;
  height?: number;
};

export async function searchRecipeImages(query: string, limit = 12): Promise<RecipeImageSearchResult[]>;
```

### AddRecipeModal state changes

Add:

```ts
const [showImageSearch, setShowImageSearch] = useState(false);
const [imageSource, setImageSource] = useState<'none' | 'local' | 'web'>('none');
```

Or keep the existing `imageIsLocal` boolean and add a tiny helper:

```ts
const selectWebImage = (result: RecipeImageSearchResult) => {
  setImageUri(result.imageUrl);
  setImageIsLocal(false);
  setRemoveImage(false);
};
```

Important: existing save behavior already supports remote URLs via `imageUrl` when `imageIsLocal` is false, so do not overbuild this.

## Task Plan

### Task 1: Backend env/config support

**Objective:** Add Google image search configuration without breaking local/test boot.

**Files:**
- Modify: `backend/src/config/env.validation.ts`
- Modify: `backend/src/config/configuration.ts`

**Test:** Add/adjust config tests if existing; otherwise add direct env validation tests.

**Acceptance:**
- Both `GOOGLE_IMAGE_SEARCH_API_KEY` and `GOOGLE_IMAGE_SEARCH_CX` unset: boot allowed.
- Both set: config exposes them.
- Only one set: validation fails.

### Task 2: Backend search service

**Objective:** Encapsulate Google API integration and result mapping.

**Files:**
- Create: `backend/src/modules/recipes/services/recipe-image-search.service.ts`
- Create test: `backend/src/modules/recipes/services/recipe-image-search.service.spec.ts`

**Behavior:**
- Empty query throws bad request.
- Limit is clamped to 1..10.
- Missing configuration throws service unavailable.
- Successful Google response maps items into clean result DTOs.
- No secrets in logs/errors.

### Task 3: Backend endpoint

**Objective:** Expose authenticated image search to mobile.

**Files:**
- Create: `backend/src/modules/recipes/dtos/recipe-image-search.dto.ts`
- Modify: `backend/src/modules/recipes/controllers/recipe-images.controller.ts`
- Modify: `backend/src/modules/recipes/recipes.module.ts`
- Add/modify controller tests under `backend/src/modules/recipes/controllers/__tests__/`

**Endpoint:**

```ts
GET /v1/recipes/images/search?query=omelet&limit=10
```

or if keeping existing controller route style:

```ts
GET /v1/recipe-images/search?query=omelet&limit=10
```

Before implementation, check current controller prefixes to choose the exact final URL.

### Task 4: Mobile search service

**Objective:** Add a typed mobile service method that calls the backend endpoint.

**Files:**
- Create: `mobile/src/features/recipes/services/recipeImageSearchService.ts`
- Create test: `mobile/src/features/recipes/services/__tests__/recipeImageSearchService.test.ts`

**Behavior:**
- Trims empty queries client-side.
- Calls backend with encoded query and limit.
- Returns typed result list.
- Converts backend errors into user-friendly messages.

### Task 5: Mobile image search modal UI

**Objective:** Add a reusable selector UI for recipe web images.

**Files:**
- Create: `mobile/src/features/recipes/components/RecipeImageSearchModal/RecipeImageSearchModal.tsx`
- Create: `mobile/src/features/recipes/components/RecipeImageSearchModal/styles.ts`
- Create: `mobile/src/features/recipes/components/RecipeImageSearchModal/types.ts`
- Create tests under `__tests__/RecipeImageSearchModal.test.tsx`

**Behavior:**
- Opens with initial query from recipe title if available.
- Shows loading state, empty state, error state.
- Shows image grid with source domain/title.
- Selecting an image calls `onSelect(result)`.
- Has clear close/cancel action.

### Task 6: Wire AddRecipeModal photo section

**Objective:** Let users choose either local photo or web image.

**Files:**
- Modify: `mobile/src/features/recipes/components/AddRecipeModal/AddRecipeModal.tsx`
- Modify: `mobile/src/features/recipes/components/AddRecipeModal/styles.ts`
- Modify: `mobile/src/features/recipes/components/AddRecipeModal/types.ts`
- Add tests if no existing AddRecipeModal tests; otherwise extend them.

**Behavior:**
- Existing Add Photo remains unchanged.
- Add "Search web images" button.
- Selecting web image sets `imageUri` to the selected result URL and `imageIsLocal = false`.
- Save sends selected web image as `imageUrl`, not `imageLocalUri`.
- Remove Photo clears either local or web image.
- Picking local photo after web image switches back to local mode.

### Task 7: i18n and copy

**Objective:** Add all labels in English/Hebrew/Arabic.

**Files:**
- `mobile/src/i18n/locales/en/recipes.json`
- `mobile/src/i18n/locales/he/recipes.json`
- `mobile/src/i18n/locales/ar/recipes.json`

Suggested English copy:

```json
{
  "form": {
    "searchWebImages": "Search web images",
    "webImageNote": "Images come from the web. Check usage rights before sharing.",
    "imageSearchTitle": "Find a recipe image",
    "imageSearchPlaceholder": "Search omelet, barbecue, salad...",
    "imageSearchEmpty": "No images found",
    "imageSearchError": "Could not load image results"
  }
}
```

### Task 8: Verification

Backend commands:

```bash
cd backend
npm test -- --runInBand src/modules/recipes/services/recipe-image-search.service.spec.ts src/modules/recipes/controllers/__tests__/recipe-images.controller.spec.ts
npm run build
```

Mobile commands:

```bash
cd mobile
npm test -- --runInBand src/features/recipes/components/RecipeImageSearchModal/__tests__/RecipeImageSearchModal.test.tsx src/features/recipes/screens/__tests__/RecipesScreen.test.tsx
npx tsc --noEmit
git diff --check
```

Manual QA:

1. Open Recipes tab.
2. Create a recipe named "Omelet".
3. Tap Search web images.
4. Confirm query defaults to Omelet or user can type it.
5. Select a result.
6. Confirm preview updates immediately.
7. Save recipe.
8. Confirm list card and detail header show selected image.
9. Edit recipe, remove image, save.
10. Confirm image is removed.
11. Edit recipe, pick local photo after a web image, save.
12. Confirm local upload path still works.

## Risks / Tradeoffs

- **Copyright/licensing:** Google image results are web content, not automatically free to use. Add a clear note and consider adding a future filter for usage rights if needed.
- **Hotlink reliability:** Saving external URLs is fast and simple, but images can break later. Later phase can import selected image into app storage.
- **API quota/cost:** Custom Search JSON API has quotas. Backend should clamp limits and mobile should debounce searches.
- **Secrets:** Google API key must remain backend-only.
- **App review:** Avoid making claims that images are free to use. Copy should be conservative.

## Recommended First PR Scope

Keep the first PR focused:

1. Backend search endpoint.
2. Mobile search modal and AddRecipeModal wiring.
3. Save selected web image as existing `imageUrl`.
4. Tests for search, selection, and save payload.

Do **not** add backend image import/rehosting in the first PR unless external-image reliability becomes a real issue.
