# Recipes Feature

## Overview

The Recipes feature allows users to browse, search, filter, and create recipes. It displays recipes in a card grid with category filtering and provides a comprehensive recipe creation form with ingredients and step-by-step instructions.

## Screenshots

### Main Recipes View
![Recipes Main](../screenshots/recipes/recipes-main.png)

### Recipe Detail Screen
![Recipe Detail](../screenshots/recipes/recipes-detail.png)

### Add Recipe Modal
![Add Recipe Modal](../screenshots/recipes/recipes-add-modal.png)

## Screens

### RecipesScreen

- **File**: `mobile/src/features/recipes/screens/RecipesScreen.tsx`
- **Purpose**: Recipe discovery and creation
- **Key functionality**:
  - Search bar for finding recipes by name
  - Category filter chips (All, Breakfast, Lunch, Dinner, Dessert, Snack)
  - Grid layout displaying recipe cards (2 columns)
  - Floating action button to add new recipes
  - Pastel colors for visual variety
  - **Mock Data Toggle**: Loads grocery items from `mockGroceriesDB` or API (`/groceries/search?q=`) based on `config.mockData.enabled`
  - **Image Upload**: Handles recipe image uploads with guest/authenticated user logic

#### Code Snippet - Filtering Logic

```typescript
const filteredRecipes = recipes.filter(recipe => {
  const matchesCategory = selectedCategory === 'All' || recipe.category === selectedCategory;
  const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
  return matchesCategory && matchesSearch;
});
```

#### Code Snippet - Card Width Calculation

```typescript
const { width } = Dimensions.get('window');
const cardWidth = ((width - spacing.lg * 3) / 2) * 0.85;
```

## Components

### RecipeDetailScreen

- **File**: `mobile/src/features/recipes/screens/RecipeDetailScreen.tsx`
- **Purpose**: Detailed view of a single recipe with ingredients and instructions
- **Key functionality**:
  - **Responsive Layout**: Adapts between phone (tabs) and tablet (split view)
  - **Sticky Header**: "Ingredients | Steps" header sticks to top on scroll
  - **Interaction**: Toggle step completion, add ingredients to shopping list
  - **Animatons**: Smooth fade/slide for sticky header
  - **Sharing**: Share recipe text via system share sheet

#### Sticky Header Logic (`RecipeDetailScreen.utils.ts`)

Pure utility functions manage the complex sticky header behavior:

- `calculateStickyHeaderTopPosition`: Determines precision placement accounting for safe areas
- `calculateIsHeaderScrolled`: Detects when main header passes threshold
- `calculateSpacerHeight`: Prevents layout shift when header becomes sticky

## Components

### RecipeContentWrapper

- **File**: `mobile/src/features/recipes/components/RecipeContentWrapper/`
- **Purpose**: Main content container handling responsive layout strategies
- **Refactoring Note**: Internally splits into `TabletRecipeContent` and `MobileRecipeContent` to manage distinct scrolling behaviors (independent columns vs single page).
- **Props**:

```typescript
interface RecipeContentWrapperProps {
  recipe: Recipe;
  completedSteps: Set<string>;
  onToggleStep: (stepId: string) => void;
  onAddIngredient: (ingredient: Ingredient) => void;
  onAddAllIngredients: () => void;
  renderHeaderOnly?: boolean;       // For sticky header rendering
  hideHeaderWhenSticky?: boolean;   // Hides static header when sticky is active
  activeTab?: 'ingredients' | 'steps';
  onTabChange?: (tab: 'ingredients' | 'steps') => void;
}
```

### RecipeHeader

- **File**: `mobile/src/features/recipes/components/RecipeHeader/`
- **Purpose**: Displays top-level recipe info (image, stats, description)
- **Features**:
  - Hero image with gradient overlay
  - Stats row (Prep time, Cook time, Calories, Servings)
  - Description text

### RecipeCard

- **File**: `mobile/src/features/recipes/components/RecipeCard/`
- **Purpose**: Individual recipe display card
- **Props**:

```typescript
interface RecipeCardProps {
  recipe: Recipe;
  backgroundColor: string;
  onPress: () => void;
  width: number;
}

interface Recipe {
  id: string;
  name: string;
  cookTime: string;
  category: string;
  imageUrl?: string;
}
```

- **Features**:
  - Shows recipe name and cook time
  - Placeholder icon for recipe image
  - Configurable width and background color (pastel)
  - Touch handler for recipe selection

### RecipeSidebar

- **File**: `mobile/src/features/recipes/components/RecipeSidebar/`
- **Status**: *Legacy/Removed in favor of RecipeContentWrapper*

### IngredientCard

- **File**: `mobile/src/features/recipes/components/IngredientCard/`
- **Purpose**: Individual ingredient display with shopping list integration
- **Features**:
  - Ingredient image placeholder
  - Name and quantity display
  - Add to shopping list button
  - Color-coded background

### InstructionStep

- **File**: `mobile/src/features/recipes/components/InstructionStep/`
- **Purpose**: Individual recipe instruction step with completion tracking
- **Features**:
  - Step number indicator
  - Instruction text
  - "Mark as finished" toggle
  - Visual feedback for completed steps

### AddRecipeModal

- **File**: `mobile/src/features/recipes/components/AddRecipeModal/`
- **Purpose**: Comprehensive recipe creation form
- **Props**:

```typescript
interface AddRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (recipe: NewRecipeData) => void;
  categories?: string[];
  groceryItems?: GroceryItem[];
}

interface NewRecipeData {
  title: string;
  category: string;
  prepTime: string;
  description: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  imageLocalUri?: string;
  imageUrl?: string;
}

interface Ingredient {
  id: string;
  quantity: string;
  unit: string;
  name: string;
  }

interface Instruction {
  id: string;
  text: string;
}
```

- **Features**:
  - Recipe title input
  - Category selection with horizontal scroll
  - Prep time input
  - Description textarea
  - Recipe photo picker (optional)
  - **Ingredients section**:
    - Integrated grocery search bar
    - Quantity, unit, and name inputs for each ingredient
    - Add/remove ingredients
    - Auto-populate from grocery database
  - **Instructions section**:
    - Numbered steps
    - Add/remove step functionality
    - Minimum 1 step required
  - Form validation (title and at least one ingredient required)

## Recipe Image Uploads (Mobile)

Recipe images are resized client-side before upload to reduce bandwidth and storage costs. The upload flow prevents orphaned images by creating the recipe first, then uploading the image, and finally updating the recipe with the image URL.

### Constraints

- Max resolution: `1024x1024` (aspect ratio preserved)
- Output format: JPEG
- Compression quality: `0.8`
- Max file size after resize: `2MB`

### Upload Flow

1. User selects a photo in `AddRecipeModal`.
2. Client resizes/compresses via `resizeAndValidateImage`:
   - File: `mobile/src/common/utils/imageResize.ts`
3. **Recipe Creation Flow** (prevents orphaned uploads):
   - **Step 1**: Create recipe first (without image) via `addRecipe()`
   - **Step 2**: Upload image to Supabase Storage using the server recipe ID:
     - Bucket: `household-uploads`
     - Path: `households/{householdId}/recipes/{recipeId}/{timestamp}.jpg`
     - File: `mobile/src/services/imageUploadService.ts`
   - **Step 3**: Update recipe with image URL via `updateRecipe()`
   - **Step 4**: If update fails, cleanup uploaded image via `deleteRecipeImage()`
4. The signed URL is stored in `imageUrl` when saving the recipe.

### Helper Functions

The upload flow uses helper functions to maintain clean separation of concerns:

- **`attachGuestImage`**: Updates recipe with local image URI for guest users
- **`uploadImageWithCleanup`**: Handles authenticated user uploads with automatic cleanup on failure
- **`deleteRecipeImage`**: Removes orphaned images from Supabase Storage when recipe update fails

### Notes

- **Guest mode**: Images are kept as local file URIs for the current session. When signing in with Google later, these images will **not** be uploaded automatically—users would need to re-add photos after sign-in if they want them persisted to cloud storage.
- **Orphan Prevention**: The create → upload → update flow ensures that if recipe creation fails, no orphaned images remain in storage. If the update step fails after upload, the uploaded image is automatically deleted.

## Entity Creation (New)

The feature implementation now uses a Factory Pattern to separate business logic from UI components and ensure TDD compliance.

- **Factory**: `mobile/src/features/recipes/utils/recipeFactory.ts`
- **Tests**: `mobile/src/features/recipes/utils/__tests__/recipeFactory.test.ts`
- **Logic**: Generates `localId` using `expo-crypto` UUIDs.

```typescript
// Example usage
import { createRecipe } from '../utils/recipeFactory';
const newRecipe = createRecipe(data);
```

## Key Types

```typescript
// Recipe entity now extends BaseEntity with shared metadata
import type { BaseEntity } from '../../../common/types/entityMetadata';

interface Recipe extends BaseEntity {
  // BaseEntity provides: id, localId, createdAt?, updatedAt?, deletedAt?
  name: string;
  cookTime: string;
  prepTime?: string;
  category: string;
  imageUrl?: string;
  description?: string;
  calories?: number;
  servings?: number;
  ingredients: Ingredient[];
  instructions: Instruction[];
}

// Nested sub-entities (do not extend BaseEntity)
interface Ingredient {
  id: string;
  quantity: string;
  unit: string;
  name: string;
  image?: string;
}

interface Instruction {
  id: string;
  text: string;
}

// Categories available
const recipeCategories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack'];
```

**Entity Metadata (from `BaseEntity`):**
- `id: string` - Legacy/Display ID for UI
- `localId: string` - Stable UUID for sync/merge operations
- `createdAt?: Date | string` - Creation timestamp
- `updatedAt?: Date | string` - Last modification timestamp
- `deletedAt?: Date | string` - Soft-delete timestamp (tombstone pattern)

**Note:** `Ingredient` and `Instruction` are nested sub-entities and do not extend `BaseEntity`. Metadata is managed at the `Recipe` level.

See [`mobile/src/common/types/entityMetadata.ts`](../../mobile/src/common/types/entityMetadata.ts) for shared entity metadata interfaces and helpers.

## State Management

- **Local state**:
  - `searchQuery` - Search input text
  - `selectedCategory` - Active category filter
  - `showAddRecipeModal` - Modal visibility
  - `groceryItems` - Grocery items loaded from mock or API based on toggle
  - `recipes` - Managed by `useRecipes` hook (switches between Local/Remote sources)
  - `isLoading` - Loading state for async operations
- **Hook**: `useRecipes()` (`mobile/src/features/recipes/hooks/useRecipes.ts`)
  - Returns: `recipes`, `isLoading`, `error`, `addRecipe`, `updateRecipe`
  - Uses `createRecipeService(mode)` factory to select service implementation based on data mode
  - Determines mode using `determineUserDataMode()`: 'guest' for guest users or when `config.mockData.enabled` is true, 'signed-in' for authenticated users
  - `addRecipe` and `updateRecipe` automatically persist to guest storage when in guest mode
  - `updateRecipe` merges updates with existing recipe data to prevent data loss

## Service Layer

The feature uses a **Strategy Pattern** with a **Factory Pattern** to handle data fetching, switching transparently between local guest storage and backend API based on user authentication state.

- **Factory**: `createRecipeService(mode: 'guest' | 'signed-in')` (`mobile/src/features/recipes/services/recipeService.ts`)
  - Returns `LocalRecipeService` when mode is 'guest'
  - Returns `RemoteRecipeService` when mode is 'signed-in'
  - Validates service compatibility with data mode
- **Entity Factory**: `createRecipe()` (`mobile/src/features/recipes/utils/recipeFactory.ts`)
  - Creates new recipe objects with required fields
  - **Automatically populates `createdAt`** using `withCreatedAt()` helper
- **Interface**: `IRecipeService`
  - `getRecipes(): Promise<Recipe[]>`
  - `createRecipe(recipe: Partial<Recipe>): Promise<Recipe>`
  - `updateRecipe(recipeId: string, updates: Partial<Recipe>): Promise<Recipe>` - Updates recipe with partial data, used for adding image URLs after upload
    - **Automatically updates `updatedAt`** using `withUpdatedAt()` helper
  - `deleteRecipe(recipeId: string): Promise<void>` - Soft-deletes recipe using tombstone pattern
- **Strategies**:
  - `LocalRecipeService`: 
    - Reads from `guestStorage.getRecipes()` (AsyncStorage) instead of mocks
    - Returns empty array when no guest data exists (not mock data)
    - Persists recipes to AsyncStorage via `guestStorage.saveRecipes()` on create/update
    - Includes retry logic for concurrent write operations
    - Validates recipe data before saving
    - **Dev-Only Seeding**: Automatically seeds mock recipes when storage is empty (development mode only)
      - Only seeds when storage is truly empty (no records, including soft-deleted)
      - Uses `isDevMode()` utility to detect development mode (`__DEV__` constant)
      - Seeds `mockRecipes` with proper `createdAt` timestamps via `withCreatedAt()`
      - Idempotent: won't re-seed after user deletes all recipes (tombstones remain)
      - Production builds never seed (verified via `isDevMode()` check)
    - **Timestamp Management**: 
      - `createRecipe()`: Automatically populates `createdAt` via `withCreatedAt()` helper
      - `updateRecipe()`: Automatically updates `updatedAt` via `withUpdatedAt()` helper
      - Timestamps are serialized to ISO strings when persisting to AsyncStorage
  - `RemoteRecipeService`: Calls backend via `api.ts` (`/recipes` endpoint)
    - Uses `RecipeApiResponse` DTO type instead of `any` for type safety
    - Uses `toSupabaseTimestamps()` for API payloads (converts camelCase to snake_case)
    - Uses `normalizeTimestampsFromApi()` to normalize API responses (handles both camelCase and snake_case)
    - Server timestamps are authoritative and overwrite client timestamps on response
    - **Guest Mode Protection**: Service factory prevents guest mode from creating this service. All methods require authentication (JWT tokens), providing defense-in-depth against guest data syncing.
    - **Cache-First Strategy** (signed-in users only):
      - `getRecipes()`: Uses `getCached()` for cache-first reads with background refresh
        - Returns cached data immediately if fresh or stale
        - Triggers background refresh for stale data (non-blocking)
        - Blocks for network fetch if cache is expired (when online)
        - Returns cached data if offline (even if expired)
      - `createRecipe()`, `updateRecipe()`, `deleteRecipe()`: Use write-through caching
        - Updates cache immediately after successful API operations
        - Maintains cache freshness for subsequent reads
      - Cache metadata tracks `lastSyncedAt` per entity type
      - TTL configuration: 5min stale threshold, 10min expiration
      - See `mobile/src/common/repositories/cacheAwareRepository.ts` for implementation details
- **Guest Storage**: `mobile/src/common/utils/guestStorage.ts`
  - Storage keys are centrally managed via `getGuestStorageKey(ENTITY_TYPES.*)` from `dataModeStorage.ts`
  - Uses envelope format internally: `{ version: 1, updatedAt: string, data: T[] }` for versioning support
  - `getRecipes()`: Retrieves recipes from AsyncStorage (key: `@kitchen_hub_guest_recipes`)
    - Normalizes timestamps from ISO strings to Date objects (shallow normalization)
    - Automatically upgrades legacy array format to envelope format on read
  - `saveRecipes(recipes)`: Persists recipes to AsyncStorage as envelope format
    - Serializes timestamps from Date objects to ISO strings (shallow serialization)
    - Creates envelope with version 1 and current timestamp
  - Returns empty arrays when no data exists or on parse errors (graceful degradation)
  - Validates data format and filters invalid entities
  - **Internal Helpers**: Uses `readEntityEnvelope()` and `writeEntityEnvelope()` from `guestStorageHelpers.ts` for type-safe operations
- **Timestamp Utilities**: `mobile/src/common/utils/timestamps.ts`
  - `withCreatedAt()`: Auto-populates `createdAt` on entity creation (used in `recipeFactory.ts`)
  - `withUpdatedAt()`: Auto-updates `updatedAt` on entity modification (used in `recipeService.ts`)
  - `markDeleted()`: Sets `deletedAt` for soft-delete operations
  - `normalizeTimestampsFromApi()`: Centralized utility for normalizing API response timestamps (handles camelCase and snake_case formats)
  - `toSupabaseTimestamps()`: Converts camelCase timestamps to snake_case for API payloads
  - See [`mobile/src/common/types/entityMetadata.ts`](../../mobile/src/common/types/entityMetadata.ts) for serialization helpers
- **Development Mode Utility**: `mobile/src/common/utils/devMode.ts`
  - `isDevMode()`: Wrapper around React Native `__DEV__` constant for testability
  - Used by `LocalRecipeService` to determine if dev-only seeding should occur
  - Separated into utility module for easy mocking in tests
- **DTO Types**: `RecipeApiResponse` type defined in `recipeService.ts`
  - Replaces `any` types for improved type safety
  - Supports both camelCase and snake_case timestamp formats from API
- **Configuration**: `config.mockData.enabled` (`mobile/src/config/index.ts`)
  - Controlled by `EXPO_PUBLIC_USE_MOCK_DATA` environment variable
  - When enabled, forces 'guest' mode regardless of user authentication state
  - Guest users always use 'guest' mode (local service)
- **API Client**: `mobile/src/services/api.ts` - Generic HTTP client wrapper

## Conflict Resolution & Sync

The recipes feature supports timestamp-based conflict resolution for offline-first sync scenarios.

### Conflict Resolution Utilities

**File**: `mobile/src/common/utils/conflictResolution.ts`

Shared utilities for resolving conflicts between local and remote state:

- **`compareTimestamps()`**: Compares two timestamps (Date or ISO string), normalizes to Date objects
- **`determineConflictWinner()`**: Determines winner based on `updatedAt` (LWW strategy)
  - Returns `'local'` if local is newer, `'remote'` if remote is newer or equal (tie-breaker)
- **`mergeEntitiesLWW()`**: Merges two entities using Last-Write-Wins
  - Winner record wins wholesale (entire entity, not partial field mixing)
  - Preserves local-only fields (e.g., `localId`) from local side
- **`mergeEntitiesWithTombstones()`**: Merges entities with tombstone awareness
  - **Resurrection Policy**: Delete always wins unless recreate (new entity with new ID)
  - Once deleted, always deleted (regardless of timestamp ordering)
  - Returns `null` if both sides agree on deletion
- **`mergeEntityArrays()`**: Merges arrays of entities using LWW + tombstone rules
  - Handles additions (new entities are always added)
  - Handles updates (merged using LWW)
  - Handles deletions (filtered out from result)
  - Time complexity: O(n + m)

### Sync Application

**File**: `mobile/src/common/utils/syncApplication.ts`

Utility for applying remote updates to local cached state:

- **`applyRemoteUpdatesToLocal()`**: Merges remote entities with local cache
  - Reads from signed-in cache (AsyncStorage)
  - Merges using `mergeEntityArrays()` with conflict resolution
  - Persists merged result back to cache
  - Should be called in sync pipeline/repository layer, NOT inside Remote*Service methods
  - **Defense-in-Depth Guardrail**: Validates storage key mode to ensure only signed-in cache keys are used. Throws error if called with guest or unknown storage keys, preventing programming errors.

**Note**: Conflict resolution is client-side. The backend sync endpoint (`POST /auth/sync`) performs simple upsert operations and returns conflicts. Client-side utilities handle timestamp-based merging.

## Key Dependencies

- `@expo/vector-icons` - Ionicons for icons
- `config` - Application configuration (`mobile/src/config/index.ts`) for mock data toggle
- `createRecipeService` - Service factory for selecting guest/signed-in data source based on mode
- `guestStorage` - Guest data persistence utilities (`mobile/src/common/utils/guestStorage.ts`)
- `determineUserDataMode` - Utility to determine data mode from user state (`mobile/src/common/types/dataModes.ts`)
- `mockGroceriesDB` - For ingredient search in add modal (when mock enabled)
- `mockRecipes` - Initial recipe data (used by LocalRecipeService for dev-only seeding)
- `isDevMode` - Development mode detection utility (`mobile/src/common/utils/devMode.ts`)
- `api` - HTTP client (`mobile/src/services/api.ts`) for remote service calls
- `deleteRecipeImage` - Image cleanup utility (`mobile/src/services/imageUploadService.ts`) for removing orphaned uploads
- `pastelColors` - Theme colors for card backgrounds
- `GrocerySearchBar` - Reused from shopping feature for ingredient search
- `CenteredModal` - Shared modal component
- `ScreenHeader` - Shared header component
- `useAuth` - Authentication context hook
- `useResponsive` - Responsive layout hook
- `conflictResolution` - Conflict resolution utilities (`mobile/src/common/utils/conflictResolution.ts`)
- `syncApplication` - Sync application utilities (`mobile/src/common/utils/syncApplication.ts`)
- `guestNoSyncGuardrails` - Guest mode sync guardrails (`mobile/src/common/guards/guestNoSyncGuardrails.ts`) - Runtime assertions preventing guest data from syncing remotely
- `cacheAwareRepository` - Cache-first repository (`mobile/src/common/repositories/cacheAwareRepository.ts`) - Provides `getCached()` and `setCached()` for cache-first reads and write-through caching
- `networkStatus` - Network status singleton (`mobile/src/common/utils/networkStatus.ts`) - Provides `getIsOnline()` for checking network connectivity outside React components

## UI Flow

1. User views recipe grid with all recipes
2. Can filter by category chips (All, Breakfast, Lunch, etc.)
3. Can search recipes by name
4. Clicking FAB opens Add Recipe modal
5. In modal, user fills out recipe details:
   - Title (required)
   - Category selection
   - Prep time
   - Description
   - Ingredients (search from database or add custom)
   - Step-by-step instructions
6. Save creates new recipe and adds to grid

## Styling Notes

- Uses `pastelColors` array for card backgrounds (cycles through)
- Grid uses flexWrap with space-between justification
- Cards have calculated width based on screen size
- **Scroll Padding**: `SCROLL_CONTENT_BOTTOM_PADDING` (180px) is used in `RecipeDetailScreen` to ensure content isn't hidden behind navigation bars or safe areas.
