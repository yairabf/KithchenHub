# Data Modes Architecture Specification

## Overview

This specification defines three explicit data modes for KitchenHub to ensure clear separation of concerns and prevent accidental data leakage between guest users, signed-in users, and public catalog data.

## Three Data Modes

### 1. Guest Mode

**Purpose**: Local-only data storage for unauthenticated users exploring the app

**Characteristics**:
- Data stored exclusively on device (AsyncStorage v1 - see [Guest Storage Decision](./GUEST_STORAGE_DECISION.md))
- No cloud synchronization
- No household association
- No cross-device access
- Data persists until app uninstall or explicit clear

**Storage Location**: `@kitchen_hub_guest_*` keys in AsyncStorage

**Storage Backend**: AsyncStorage is the chosen backend for Guest Mode v1. See [Guest Storage Backend Decision](./GUEST_STORAGE_DECISION.md) for operational limits, migration triggers, and migration plan to SQLite/WatermelonDB when needed.

### 2. Signed-In Mode

**Purpose**: Cloud-synced household data with local caching

**Characteristics**:
- Data stored in cloud database (PostgreSQL via backend API)
- Local cache for offline access and performance
- Household-scoped (shared with household members)
- Cross-device synchronization
- Requires authentication (JWT tokens)

**Storage Location**:
- Cloud: PostgreSQL database (household-scoped tables)
- Local: `@kitchen_hub_cache_*` keys in AsyncStorage

### 3. Public Catalog Mode

**Purpose**: Read-only reference data accessible to all users

**Characteristics**:
- Always API-backed (no local writes)
- No authentication required
- Read-only access
- Shared across all users
- Fallback to local cache on network failure

**Storage Location**:
- Primary: Backend API (`/groceries/*` endpoints)
- Fallback: Local cache (`@kitchen_hub_catalog_cache`)

## Entity Mode Mapping

### Guest Mode Entities

These entities are stored locally and never synced to cloud:

- **GuestShoppingList**: Shopping lists created by guest users
  - Storage key: `@kitchen_hub_guest_shopping_lists`
  - No `householdId` field
  - Local-only IDs (UUIDs)
  - Type: `GuestEntity<ShoppingList>`

- **GuestShoppingItem**: Items in guest shopping lists
  - Storage key: `@kitchen_hub_guest_shopping_items`
  - References `GuestShoppingList` by local ID
  - May reference `MasterGroceryCatalog` by ID (read-only)
  - Type: `GuestEntity<ShoppingItem>`

- **GuestRecipe**: Recipes created by guest users
  - Storage key: `@kitchen_hub_guest_recipes`
  - No `householdId` field
  - Local-only IDs
  - Type: `GuestEntity<Recipe>`

- **GuestChore**: Chores created by guest users
  - Storage key: `@kitchen_hub_guest_chores`
  - No `householdId` or `assigneeId` fields
  - Local-only IDs
  - Type: `GuestEntity<Chore>`

### Signed-In Mode Entities

These entities are cloud-synced and household-scoped:

- **ShoppingList**: Backend model with `householdId`
  - API: `GET/POST /shopping-lists`
  - Requires: JWT auth + household membership
  - Cloud storage: `shopping_lists` table
  - Type: `SignedInEntity<ShoppingList>`

- **ShoppingItem**: Backend model with `listId` → `ShoppingList`
  - API: `POST/PATCH/DELETE /shopping-items/:id`
  - Requires: JWT auth + household membership
  - Cloud storage: `shopping_items` table
  - Type: `SignedInEntity<ShoppingItem>`

- **Recipe**: Backend model with `householdId`
  - API: `GET/POST/PATCH /recipes`
  - Requires: JWT auth + household membership
  - Cloud storage: `recipes` table
  - Type: `SignedInEntity<Recipe>`

- **Chore**: Backend model with `householdId` and optional `assigneeId`
  - API: `GET/POST/PATCH /chores`
  - Requires: JWT auth + household membership
  - Cloud storage: `chores` table
  - Type: `SignedInEntity<Chore>`

- **Household**: Backend model for multi-user sharing
  - API: `GET/POST /households`
  - Requires: JWT auth
  - Cloud storage: `households` table
  - Type: `SignedInEntity<Household>`

- **User**: Backend model with `householdId` association
  - API: Managed via auth endpoints
  - Cloud storage: `users` table
  - Type: `SignedInEntity<User>`

### Public Catalog Entities

These entities are read-only and shared:

- **MasterGroceryCatalog**: Reference grocery items
  - API: `GET /groceries/search`, `GET /groceries/categories`
  - Requires: No authentication (public endpoint)
  - Cloud storage: `master_grocery_catalog` table (RLS read-only)
  - Local fallback: `@kitchen_hub_catalog_cache`
  - Type: `PublicCatalogEntity<GroceryItem>`

## Hard Guardrails

### 1. Type System Guardrails

**Location**: `mobile/src/common/types/dataModes.ts`

Type guards and discriminated unions prevent mode mixing at compile time:

```typescript
// Type definitions with mode discrimination
type GuestEntity = {
  mode: 'guest';
  localId: string;
  // No householdId, no cloud sync fields
};

type SignedInEntity = {
  mode: 'signed-in';
  id: string; // Cloud ID
  householdId: string;
  // Cloud sync fields
};

type PublicCatalogEntity = {
  mode: 'public-catalog';
  id: string;
  // Read-only, no ownership
};
```

**Type Guards**:
- `isGuestEntity(entity)` - Checks if entity is guest mode
- `isSignedInEntity(entity)` - Checks if entity is signed-in mode
- `isPublicCatalogEntity(entity)` - Checks if entity is public catalog mode
- `validateEntityMode(entity, expectedMode)` - Validates and asserts mode

### 2. Service Selection Guardrails

**Location**: Service factories in each feature

Enforce mode-based service selection with compile-time safety:

```typescript
// Service factory with mode enforcement
function createShoppingService(
  mode: 'guest' | 'signed-in',
  entityType?: string
): IShoppingService {
  // Public catalog cannot use shopping service
  if (mode === 'public-catalog') {
    throw new Error('Public catalog cannot use shopping service.');
  }
  
  // Validate service compatibility
  const serviceType = mode === 'guest' ? 'local' : 'remote';
  validateServiceCompatibility(serviceType, mode);
  
  return mode === 'guest' ? new LocalShoppingService() : new RemoteShoppingService();
}
```

**Validation**: `validateServiceCompatibility()` ensures service type matches entity mode.

### 3. API Endpoint Guardrails

**Location**: Backend controllers and guards

**Guest Mode Protection**:
- All private data endpoints require `JwtAuthGuard` and `HouseholdGuard`
- Guest users (no JWT) cannot access private endpoints
- Public catalog endpoints use `@Public()` decorator

**Signed-In Mode Protection**:
- All private endpoints verify `householdId` from JWT
- RLS policies enforce household scoping at database level
- No guest data can be written to cloud tables

**Public Catalog Protection**:
- Catalog endpoints are explicitly marked `@Public()`
- RLS policies enforce read-only access: `FOR SELECT USING (true)`
- No write endpoints for catalog data

**Verified Endpoints**:
- `/groceries/search` - `@Public()` ✅
- `/groceries/categories` - `@Public()` ✅
- `/shopping-lists/*` - `@UseGuards(JwtAuthGuard, HouseholdGuard)` ✅
- `/recipes/*` - `@UseGuards(JwtAuthGuard, HouseholdGuard)` ✅
- `/chores/*` - `@UseGuards(JwtAuthGuard, HouseholdGuard)` ✅

### 4. Storage Layer Guardrails

**Location**: `mobile/src/common/storage/dataModeStorage.ts`

Prevent cross-mode data access in storage:

```typescript
// Storage key prefixes enforce separation
const STORAGE_PREFIXES = {
  guest: '@kitchen_hub_guest_',
  signedIn: '@kitchen_hub_cache_',
  publicCatalog: '@kitchen_hub_catalog_',
} as const;

// Storage helpers with mode enforcement
function getGuestStorageKey(entity: string): string {
  return `${STORAGE_PREFIXES.guest}${entity}`;
}

function validateStorageKey(key: string, expectedMode: DataMode): void {
  const prefix = STORAGE_PREFIXES[expectedMode];
  if (!key.startsWith(prefix)) {
    throw new Error(`Storage key ${key} does not match mode ${expectedMode}`);
  }
}
```

**Validation Functions**:
- `validateStorageKey(key, expectedMode)` - Validates key prefix matches mode
- `getModeFromStorageKey(key)` - Determines mode from key
- `extractEntityTypeFromKey(key)` - Extracts entity type from key

### 5. Runtime Validation Guardrails

**Location**: `mobile/src/common/validation/dataModeValidation.ts`

Add runtime checks to prevent mode leakage:

```typescript
// Entity validation on read/write
function validateEntityModeMatch<T extends { mode?: string }>(
  entity: T,
  expectedMode: DataMode
): asserts entity is T & EntityWithMode {
  validateEntityMode(entity, expectedMode);
}

// Service operation validation
function validateServiceOperation(
  operation: 'read' | 'write',
  entityMode: DataMode
): void {
  if (entityMode === 'public-catalog' && operation === 'write') {
    throw new Error('Public catalog entities are read-only.');
  }
}

// Mode migration validation
function validateModeMigration(
  sourceMode: DataMode,
  targetMode: DataMode
): void {
  // Only allow migration from guest to signed-in
  if (sourceMode === 'guest' && targetMode === 'signed-in') {
    return; // Valid migration
  }
  // Disallow all other migrations
  throw new Error(`Invalid migration from ${sourceMode} to ${targetMode}`);
}
```

**Validation Functions**:
- `validateEntityModeMatch()` - Validates entity mode
- `validateServiceOperation()` - Validates operation is allowed for mode
- `validateServiceCompatibility()` - Validates service type matches mode
- `validateModeMigration()` - Validates migration path
- `validateEntitiesMode()` - Validates array of entities
- `validateUserAccessToMode()` - Validates user can access mode

### 6. Sync Guardrails

**Location**: `mobile/src/common/guards/guestNoSyncGuardrails.ts`

Prevent guest data from syncing remotely with runtime assertions at boundaries:

```typescript
// Guard at sync entry points
import { assertSignedInMode } from '../guards/guestNoSyncGuardrails';
import { useAuth } from '../../contexts/AuthContext';

export function enqueueSyncAction(action: SyncAction): void {
  const { user } = useAuth();
  assertSignedInMode(user, 'Sync action enqueue');
  // ... enqueue logic
}

// Defense-in-depth in sync application
export async function applyRemoteUpdatesToLocal(...) {
  // Validates storage key mode (getSignedInCacheKey implies signed-in)
  const keyMode = getModeFromStorageKey(storageKey);
  if (keyMode === 'guest') {
    throw new Error('applyRemoteUpdatesToLocal() called with guest storage key.');
  }
  // ... sync logic
}
```

**Guardrail Functions**:
- `assertSignedInMode(user, operation)` - Asserts user is signed-in (not guest)
- `assertNoGuestMode(user, operation)` - Asserts user is not guest

**Integration Points**:
- Sync queue enqueue functions (when implemented) - Guard at entry
- Sync orchestrator entry points (`startSync()`, `runSyncCycle()`) - Guard at entry
- `applyRemoteUpdatesToLocal()` - Defense-in-depth validation of storage key mode
- Remote service classes - Documented to require authentication (service factories prevent guest mode)

**Key Principle**: Guard at boundaries, not thread state through every function. Guardrails check user state at sync entry points.

### 7. Migration Guardrails

**Location**: `mobile/src/services/import/importService.ts`

Prevent accidental data mixing during guest-to-signed transition:

```typescript
static async gatherLocalData(): Promise<ImportRequestDto> {
  // Validate migration is allowed (guest to signed-in)
  validateModeMigration('guest', 'signed-in');
  
  // Use guest mode service
  const recipeService = createRecipeService('guest');
  const recipes = await recipeService.getRecipes();
  
  // Validate all recipes are in guest mode
  recipes.forEach((recipe, index) => {
    if (!isGuestEntity(recipe)) {
      throw new Error(`Recipe at index ${index} is not in guest mode.`);
    }
  });
  
  // ... similar validation for shopping lists and items
}
```

**Migration Rules**:
- Only guest → signed-in migration is allowed
- All entities must be validated as guest mode before migration
- Guest storage is cleared after successful migration
- New cloud IDs are generated during migration

## Implementation Files

### New Files Created

1. **`mobile/src/common/types/dataModes.ts`**
   - Type definitions for three modes
   - Discriminated unions
   - Type guards

2. **`mobile/src/common/storage/dataModeStorage.ts`**
   - Storage key management
   - Mode-specific storage helpers
   - Key validation

3. **`mobile/src/common/validation/dataModeValidation.ts`**
   - Runtime validation functions
   - Service operation validation
   - Entity mode checks

4. **`docs/architecture/DATA_MODES_SPEC.md`**
   - This specification document
   - Entity mappings
   - Guardrail definitions

### Files Modified

1. **Service Factories**:
   - `mobile/src/features/shopping/services/shoppingService.ts`
   - `mobile/src/features/recipes/services/recipeService.ts`
   - `mobile/src/features/chores/services/choresService.ts`
   - Updated to use mode-based selection instead of boolean flags

2. **Hooks and Screens**:
   - `mobile/src/features/recipes/hooks/useRecipes.ts`
   - `mobile/src/features/shopping/screens/ShoppingListsScreen.tsx`
   - `mobile/src/features/chores/screens/ChoresScreen.tsx`
   - Added mode detection and validation

3. **Import Service**:
   - `mobile/src/services/import/importService.ts`
   - Added mode validation during migration

4. **Backend Guards**:
   - Verified `JwtAuthGuard` and `HouseholdGuard` on all private endpoints
   - Verified `@Public()` decorator on catalog endpoints
   - Verified RLS policies for catalog read-only access

## Success Criteria

1. **Type Safety**: TypeScript compiler prevents mixing guest and signed-in entity types ✅
2. **Runtime Safety**: Runtime validation throws errors if modes are mixed ✅
3. **Storage Isolation**: Storage keys prevent cross-mode data access ✅
4. **API Protection**: Backend rejects unauthorized access attempts ✅
5. **Clear Separation**: Each entity has explicit mode assignment ✅
6. **Migration Safety**: Guest-to-signed migration validates and transforms correctly ✅
7. **Sync Guardrails**: Guest mode cannot enqueue sync actions or trigger remote sync operations ✅

## Testing Strategy

1. **Unit Tests**: Test type guards, storage helpers, and validation functions
2. **Integration Tests**: Test service selection based on user mode
3. **E2E Tests**: Verify guest cannot access signed-in endpoints
4. **Migration Tests**: Verify guest-to-signed migration preserves data integrity

## Usage Examples

### Determining User Mode

```typescript
import { determineUserDataMode } from '../common/types/dataModes';

const userMode = determineUserDataMode(user); // 'guest' | 'signed-in'
```

### Creating Services with Mode

```typescript
import { createShoppingService } from '../services/shoppingService';

const userMode = determineUserDataMode(user);
const service = createShoppingService(userMode);
```

### Validating Entity Mode

```typescript
import { validateEntityMode } from '../common/types/dataModes';

validateEntityMode(recipe, 'guest'); // Throws if mode doesn't match
```

### Validating Storage Keys

```typescript
import { validateStorageKey } from '../common/storage/dataModeStorage';

validateStorageKey('@kitchen_hub_guest_recipes', 'guest'); // ✅
validateStorageKey('@kitchen_hub_guest_recipes', 'signed-in'); // ❌ Throws
```

## Migration Path

1. ✅ Create new type definitions and storage helpers
2. ✅ Update service factories to use mode-based selection
3. ✅ Add runtime validation to critical paths
4. ✅ Update import service with mode validation
5. ⏳ Add comprehensive tests
6. ✅ Document patterns for future development
