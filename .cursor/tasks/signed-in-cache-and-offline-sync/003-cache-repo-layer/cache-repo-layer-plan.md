---
name: Cache-Aware Repository Layer
overview: Implement a repository layer that wraps remote services with cache-first read strategies and write-through caching. This layer will provide immediate cache returns for reads and background refresh for stale data, ensuring optimal offline-first UX.
todos:
  - id: base-repository-interface
    content: Create base repository interface and abstract class in baseCacheAwareRepository.ts
    status: pending
  - id: cache-event-system
    content: Implement cache event bus (cacheEvents.ts) for UI update notifications
    status: pending
  - id: use-cached-entities-hook
    content: Implement useCachedEntities hook that subscribes to cache changes
    status: pending
  - id: update-set-cached-emit
    content: Update setCached() to emit cache events after writes
    status: pending
  - id: recipe-repository
    content: Implement CacheAwareRecipeRepository wrapping RemoteRecipeService
    status: pending
  - id: shopping-repository
    content: Implement CacheAwareShoppingRepository for lists and items (dedicated interface)
    status: pending
  - id: chores-repository
    content: Implement CacheAwareChoreRepository wrapping RemoteChoresService
    status: pending
  - id: update-recipe-hook
    content: Update useRecipes hook to use CacheAwareRecipeRepository + useCachedEntities
    status: pending
  - id: update-shopping-screen
    content: Update ShoppingListsScreen to use CacheAwareShoppingRepository + useCachedEntities
    status: pending
  - id: update-chores-screen
    content: Update ChoresScreen to use CacheAwareChoreRepository + useCachedEntities
    status: pending
  - id: refactor-services-deferred
    content: (DEFERRED) Refactor services to remove cache logic after repos are proven stable
    status: pending
isProject: false
---

# Cache-Aware Repository Layer Implementation Plan

**Epic:** Signed-In Cache and Offline Sync  
**Task:** 003 - Cache-Aware Repository Layer  
**Created:** 2026-01-25  
**Status:** Planning

## Current Status Analysis

### ✅ Already Implemented

1. **Cache Infrastructure** (Complete):
   - `cacheMetadata.ts` - Metadata management (`lastSyncedAt` tracking)
   - `cacheConfig.ts` - TTL configuration and cache state calculation
   - `cacheAwareRepository.ts` - Low-level cache operations (`getCached`, `setCached`, `invalidateCache`)
   - `cacheStorage.ts` - Safe cache read/write utilities
   - `backgroundRefresh.ts` - Background refresh orchestration
   - `syncApplication.ts` - Sync utilities with conflict resolution

2. **Service Integration** (Partial):
   - ✅ `RemoteRecipeService.getRecipes()` - **Fully integrated** with `getCached()`
   - ❌ `RemoteShoppingService` - **Not integrated** (direct API calls)
   - ❌ `RemoteChoresService` - **Not integrated** (direct API calls)

3. **Service Structure**:
   - Services implement interfaces (`IRecipeService`, `IShoppingService`, `IChoresService`)
   - Services are created via factory functions (`createRecipeService`, `createShoppingService`, `createChoresService`)
   - Services handle DTO mapping and API communication

### ❌ Missing Implementation

1. **Repository Layer Abstraction**:
   - No dedicated repository classes that wrap services
   - Services directly call `getCached()`/`setCached()` (recipes only)
   - No unified interface for cache-aware data access
   - Shopping and chores services lack cache integration entirely

2. **Write-Through Caching**:
   - Recipes service has manual write-through (reads cache, updates, writes back)
   - Shopping and chores services have no write-through caching
   - No standardized pattern for write operations

3. **Background Refresh Integration**:
   - Only recipes service triggers background refresh
   - Shopping and chores services don't use background refresh

4. **UI Update Mechanism**:
   - No mechanism for UI to automatically update when background refresh completes
   - No cache change notifications
   - Manual state management required in hooks

## Architecture Overview

The repository layer will sit between services and the cache infrastructure, with a cache event system for UI updates:

```
┌─────────────────┐
│   UI/Hooks      │
│ useCachedEntities│
└────────┬────────┘
         │ (subscribes to events)
         │
┌────────▼────────────────────────┐
│  Cache Event Bus                │
│  cacheEvents.emit()             │
└────────┬────────────────────────┘
         │
┌────────▼────────────────────────┐
│  Repository Layer (NEW)         │
│  - CacheAwareRecipeRepository  │
│  - CacheAwareShoppingRepository│
│  - CacheAwareChoreRepository   │
└────────┬────────────────────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──────────┐
│Cache  │ │  Services   │
│Layer  │ │  (Remote*)  │
└───────┘ └─────────────┘
```

## Implementation Plan

### Phase 1: Base Repository Interface

**File**: `mobile/src/common/repositories/baseCacheAwareRepository.ts`

**Purpose**: Define base interface and shared logic for all cache-aware repositories.

**Interface**:

```typescript
export interface ICacheAwareRepository<T extends EntityTimestamps> {
  /**
   * Cache-first read with background refresh
   * Returns cached data immediately, refreshes in background if stale
   */
  findAll(): Promise<T[]>;
  
  /**
   * Find single entity by ID (reads from cache first)
   */
  findById(id: string): Promise<T | null>;
  
  /**
   * Create entity with write-through caching
   */
  create(entity: Partial<T>): Promise<T>;
  
  /**
   * Update entity with write-through caching
   */
  update(id: string, updates: Partial<T>): Promise<T>;
  
  /**
   * Delete entity (soft-delete) with write-through caching
   */
  delete(id: string): Promise<void>;
  
  /**
   * Invalidate cache (force refresh on next read)
   */
  invalidateCache(): Promise<void>;
}
```

**Base Class** (optional helper):

```typescript
export abstract class BaseCacheAwareRepository<T extends EntityTimestamps> 
  implements ICacheAwareRepository<T> {
  
  protected abstract entityType: SyncEntityType;
  protected abstract service: IRemoteService<T>; // Service interface
  protected abstract getId: (entity: T) => string;
  
  // Shared implementation for findAll, findById, etc.
}
```

### Phase 2: Cache Event System (UI Update Mechanism)

**File**: `mobile/src/common/utils/cacheEvents.ts`

**Purpose**: Event bus for cache change notifications to trigger UI updates.

**Implementation**:

```typescript
import { EventEmitter } from 'events';
import type { SyncEntityType } from './cacheMetadata';

class CacheEventEmitter extends EventEmitter {
  /**
   * Emit cache change event for an entity type
   * Called after setCached() operations
   */
  emitCacheChange(entityType: SyncEntityType): void {
    this.emit(`cache:${entityType}:changed`);
  }
  
  /**
   * Subscribe to cache changes for an entity type
   * Returns unsubscribe function
   */
  onCacheChange(
    entityType: SyncEntityType,
    handler: () => void
  ): () => void {
    this.on(`cache:${entityType}:changed`, handler);
    return () => this.off(`cache:${entityType}:changed`, handler);
  }
}

export const cacheEvents = new CacheEventEmitter();
```

**File**: `mobile/src/common/hooks/useCachedEntities.ts`

**Purpose**: React hook that subscribes to cache changes and re-reads cache when it updates.

**Implementation**:

```typescript
import { useState, useEffect } from 'react';
import type { SyncEntityType } from '../utils/cacheMetadata';
import { EntityTimestamps } from '../types/entityMetadata';
import { readCacheArray } from '../utils/cacheStorage';
import { cacheEvents } from '../utils/cacheEvents';

export function useCachedEntities<T extends EntityTimestamps>(
  entityType: SyncEntityType
): {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const loadFromCache = async () => {
    try {
      setIsLoading(true);
      const result = await readCacheArray<T>(entityType);
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load cache'));
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    // Initial load
    loadFromCache();
    
    // Subscribe to cache changes
    const unsubscribe = cacheEvents.onCacheChange(entityType, () => {
      loadFromCache();
    });
    
    return unsubscribe;
  }, [entityType]);
  
  return {
    data,
    isLoading,
    error,
    refresh: loadFromCache,
  };
}
```

**Integration**:

- Update `setCached()` in `cacheAwareRepository.ts` to emit events after writes
- Repositories call `cacheEvents.emitCacheChange(entityType)` after write operations
- Hooks use `useCachedEntities()` instead of manual cache reads

### Phase 3: Recipe Repository

**File**: `mobile/src/common/repositories/cacheAwareRecipeRepository.ts`

**Purpose**: Wrap `RemoteRecipeService` with cache-aware operations.

**Implementation**:

- Use existing `getCached()` for `findAll()`
- Implement `findById()` (read from cache, fallback to service)
- Implement `create()` with write-through (call service, update cache, emit event)
- Implement `update()` with write-through (call service, update cache, emit event)
- Implement `delete()` with write-through (call service, update cache, emit event)
- Use `invalidateCache()` from `cacheAwareRepository.ts`

**Integration Points**:

- Keep service methods but delegate to repository for cache operations
- Hooks use repository instead of service directly

### Phase 4: Shopping Repository

**File**: `mobile/src/common/repositories/cacheAwareShoppingRepository.ts`

**Purpose**: Wrap `RemoteShoppingService` with cache-aware operations.

**Challenges**:

- Shopping has multiple entity types: `shoppingLists`, `shoppingItems`
- `getShoppingData()` returns aggregated data structure
- Need to cache lists and items separately
- Base CRUD interface doesn't map perfectly to shopping's structure

**Approach**: **Dedicated Shopping Repository Interface**

Instead of forcing shopping into the generic CRUD interface, create a dedicated interface:

```typescript
export interface ICacheAwareShoppingRepository {
  // Lists operations
  findAllLists(): Promise<ShoppingList[]>;
  findListById(id: string): Promise<ShoppingList | null>;
  createList(list: Partial<ShoppingList>): Promise<ShoppingList>;
  updateList(id: string, updates: Partial<ShoppingList>): Promise<ShoppingList>;
  deleteList(id: string): Promise<void>;
  
  // Items operations
  findAllItems(): Promise<ShoppingItem[]>;
  findItemsByListId(listId: string): Promise<ShoppingItem[]>;
  createItem(item: Partial<ShoppingItem>): Promise<ShoppingItem>;
  updateItem(id: string, updates: Partial<ShoppingItem>): Promise<ShoppingItem>;
  deleteItem(id: string): Promise<void>;
  toggleItem(id: string): Promise<ShoppingItem>;
  
  // Aggregated data (convenience method)
  getShoppingData(): Promise<ShoppingData>;
  
  // Cache management
  invalidateListsCache(): Promise<void>;
  invalidateItemsCache(): Promise<void>;
  invalidateAllCache(): Promise<void>;
}
```

**Implementation**:

- `findAllLists()` - Cache-first for shopping lists using `getCached('shoppingLists')`
- `findAllItems()` - Cache-first for shopping items using `getCached('shoppingItems')`
- `getShoppingData()` - Aggregates cached lists + items + groceries (groceries from API, not cached)
- Write-through for all create/update/delete operations
- Emit cache events after write operations to trigger UI updates

**Cache Strategy for Items**:

- Cache all items together (simpler, less granular)
- Filter items by `listId` when needed
- Can optimize to per-list caching later if needed

### Phase 5: Chores Repository

**File**: `mobile/src/common/repositories/cacheAwareChoreRepository.ts`

**Purpose**: Wrap `RemoteChoresService` with cache-aware operations.

**Implementation**:

- Use `getCached()` for `findAll()`
- Implement write-through for create/update/delete/toggle
- Handle chores API response structure (today/upcoming sections)
- Emit cache events after write operations

### Phase 6: Service Refactoring (DEFERRED)

**Status**: ⚠️ **Defer until repositories are proven stable**

**Rationale**: 
- Don't remove cache logic from services until repositories are working correctly
- Incremental approach: Add repos → Update hooks → Test → Then remove old cache logic
- Reduces risk of breaking changes during migration

**Future Changes** (after repos are stable):

- Remove `getCached()` calls from `RemoteRecipeService.getRecipes()`
- Remove manual write-through cache updates from services
- Keep services focused on API communication only

### Phase 7: Hook Updates

**Files to Modify**:

- `mobile/src/features/recipes/hooks/useRecipes.ts`
- `mobile/src/features/shopping/screens/ShoppingListsScreen.tsx` (or create hook)
- `mobile/src/features/chores/screens/ChoresScreen.tsx` (or create hook)

**Changes**:

- Replace service calls with repository calls for reads
- Use `useCachedEntities()` hook for reactive cache reads
- Repositories handle cache-first reads automatically
- Background refresh happens transparently
- UI updates automatically when cache changes (via cache events)

**Pattern**:

```typescript
// Before (service-based)
const [recipes, setRecipes] = useState<Recipe[]>([]);
useEffect(() => {
  service.getRecipes().then(setRecipes);
}, []);

// After (repository + cache observer)
const { data: recipes, isLoading, error } = useCachedEntities<Recipe>('recipes');
const repository = useMemo(() => new CacheAwareRecipeRepository(service), [service]);

// Write operations use repository
const addRecipe = async (recipe: Partial<Recipe>) => {
  const created = await repository.create(recipe);
  // Cache event automatically triggers useCachedEntities to re-read
};
```

## File Structure

```
mobile/src/common/repositories/
├── baseCacheAwareRepository.ts          # NEW: Base interface/class
├── cacheAwareRepository.ts              # EXISTS: Low-level cache ops
├── cacheAwareRecipeRepository.ts        # NEW: Recipe repository
├── cacheAwareShoppingRepository.ts      # NEW: Shopping repository (dedicated interface)
└── cacheAwareChoreRepository.ts         # NEW: Chore repository

mobile/src/common/utils/
├── cacheEvents.ts                       # NEW: Cache event bus
└── cacheStorage.ts                      # EXISTS: Safe cache read/write

mobile/src/common/hooks/
├── useCachedEntities.ts                 # NEW: Cache observer hook
└── useCacheRefresh.ts                   # EXISTS: App lifecycle refresh

mobile/src/features/recipes/
├── hooks/
│   └── useRecipes.ts                    # MODIFY: Use repository + useCachedEntities
└── services/
    └── recipeService.ts                 # KEEP: Cache logic remains until repos proven

mobile/src/features/shopping/
├── screens/
│   └── ShoppingListsScreen.tsx          # MODIFY: Use repository + useCachedEntities
└── services/
    └── RemoteShoppingService.ts         # KEEP: Cache logic remains until repos proven

mobile/src/features/chores/
├── screens/
│   └── ChoresScreen.tsx                 # MODIFY: Use repository + useCachedEntities
└── services/
    └── choresService.ts                 # KEEP: Cache logic remains until repos proven
```

## Implementation Details

### Repository Pattern

Each repository will:

1. **Read Operations**: Use `getCached()` for cache-first reads
2. **Write Operations**: Call service, then update cache via `setCached()`, then emit cache event
3. **Background Refresh**: Automatically triggered by `getCached()` when stale
4. **Error Handling**: Gracefully fall back to cache on network errors

### Write-Through Pattern

```typescript
async create(entity: Partial<T>): Promise<T> {
  // 1. Call service to create on server
  const created = await this.service.create(entity);
  
  // 2. Read current cache
  const current = await readCachedEntities<T>(this.entityType);
  
  // 3. Add created entity to cache
  await setCached(this.entityType, [...current, created], this.getId);
  
  // 4. Emit cache change event to trigger UI updates
  cacheEvents.emitCacheChange(this.entityType);
  
  return created;
}
```

### Cache Event System

**Purpose**: Notify UI components when cache changes, enabling automatic UI updates.

**Flow**:
1. Repository writes to cache via `setCached()`
2. Repository emits cache change event: `cacheEvents.emitCacheChange(entityType)`
3. `useCachedEntities()` hook subscribes to events
4. Hook re-reads cache and updates state
5. UI re-renders with fresh data

**Benefits**:
- Automatic UI updates when background refresh completes
- Automatic UI updates when write operations complete
- No manual state management needed in hooks
- Decoupled: repositories don't need to know about React

### Cache Key Strategy

- Use existing `SyncEntityType` mapping:
  - `recipes` → `@kitchen_hub_cache_recipes`
  - `shoppingLists` → `@kitchen_hub_cache_shoppingLists`
  - `shoppingItems` → `@kitchen_hub_cache_shoppingItems`
  - `chores` → `@kitchen_hub_cache_chores`

## Success Criteria

1. ✅ Repository layer implemented for all entity types
2. ✅ Reads return cached data immediately
3. ✅ **Background refresh updates UI automatically** (via cache events + `useCachedEntities` hook)
4. ✅ Write operations update cache immediately (write-through)
5. ✅ **Cache event system** emits events after cache writes
6. ✅ **`useCachedEntities` hook** subscribes to cache changes and updates UI
7. ✅ All services wrapped with cache-aware repositories
8. ✅ Hooks updated to use repositories + `useCachedEntities` hook
9. ✅ Existing functionality preserved (no regressions)
10. ✅ Offline mode works correctly (uses cache when offline)
11. ✅ Shopping repository uses dedicated interface (not forced into generic CRUD)

## Testing Strategy

### Unit Tests (Future - Out of Scope for This Plan)

- Repository cache-first read behavior
- Write-through cache updates
- Background refresh triggering
- Error handling and fallbacks
- Cache event emission

### Manual Testing

1. **Cache-First Reads**:
   - Verify immediate return from cache
   - Verify background refresh for stale data
   - Verify blocking refresh for expired data

2. **Write-Through**:
   - Verify cache updated immediately after create/update/delete
   - Verify UI reflects changes without manual refresh

3. **Cache Events**:
   - Verify UI updates automatically when background refresh completes
   - Verify UI updates automatically when write operations complete

4. **Offline Mode**:
   - Verify cache used when offline
   - Verify writes queue properly (future: offline queue)

## Dependencies

- ✅ `cacheAwareRepository.ts` - Low-level cache operations
- ✅ `cacheStorage.ts` - Safe cache read/write
- ✅ `cacheConfig.ts` - TTL configuration
- ✅ `backgroundRefresh.ts` - Background refresh orchestration
- ✅ `networkStatus.ts` - Network status detection
- ✅ Service interfaces and implementations
- ✅ `events` module (Node.js EventEmitter, available in React Native)

## Implementation Order

1. **Phase 1**: Base repository interface/class
2. **Phase 2**: Cache event system (`cacheEvents.ts` + `useCachedEntities` hook)
3. **Phase 3**: Recipe repository (validate pattern)
4. **Phase 4**: Shopping repository (dedicated interface, more complex)
5. **Phase 5**: Chores repository
6. **Phase 6**: Update hooks to use repositories + `useCachedEntities`
7. **Phase 7**: (DEFERRED) Refactor services to remove cache logic (after repos proven)

## Out of Scope

- ❌ Backend changes (backend is API-only, no cache logic)
- ❌ Offline write queue (future enhancement)
- ❌ Cache eviction policies (future enhancement)
- ❌ Comprehensive test suite (future task)
- ❌ Performance optimizations (can be done incrementally)
- ❌ Service refactoring (deferred until repos proven)

## Notes

- **Repository vs Service**: Repositories handle cache, services handle API communication
- **Backward Compatibility**: Keep service interfaces unchanged, add repository layer on top
- **Incremental Migration**: Can migrate one feature at a time (recipes → shopping → chores)
- **Service Refactoring**: Defer removing cache logic from services until repositories are proven stable
- **UI Updates**: Cache event system ensures UI updates automatically when background refresh completes
- **Shopping Repository**: Uses dedicated interface (not generic CRUD) to handle lists/items/aggregated data
- **Future Enhancements**: Can add repository methods for filtering, pagination, etc.
