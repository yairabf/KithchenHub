# Recipes Feature

**Exports** (from `mobile/src/features/recipes/index.ts`): `RecipesScreen`, `RecipeCard`, `AddRecipeModal`, `NewRecipeData` (type).

**Source**: `mobile/src/features/recipes/` — 2 screens (RecipesScreen, RecipeDetailScreen), 8 components (RecipeCard, AddRecipeModal, RecipeHeader, RecipeContentWrapper, RecipeIngredients, RecipeSteps, IngredientCard, InstructionStep), hooks (useRecipes), services (recipeService), utils (recipeFactory).

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
  - **Catalog Integration**: Uses `useCatalog()` hook to fetch grocery items with API → Cache → Mock fallback strategy
    - Hook delegates to centralized `CatalogService` for consistent catalog fetching across the app
    - Provides loading states and error handling
    - Works for both guest and signed-in users
  - **Image Upload**: Handles recipe image uploads with guest/authenticated user logic

#### Code Snippet - Catalog Data Loading

```typescript
import { useCatalog } from '../../../common/hooks/useCatalog';

export function RecipesScreen({ onSelectRecipe }: RecipesScreenProps) {
  const { groceryItems } = useCatalog(); // Uses API → Cache → Mock fallback
  // ... rest of component
}
```

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
  style?: ViewStyle;
}

interface Recipe {
  id: string;
  localId?: string;
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
  - **Sync Status Indicator** (signed-in users only):
    - Displays visual indicator in top-right corner of recipe image
    - Shows pending state (clock icon) when recipe is queued for sync
    - Shows failed state (warning icon) when sync has permanently failed
    - Hidden when recipe is confirmed (synced successfully)
    - Uses `useEntitySyncStatusWithEntity` hook to determine status
    - Integrates with sync queue system for real-time status updates

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
  - **Cache-Aware Repository Pattern** (signed-in users only):
    - Uses `CacheAwareRecipeRepository` which wraps `RemoteRecipeService`
    - Uses `useCachedEntities<Recipe>('recipes')` hook for reactive cache access
    - Cache automatically updates UI when data changes (via cache events)
    - `addRecipe` and `updateRecipe` use repository methods that implement write-through caching
    - Cache events trigger automatic UI re-renders without manual refresh
  - **Guest Mode**:
    - Uses service directly (no cache layer)
    - **Recipe Loading**: Uses `useEffect` to load recipes from `service.getRecipes()` when `!isSignedIn`
    - Maintains separate state (`guestRecipes`, `isGuestLoading`, `guestError`) for guest mode
    - Handles loading and error states for guest mode recipe fetching
    - `addRecipe` and `updateRecipe` persist to guest storage and update `guestRecipes` state immediately after successful service calls so the UI reflects new/updated recipes without refetch
    - On failure, state is unchanged; error propagates to caller
    - `updateRecipe` merges updates with existing recipe data to prevent data loss

## Service Layer

The feature uses a **Strategy Pattern** with a **Factory Pattern** to handle data fetching, switching transparently between local guest storage and backend API based on user authentication state.

- **Factory**: `createRecipeService(mode: 'guest' | 'signed-in')` (`mobile/src/features/recipes/services/recipeService.ts`)
  - Returns `LocalRecipeService` when mode is 'guest'
  - Returns `RemoteRecipeService` when mode is 'signed-in'
  - Validates service compatibility with data mode
- **Entity Factory**: `createRecipe()` (`mobile/src/features/recipes/utils/recipeFactory.ts`)
  - Creates new recipe objects with required fields
  - **Automatically populates `createdAt` and `updatedAt`** using `withCreatedAtAndUpdatedAt()` helper
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
      - Seeds `mockRecipes` with proper `createdAt` and `updatedAt` timestamps via `withCreatedAtAndUpdatedAt()`
      - Idempotent: won't re-seed after user deletes all recipes (tombstones remain)
      - Production builds never seed (verified via `isDevMode()` check)
    - **Timestamp Management**: 
      - `createRecipe()`: Explicitly populates both `createdAt` and `updatedAt` via `withCreatedAtAndUpdatedAt()` helper before persisting
        - Business rule: auto-populate both `createdAt` and `updatedAt` on creation
        - Ensures all new recipes have proper creation and modification timestamps
      - `updateRecipe()`: Automatically updates `updatedAt` via `withUpdatedAt()` helper
      - `deleteRecipe()`: Sets `deletedAt` and `updatedAt` using `markDeleted()` and `withUpdatedAt()` helpers
      - Timestamps are serialized to ISO strings when persisting to AsyncStorage
  - `RemoteRecipeService`: Calls backend via `api.ts` (`/recipes` endpoint)
    - Uses `RecipeApiResponse` DTO type instead of `any` for type safety
    - Uses `toSupabaseTimestamps()` for API payloads (converts camelCase to snake_case)
    - Uses `normalizeTimestampsFromApi()` to normalize API responses (handles both camelCase and snake_case)
    - Server timestamps are authoritative and overwrite client timestamps on response
    - **Timestamp Management**:
      - `createRecipe()`: Set both `createdAt` and `updatedAt` using `withCreatedAtAndUpdatedAt()` helper
      - `updateRecipe()`: Updates `updatedAt` using `withUpdatedAt()` helper
      - `deleteRecipe()`: Sets `deletedAt` and `updatedAt` using `markDeleted()` and `withUpdatedAt()` helpers
    - **Cache Updates**: All CRUD operations update local cache after successful API calls
      - Uses `setCached()` for write-through cache updates
      - Cache updates are best-effort (failures are logged but don't throw)
    - **Guest Mode Protection**: Service factory prevents guest mode from creating this service. All methods require authentication (JWT tokens), providing defense-in-depth against guest data syncing.
- **Cache-Aware Repository Layer** (signed-in users only):
  - **Repository**: `CacheAwareRecipeRepository` (`mobile/src/common/repositories/cacheAwareRecipeRepository.ts`)
    - Wraps `RemoteRecipeService` with cache-first read strategies and write-through caching
    - Implements `ICacheAwareRepository<Recipe>` interface
    - **Cache-First Reads**:
      - `findAll()`: Uses `getCached()` for cache-first reads with background refresh
        - Returns cached data immediately if fresh or stale
        - Triggers background refresh for stale data (non-blocking)
        - Blocks for network fetch if cache is expired (when online)
        - Returns cached data if offline (even if expired)
      - `findById()`: Reads directly from cache (optimized, no network fetch)
    - **Write-Through Caching**:
      - `create()`, `update()`, `delete()`: Update cache immediately after successful API operations
      - Uses helper functions (`addEntityToCache`, `updateEntityInCache`) for error handling
      - Cache errors are logged but don't fail operations (server write succeeded)
      - Cache is invalidated on error to force refresh on next read
    - **Cache Events**: Emits cache change events after writes to trigger UI updates
  - **Reactive Cache Hook**: `useCachedEntities<Recipe>('recipes')` (`mobile/src/common/hooks/useCachedEntities.ts`)
    - Subscribes to cache change events for automatic UI updates
    - Returns: `data`, `isLoading`, `error`, `refresh`
    - Automatically re-reads cache when change events are emitted
    - Provides manual refresh function for pull-to-refresh scenarios
  - **Cache Configuration**:
    - Cache metadata tracks `lastSyncedAt` per entity type with schema versioning support
    - Metadata includes optional `version?: number` field for storage schema versioning
    - TTL configuration: 5min stale threshold, 10min expiration
    - Legacy metadata automatically migrated to current version on read
    - Future versions preserved (returns `lastSyncedAt` if valid, otherwise `null`)
    - See `mobile/src/common/repositories/cacheAwareRepository.ts` and `mobile/src/common/utils/cacheMetadata.ts` for implementation details
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
  - `withCreatedAtAndUpdatedAt()`: Auto-populates `createdAt` (if missing) and always sets `updatedAt` on entity creation
    - Recommended helper for all create operations
    - Used in `recipeFactory.ts` for factory-created recipes
    - Used in `LocalRecipeService.createRecipe()` and `RemoteRecipeService.createRecipe()` to ensure service-created recipes have timestamps
    - Preserves existing `createdAt` if provided, always sets `updatedAt` to current time
  - `withCreatedAt()`: Auto-populates `createdAt` on entity creation (legacy, use `withCreatedAtAndUpdatedAt()` for new code)
  - `withUpdatedAt()`: Auto-updates `updatedAt` on entity modification (used in `recipeService.ts`)
  - `markDeleted()`: Sets `deletedAt` for soft-delete operations
  - `normalizeTimestampsFromApi()`: Centralized utility for normalizing API response timestamps (handles camelCase and snake_case formats)
  - `toSupabaseTimestamps()`: Converts camelCase timestamps to snake_case for API payloads
  - See [`mobile/src/common/types/entityMetadata.ts`](../../mobile/src/common/types/entityMetadata.ts) for serialization helpers
    - `toPersistedTimestamps()`: Converts Date objects to ISO strings for AsyncStorage persistence
    - `fromPersistedTimestamps()`: Converts ISO strings to Date objects when reading from AsyncStorage
    - Both helpers include comprehensive JSDoc documentation with usage examples
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

### Conflict Resolution Validation & Test Coverage

**Comprehensive Test Coverage**:

1. **Unit Tests** (`mobile/src/common/utils/__tests__/conflictResolution.test.ts`):
   - LWW scalar conflicts (local newer, remote newer, equal timestamps)
   - Tombstone handling (delete always wins policy)
   - Recreate after delete scenarios (tombstone resistance)
   - Deterministic outcome validation
   - Timestamp edge cases (millisecond precision, timezone normalization)

2. **Integration Tests** (`mobile/src/common/utils/__tests__/syncApplication.test.ts`):
   - Offline rename vs online rename scenarios
   - Additions never removed during merge
   - Concurrent modification scenarios
   - Offline toggle vs online delete
   - Delete vs update ordering

3. **Full Sync Flow Tests** (`mobile/src/common/utils/__tests__/syncApplication.integration.test.ts`):
   - Complete sync flow with multiple conflict types
   - Multiple entity types sync (recipes, shopping lists, chores)
   - Cache state validation after complex merges

**Deterministic Outcome Guarantees**:
- All conflict scenarios resolve deterministically
- Same inputs always produce same outputs
- Order-independent merge results
- UTC timezone normalization ensures consistent comparison

**Timezone Normalization Policy**:
- All timestamps stored and compared in UTC
- ISO strings are parsed as UTC (no timezone conversion)
- `compareTimestamps()` normalizes to UTC internally
- Server timestamps are always UTC
- Client timestamps generated in UTC
- `normalizeToUtc()` helper ensures consistent UTC representation

## Key Dependencies

- `useCatalog` - Catalog hook (`mobile/src/common/hooks/useCatalog.ts`) - React hook for fetching catalog data with API → Cache → Mock fallback strategy. Provides loading states, error handling, and refresh functionality
- `catalogService` - Catalog service (`mobile/src/common/services/catalogService.ts`) - Centralized service for catalog data fetching and caching. Used by all features for consistent catalog access with enhanced logging (tracks API/Cache/Mock source)
- `GrocerySearchItemDto` - Shared type (`mobile/src/common/types/catalog.ts`) - Centralized DTO type for catalog API responses, preventing code duplication
- `mockGroceriesDB` - Grocery database with images and categories (fallback data for catalog service)

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
- `CacheAwareRecipeRepository` - Cache-aware repository (`mobile/src/common/repositories/cacheAwareRecipeRepository.ts`) - Wraps `RemoteRecipeService` with cache-first reads and write-through caching. Implements `ICacheAwareRepository<Recipe>` interface.
- `useCachedEntities` - Reactive cache hook (`mobile/src/common/hooks/useCachedEntities.ts`) - React hook that subscribes to cache changes and automatically updates UI when cache changes. Used by `useRecipes` for signed-in users.
- `cacheAwareRepository` - Cache utilities (`mobile/src/common/repositories/cacheAwareRepository.ts`) - Provides `getCached()`, `setCached()`, `addEntityToCache()`, `updateEntityInCache()`, and `readCachedEntitiesForUpdate()` for cache-first reads and write-through caching
- `cacheEvents` - Cache event bus (`mobile/src/common/utils/cacheEvents.ts`) - Event emitter for cache change notifications. Used to trigger UI updates when cache changes.
- `cacheStorage` - Cache storage utilities (`mobile/src/common/utils/cacheStorage.ts`) - Versioned cache array storage with schema versioning support. Provides `readCacheArray()`, `writeCacheArray()`, `getCacheState()`, and `shouldRefreshCache()` helpers. Features:
  - Storage schema versioning: Cache arrays stored as `{ version: number, entities: T[] }` wrapper format
  - Read-time migrations: Legacy data automatically migrated to current version with write-back normalization
  - Future version handling: Preserves data from newer app versions without migration
  - Corruption detection: Distinguishes legacy, current, future, corrupt, and wrong-type data formats
  - Status reporting: Returns `CacheReadStatus` (`'ok'`, `'migrated'`, `'future_version'`, `'corrupt'`) for repository handling
  - Used internally by `cacheAwareRepository` for cache-first reads and write-through caching
- `networkStatus` - Network status singleton (`mobile/src/common/utils/networkStatus.ts`) - Provides `getIsOnline()` for checking network connectivity outside React components
- `syncQueueStorage` - Offline write queue storage (`mobile/src/common/utils/syncQueueStorage.ts`) - Manages queued write operations for offline sync with status tracking (`PENDING`, `RETRYING`, `FAILED_PERMANENT`)
- `syncQueueProcessor` - Queue processor (`mobile/src/common/utils/syncQueueProcessor.ts`) - Background worker loop that continuously drains the sync queue with exponential backoff retry logic. Processes ready items only, respects backoff delays, and handles error classification (network/auth/validation/server errors)
- `useSyncQueue` - Sync queue hook (`mobile/src/common/hooks/useSyncQueue.ts`) - React hook that manages worker loop lifecycle, starting/stopping based on network status and app foreground/background state
- `useEntitySyncStatusWithEntity` - Entity sync status hook (`mobile/src/common/hooks/useSyncStatus.ts`) - React hook that provides sync status (pending/confirmed/failed) for individual entities. Used by RecipeCard to display sync status indicators
- `SyncStatusIndicator` - Sync status indicator component (`mobile/src/common/components/SyncStatusIndicator/`) - Visual indicator component showing pending, confirmed, or failed sync status. Displays clock icon for pending, warning icon for failed, checkmark for confirmed
- `determineIndicatorStatus` - Status determination utility (`mobile/src/common/utils/syncStatusUtils.ts`) - Utility function that determines indicator status from sync status flags (failed > pending > confirmed priority)

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
