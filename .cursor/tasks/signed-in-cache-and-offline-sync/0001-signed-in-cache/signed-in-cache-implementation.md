# Cache-First + Background Refresh Implementation

**Epic:** Signed-In Cache and Offline Sync  
**Created:** 2026-01-25  
**Status:** Planning  
**Depends On:** `signed-in-cache-strategy-spec.md`

## Overview

Implement the cache-first + background refresh strategy as defined in the strategy specification. This includes cache metadata utilities, cache-aware repository layer, service integration, and background refresh orchestration.

## Prerequisites

- Strategy specification completed (`signed-in-cache-strategy-spec.md`)
- TTL values defined and approved
- Expired cache UX decision made

## Implementation Plan

### Phase 1: Cache Metadata Utilities

**File**: `mobile/src/common/utils/cacheMetadata.ts`

**Purpose**: Manage cache metadata (lastSyncedAt) per entity type

**Functions**:
- `getCacheMetadata(entityType: SyncEntityType): Promise<CacheMetadata | null>`
- `updateCacheMetadata(entityType: SyncEntityType, lastSyncedAt: string): Promise<void>`
- `getCacheState(entityType: SyncEntityType): Promise<'fresh' | 'stale' | 'expired' | 'missing'>`
- `isCacheStale(entityType: SyncEntityType): Promise<boolean>`
- `isCacheExpired(entityType: SyncEntityType): Promise<boolean>`

**Storage Key**: `@kitchen_hub_cache_meta_${entityType}`

**Tests**: Parameterized unit tests for all functions

### Phase 2: TTL Configuration

**File**: `mobile/src/common/config/cacheConfig.ts`

**Purpose**: Define TTL and stale threshold constants per entity type

**Exports**:
- `CACHE_TTL_CONFIG: Record<SyncEntityType, CacheTTLConfig>`
- `getCacheTTLConfig(entityType: SyncEntityType): CacheTTLConfig`
- `getCacheState(entityType: SyncEntityType, lastSyncedAt: string): 'fresh' | 'stale' | 'expired'`

**Tests**: Unit tests for TTL configuration and state calculation

### Phase 3: Cache-Aware Repository Layer

**File**: `mobile/src/common/repositories/cacheAwareRepository.ts`

**Purpose**: Generic cache-first repository that wraps remote services

**Interface**:
```typescript
interface CacheAwareRepository<T> {
  get(): Promise<T[]>;
  // Wraps service methods with cache layer
}
```

**Behavior**:
- Cache-first read: Check cache, return immediately if available
- State-based refresh: Trigger refresh based on cache state
- Write-through: Update cache on writes
- Background refresh: Non-blocking refresh for stale data

**Methods**:
- `getCached<T>(entityType, fetchFn): Promise<T[]>` - Cache-first read with background refresh
- `setCached<T>(entityType, data): Promise<void>` - Write to cache and update metadata
- `invalidateCache(entityType): Promise<void>` - Clear cache and metadata

**Tests**: 
- Parameterized tests for cache-first read
- Background refresh behavior
- Write-through updates
- Offline behavior

### Phase 4: Background Refresh Orchestration

**File**: `mobile/src/common/utils/backgroundRefresh.ts`

**Purpose**: Manage background refresh operations

**Features**:
- Queue refresh operations
- Prevent duplicate refreshes (debounce)
- Handle network errors gracefully
- Update cache metadata on success
- Retry logic for failed refreshes

**Functions**:
- `queueRefresh(entityType, fetchFn): Promise<void>`
- `isRefreshing(entityType): boolean`
- `cancelRefresh(entityType): void`

**Tests**: Unit tests for refresh queue, debouncing, error handling

### Phase 5: Service Integration

**Files to Modify**:
- `mobile/src/features/recipes/services/recipeService.ts`
- `mobile/src/features/shopping/services/RemoteShoppingService.ts`
- `mobile/src/features/chores/services/choresService.ts`

**Approach**: Create cache-aware wrappers that maintain existing service interfaces

**Pattern**:
```typescript
class CachedRemoteRecipeService implements IRecipeService {
  constructor(
    private remoteService: RemoteRecipeService,
    private cacheRepo: CacheAwareRepository<Recipe>
  ) {}
  
  async getRecipes(): Promise<Recipe[]> {
    return this.cacheRepo.getCached('recipes', () => 
      this.remoteService.getRecipes()
    );
  }
  
  // ... other methods with write-through cache
}
```

**Tests**: Integration tests for each service wrapper

### Phase 6: Sync Metadata Updates

**File**: `mobile/src/common/utils/syncApplication.ts`

**Modification**: Update `applyRemoteUpdatesToLocal()` to set cache metadata after successful sync

**Change**:
```typescript
export async function applyRemoteUpdatesToLocal<T extends EntityTimestamps>(
  entityType: SyncEntityType,
  remoteEntities: T[],
  getId: (entity: T) => string
): Promise<void> {
  // ... existing merge logic ...
  
  // Update cache metadata after successful sync
  await updateCacheMetadata(entityType, new Date().toISOString());
}
```

**Tests**: Update existing sync tests to verify metadata updates

### Phase 7: App Lifecycle Integration

**File**: `mobile/src/common/hooks/useCacheRefresh.ts`

**Purpose**: React hook for app lifecycle cache refresh

**Features**:
- Check cache staleness on mount
- Trigger background refresh if stale and online
- Handle app foreground events
- Expose refresh status

**Hook**:
```typescript
function useCacheRefresh(entityTypes: SyncEntityType[]): {
  isRefreshing: boolean;
  refresh: () => Promise<void>;
}
```

**Integration**: Use in screens that need cache refresh on mount

**Tests**: Hook tests for lifecycle behavior

## Files to Create

1. `mobile/src/common/utils/cacheMetadata.ts` - Cache metadata management
2. `mobile/src/common/config/cacheConfig.ts` - TTL configuration
3. `mobile/src/common/repositories/cacheAwareRepository.ts` - Cache-first repository
4. `mobile/src/common/utils/backgroundRefresh.ts` - Background refresh orchestration
5. `mobile/src/common/hooks/useCacheRefresh.ts` - React hook for cache refresh

## Files to Modify

1. `mobile/src/features/recipes/services/recipeService.ts` - Add cache-aware wrapper
2. `mobile/src/features/shopping/services/RemoteShoppingService.ts` - Add cache-aware wrapper
3. `mobile/src/features/chores/services/choresService.ts` - Add cache-aware wrapper
4. `mobile/src/common/utils/syncApplication.ts` - Update to set cache metadata on sync

## Testing Strategy

### Unit Tests

1. **Cache Metadata Tests** (`cacheMetadata.spec.ts`):
   - Test metadata read/write
   - Test stale detection logic
   - Test TTL expiration
   - Parameterized tests for all entity types

2. **TTL Configuration Tests** (`cacheConfig.spec.ts`):
   - Test TTL values per entity type
   - Test stale threshold calculations
   - Test cache state determination

3. **Repository Tests** (`cacheAwareRepository.spec.ts`):
   - Test cache-first read
   - Test background refresh
   - Test write-through updates
   - Test offline behavior
   - Parameterized tests for cache states

4. **Background Refresh Tests** (`backgroundRefresh.spec.ts`):
   - Test refresh queue
   - Test debouncing
   - Test error handling
   - Test retry logic

### Integration Tests

1. **Service Integration** (`cacheService.integration.spec.ts`):
   - Test cache-aware service wrappers
   - Test cache invalidation on writes
   - Test background refresh triggers
   - Test network scenarios

2. **Sync Integration** (`syncApplication.integration.spec.ts`):
   - Test metadata updates after sync
   - Test cache state after sync

### Manual Testing

1. **Cache Behavior**:
   - Verify immediate cache response
   - Verify background refresh updates
   - Verify stale data handling
   - Verify expired cache behavior (blocking when online)

2. **Offline Behavior**:
   - Verify cache-only mode when offline
   - Verify sync on reconnect

3. **Write Behavior**:
   - Verify cache updates immediately on write
   - Verify background sync after write

## Success Criteria

1. ✅ Cache metadata utilities implemented and tested
2. ✅ TTL configuration defined and tested
3. ✅ Cache-aware repository implemented with cache-first strategy
4. ✅ Background refresh orchestration working
5. ✅ All services integrated with cache layer
6. ✅ Sync updates cache metadata
7. ✅ App lifecycle refresh hook implemented
8. ✅ Comprehensive test coverage (unit + integration)
9. ✅ Offline mode uses cache only
10. ✅ Expired cache blocks for network when online

## Implementation Order

1. Phase 1: Cache Metadata Utilities (foundation)
2. Phase 2: TTL Configuration (depends on Phase 1)
3. Phase 3: Cache-Aware Repository (depends on Phase 1, 2)
4. Phase 4: Background Refresh (depends on Phase 1, 2)
5. Phase 5: Service Integration (depends on Phase 3, 4)
6. Phase 6: Sync Metadata Updates (depends on Phase 1)
7. Phase 7: App Lifecycle Integration (depends on Phase 4)

## Notes

- Start with one service (recipes) to validate approach before integrating all services
- Monitor cache hit rates and refresh frequency to tune TTL values
- Consider adding analytics for cache performance metrics
- Keep implementation simple - avoid over-engineering
