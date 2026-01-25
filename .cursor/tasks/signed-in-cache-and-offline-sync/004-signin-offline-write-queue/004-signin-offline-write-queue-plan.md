---
name: Signed-In Offline Write Queue
overview: Implement offline write queue for signed-in users. When offline, writes are queued locally and synced when back online. UI updates instantly via write-through cache, while backend sync happens asynchronously.
todos:
  - id: mobile-queue-storage
    content: Create syncQueueStorage.ts with precise queue schema, compaction rules, and storage operations
    status: completed
  - id: modify-recipe-repo
    content: Modify CacheAwareRecipeRepository to enqueue writes when offline
    status: completed
  - id: modify-shopping-repo
    content: Modify CacheAwareShoppingRepository to enqueue writes when offline
    status: completed
  - id: modify-chore-repo
    content: Modify CacheAwareChoreRepository to enqueue writes when offline
    status: completed
  - id: sync-queue-processor
    content: Create syncQueueProcessor.ts to process queue when online
    status: completed
  - id: network-integration
    content: Create useSyncQueue hook to process queue on network status changes
    status: completed
  - id: cache-id-mapping
    content: Update cache with server IDs after successful sync
    status: completed
isProject: false
---

# 004 - Signed-In Offline Write Queue

**Epic:** Signed-In Cache and Offline Sync  
**Task:** 004 - Signed-In Offline Write Queue  
**Created:** 2026-01-25  
**Status:** Completed

## Current Status Analysis

### ✅ Already Implemented

1. **Cache-Aware Repositories** (Complete):
   - `CacheAwareRecipeRepository` - create, update, delete operations
   - `CacheAwareShoppingRepository` - createList, updateList, deleteList, createItem, updateItem, deleteItem, toggleItem
   - `CacheAwareChoreRepository` - create, update, delete, toggle operations
   - All repositories use write-through caching (update cache immediately)

2. **Network Status Detection** (Complete):
   - `NetworkContext` with `isOffline` state
   - `networkStatus.ts` singleton with `getIsOnline()`
   - API client throws `NetworkError` when offline

3. **Cache Event System** (Complete):
   - `cacheEvents.ts` - Event emitter for cache changes
   - `useCachedEntities` hook - Reactively updates UI when cache changes
   - Repositories emit cache events after writes

4. **Backend Sync Endpoint** (Complete):
   - `POST /auth/sync` - Accepts `SyncDataDto` with lists, recipes, chores
   - Handles conflict resolution and returns sync status
   - Located in `backend/src/modules/auth/services/auth.service.ts`

### ❌ Missing Implementation

1. **Mobile Queue Storage**:
   - No local storage for queued write operations
   - No queue management utilities

3. **Offline Write Handling**:
   - Repositories currently throw `NetworkError` when offline
   - No queueing mechanism when service calls fail
   - Writes fail completely when offline (no graceful degradation)

4. **Sync Processor**:
   - No background processor to sync queued writes when back online
   - No integration with network status changes

## Architecture Overview

The offline write queue enables writes to succeed offline by:
1. **Enqueueing writes** when offline (instead of throwing errors)
2. **Updating cache immediately** (UI updates instantly)
3. **Processing queue** when back online (background sync)

```
┌─────────────────────────────────────────────────────────┐
│                    User Action                           │
│              (create/update/delete)                      │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────▼───────────┐
         │   Repository Layer    │
         │ (CacheAware*Repository)│
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │   Network Check        │
         │   getIsOnline()        │
         └───────────┬───────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
   ┌────▼────┐              ┌─────▼─────┐
   │ Online  │              │  Offline  │
   └────┬────┘              └─────┬─────┘
        │                         │
   ┌────▼────────────┐      ┌─────▼──────────────┐
   │ Update Cache    │      │ Update Cache      │
   │ (write-through) │      │ (write-through)   │
   └────┬────────────┘      └─────┬──────────────┘
        │                         │
   ┌────▼────────────┐      ┌─────▼──────────────┐
   │ Emit Event      │      │ Emit Event        │
   │ (UI updates)    │      │ (UI updates)      │
   └────┬────────────┘      └─────┬──────────────┘
        │                         │
   ┌────▼────────────┐      ┌─────▼──────────────┐
   │ Call Service    │      │ Enqueue Write     │
   │ (API request)   │      │ (Local storage)   │
   └─────────────────┘      └───────────────────┘
                                    │
                           ┌────────▼──────────┐
                           │  Queue Processor  │
                           │  (when online)    │
                           └────────┬──────────┘
                                    │
                           ┌────────▼──────────┐
                           │  POST /auth/sync  │
                           │  (batch sync)     │
                           └───────────────────┘
```

## Implementation Plan

### Phase 1: Mobile Queue Storage Utilities

**File**: `mobile/src/common/utils/syncQueueStorage.ts`

**Purpose**: Local storage utilities for managing queued write operations.

**Storage Key**: `@kitchen_hub_sync_queue` (signed-in users only)

**Precise Queue Schema**:

```typescript
type SyncEntityType = 'recipes' | 'shoppingLists' | 'shoppingItems' | 'chores';
type SyncOp = 'create' | 'update' | 'delete';

/**
 * Identifies an entity across offline period.
 * Always use localId for queue operations (serverId may not exist offline).
 */
type QueueTargetId = {
  localId: string;   // Always present (UUID generated on create)
  serverId?: string; // Filled after sync (optional, may not exist yet)
};

/**
 * Queued write operation with deterministic ordering and stable identity.
 */
type QueuedWrite = {
  id: string;                 // Queue item ID (UUID)
  entityType: SyncEntityType;
  op: SyncOp;
  target: QueueTargetId;       // Identifies the entity across offline period
  payload: unknown;            // Full entity data (can optimize to patch later)
  clientTimestamp: string;     // ISO timestamp for ordering + conflict resolution
  attemptCount: number;         // Retry counter (starts at 0)
};

export interface SyncQueueStorage {
  /**
   * Enqueue a write operation with automatic compaction.
   * Compacts queue before adding new item to prevent duplicates/thrash.
   */
  enqueue(
    entityType: SyncEntityType,
    op: SyncOp,
    target: QueueTargetId,
    payload: unknown
  ): Promise<QueuedWrite>;
  
  /**
   * Get all queued writes, sorted by clientTimestamp (deterministic ordering).
   */
  getAll(): Promise<QueuedWrite[]>;
  
  /**
   * Get queued writes for a specific entity type.
   */
  getByEntityType(entityType: SyncEntityType): Promise<QueuedWrite[]>;
  
  /**
   * Get queued writes for a specific entity (by localId).
   */
  getByTarget(entityType: SyncEntityType, localId: string): Promise<QueuedWrite[]>;
  
  /**
   * Remove a queued write by ID.
   */
  remove(id: string): Promise<void>;
  
  /**
   * Clear all queued writes.
   */
  clear(): Promise<void>;
  
  /**
   * Increment retry count for a queued write.
   */
  incrementRetry(id: string): Promise<void>;
  
  /**
   * Compact queue: merge operations for same entity to prevent thrash.
   * Called automatically on enqueue.
   */
  compact(): Promise<void>;
}
```

**Queue Compaction Rules**:

For the same `{entityType, target.localId}` combination:

1. **create + update*** → Merge into one `create` with latest payload
   - Example: User creates recipe, then updates it 5 times offline
   - Result: Single `create` with final recipe state

2. **update + update** → Merge into one `update` (latest wins)
   - Example: User toggles shopping item 20 times offline
   - Result: Single `update` with final item state

3. **create + delete** → Drop both (net no-op)
   - Example: User creates recipe, then deletes it offline
   - Result: No queue entry (entity never existed on server)

4. **delete + update** → Keep `delete` (delete wins, unless explicit "undo delete" support)
   - Example: User deletes recipe, then tries to update it offline
   - Result: Single `delete` operation

**Compaction Implementation**:

```typescript
async compact(): Promise<void> {
  const queue = await this.getAll();
  const compacted = new Map<string, QueuedWrite>();
  
  // Process queue in chronological order
  const sorted = queue.sort((a, b) => 
    a.clientTimestamp.localeCompare(b.clientTimestamp)
  );
  
  for (const item of sorted) {
    const key = `${item.entityType}:${item.target.localId}`;
    const existing = compacted.get(key);
    
    if (!existing) {
      compacted.set(key, item);
      continue;
    }
    
    // Apply compaction rules
    if (existing.op === 'create' && item.op === 'update') {
      // create + update → create with latest payload
      compacted.set(key, {
        ...existing,
        payload: item.payload,
        clientTimestamp: item.clientTimestamp, // Use latest timestamp
      });
    } else if (existing.op === 'update' && item.op === 'update') {
      // update + update → update with latest payload
      compacted.set(key, {
        ...existing,
        payload: item.payload,
        clientTimestamp: item.clientTimestamp,
      });
    } else if (existing.op === 'create' && item.op === 'delete') {
      // create + delete → drop both (remove from map)
      compacted.delete(key);
    } else if (existing.op === 'delete' && item.op === 'update') {
      // delete + update → keep delete (ignore update)
      // No change needed
    } else if (existing.op === 'delete' && item.op === 'delete') {
      // delete + delete → keep one delete
      // No change needed
    } else {
      // Unknown combination, keep both (shouldn't happen)
      console.warn(`Unexpected queue compaction: ${existing.op} + ${item.op}`);
    }
  }
  
  // Save compacted queue
  await this.saveQueue(Array.from(compacted.values()));
}
```

**Implementation Details**:
- Use AsyncStorage with signed-in cache key pattern
- Store as JSON array of `QueuedWrite` objects
- Handle storage errors gracefully
- Validate queue size limits (prevent unbounded growth, e.g., max 100 items)
- Compaction runs automatically on `enqueue()`

### Phase 2: Modify Repositories for Offline Queueing

**Files to Modify**:
- `mobile/src/common/repositories/cacheAwareRecipeRepository.ts`
- `mobile/src/common/repositories/cacheAwareShoppingRepository.ts`
- `mobile/src/common/repositories/cacheAwareChoreRepository.ts`

**Critical Write Ordering Rule** (Non-negotiable):

**UI action → Update cache immediately → Emit cache event → Handle sync (enqueue if offline, call service if online)**

The cache must be updated BEFORE any network operations or queueing. This ensures UI updates instantly regardless of network status.

**Pattern for Write Operations**:

```typescript
async create(entity: Partial<T>): Promise<T> {
  // Step 1: Create optimistic entity (always, for consistent behavior)
  const optimisticEntity = this.createOptimisticEntity(entity);
  
  // Step 2: Update cache immediately (write-through) - ALWAYS FIRST
  await this.updateCacheAfterWrite(optimisticEntity, 'create');
  
  // Step 3: Emit cache event (UI updates instantly) - ALWAYS SECOND
  cacheEvents.emitCacheChange(this.entityType);
  
  // Step 4: Handle sync (online vs offline) - AFTER cache update
  const isOnline = getIsOnline();
  
  if (isOnline) {
    // Online: Call service, update cache with server response
    try {
      const created = await this.service.createRecipe(entity);
      // Update cache with server-assigned ID and timestamps
      await this.updateCacheAfterWrite(created, 'create');
      cacheEvents.emitCacheChange(this.entityType);
      return created;
    } catch (error) {
      // Network error during service call → enqueue for retry
      if (error instanceof NetworkError) {
        await this.enqueueWrite('create', optimisticEntity);
      }
      throw error;
    }
  } else {
    // Offline: Enqueue write for later sync
    await this.enqueueWrite('create', optimisticEntity);
    return optimisticEntity;
  }
}
```

**Helper Method for Enqueueing**:

```typescript
private async enqueueWrite(
  op: SyncOp,
  entity: T
): Promise<void> {
  const localId = entity.localId ?? entity.id;
  const serverId = entity.id !== localId ? entity.id : undefined;
  
  await syncQueueStorage.enqueue(
    this.entityType,
    op,
    { localId, serverId },
    entity // Full entity payload
  );
}
```

**Key Changes**:
1. **Always update cache first** (before network operations)
2. **Always emit cache event** (UI updates instantly)
3. Check `getIsOnline()` after cache update
4. If offline: enqueue write after cache update
5. If online: call service, update cache with server response
6. Handle network errors during service calls (enqueue for retry)
7. Use `localId` for queue target (always present, even for new entities)

**Optimistic Entity Creation**:
- Generate temporary `localId` (UUID)
- Set `createdAt` timestamp
- Mark with flag indicating it's pending sync (optional)

### Phase 3: Sync Queue Processor (Batch-State Sync)

**File**: `mobile/src/common/utils/syncQueueProcessor.ts`

**Purpose**: Background processor that syncs queued writes when online using batch-state sync strategy.

**Sync Strategy: Batch-State Sync** (Recommended)

The queue stores "dirty entities" (latest state per localId). The processor sends current local state for all dirty entities to `/auth/sync`, which resolves conflicts via timestamps. This aligns with the existing backend endpoint better than replaying individual operations.

**Interface**:

```typescript
export interface SyncQueueProcessor {
  start(): void;
  stop(): void;
  processQueue(): Promise<void>;
  isProcessing(): boolean;
}
```

**Implementation**:

1. **Process Queue (Batch-State Sync)**:
   - Read all queued writes from storage
   - Group by `{entityType, target.localId}` (get latest state per entity)
   - For each unique entity, extract latest payload (after compaction, only one write per entity)
   - Build `SyncDataDto` with arrays of current entity states
   - Call `POST /auth/sync` endpoint with batch payload
   - Handle sync response (success/partial/failed)
   - Update cache with server-resolved entities (server IDs, timestamps)
   - Remove successfully synced writes from queue
   - Handle conflicts (keep in queue with incremented retry count)

2. **Payload Building**:

```typescript
async buildSyncPayload(): Promise<SyncDataDto> {
  const queue = await syncQueueStorage.getAll();
  
  // Group by entity type and get latest state per localId
  const entityMap = new Map<string, QueuedWrite>();
  
  for (const item of queue) {
    const key = `${item.entityType}:${item.target.localId}`;
    const existing = entityMap.get(key);
    
    // Keep latest write (by clientTimestamp)
    if (!existing || item.clientTimestamp > existing.clientTimestamp) {
      entityMap.set(key, item);
    }
  }
  
  // Build SyncDataDto with latest entity states
  const recipes: Recipe[] = [];
  const lists: ShoppingList[] = [];
  const items: ShoppingItem[] = [];
  const chores: Chore[] = [];
  
  for (const item of entityMap.values()) {
    const payload = item.payload;
    
    switch (item.entityType) {
      case 'recipes':
        recipes.push(payload as Recipe);
        break;
      case 'shoppingLists':
        lists.push(payload as ShoppingList);
        break;
      case 'shoppingItems':
        items.push(payload as ShoppingItem);
        break;
      case 'chores':
        chores.push(payload as Chore);
        break;
    }
  }
  
  return {
    recipes: recipes.length > 0 ? recipes : undefined,
    lists: lists.length > 0 ? lists : undefined,
    chores: chores.length > 0 ? chores : undefined,
  };
}
```

3. **Retry Logic**:
   - Max retries: 3 attempts
   - Exponential backoff: 1s, 2s, 4s
   - Remove from queue after max retries (log for manual sync)
   - Increment `attemptCount` on each retry

4. **Conflict Handling**:
   - Parse `SyncResult` from `/auth/sync` response
   - For successful syncs: Update cache with server entities, remove from queue
   - For conflicts: Keep in queue, increment retry count
   - For failed syncs: Keep in queue, increment retry count
   - Emit cache events for all updated entities

### Phase 4: Network Status Integration

**File**: `mobile/src/common/hooks/useSyncQueue.ts` (or integrate into existing hook)

**Purpose**: React hook that processes queue when network comes back online.

**Implementation**:

```typescript
export function useSyncQueue() {
  const { isOffline } = useNetwork();
  const processorRef = useRef<SyncQueueProcessor | null>(null);
  
  useEffect(() => {
    if (!processorRef.current) {
      processorRef.current = createSyncQueueProcessor();
    }
    
    if (!isOffline) {
      // Network came back online - process queue
      processorRef.current.processQueue().catch((error) => {
        console.error('Failed to process sync queue:', error);
      });
    }
  }, [isOffline]);
}
```

**Integration Points**:
- Add to `MainNavigator.tsx` or `App.tsx` (root level)
- Process queue on app foreground (if online)
- Process queue when network status changes from offline to online

### Phase 5: Update Cache After Queue Sync

**File**: `mobile/src/common/utils/syncQueueProcessor.ts`

**Purpose**: After successful sync, update cache with server-assigned IDs and timestamps.

**Flow**:
1. Process queue → API returns synced entities
2. Update cache: Replace optimistic entities with server entities
3. Emit cache events → UI updates with final data
4. Remove processed writes from queue

**ID Mapping**:
- Map temporary `localId` → server `id`
- Update all references in cache
- Handle entity relationships (e.g., shopping items → lists)

## File Structure

```
mobile/src/common/utils/
├── syncQueueStorage.ts                             # NEW: Queue storage utilities
├── syncQueueProcessor.ts                           # NEW: Queue processor
└── networkStatus.ts                                 # EXISTS: Network status check

mobile/src/common/repositories/
├── cacheAwareRecipeRepository.ts                    # MODIFY: Add offline queueing
├── cacheAwareShoppingRepository.ts                 # MODIFY: Add offline queueing
└── cacheAwareChoreRepository.ts                     # MODIFY: Add offline queueing

mobile/src/common/hooks/
└── useSyncQueue.ts                                 # NEW: Hook for queue processing

mobile/src/navigation/
└── MainNavigator.tsx                               # MODIFY: Add useSyncQueue hook
```

## Implementation Details

### Queue Storage Format

```typescript
// Stored in AsyncStorage as JSON array
[
  {
    "id": "uuid-1",
    "entityType": "recipes",
    "operation": "create",
    "payload": { /* recipe data */ },
    "createdAt": "2026-01-25T10:00:00Z",
    "retryCount": 0
  },
  {
    "id": "uuid-2",
    "entityType": "shoppingItems",
    "operation": "update",
    "entityId": "item-123",
    "payload": { /* updated item data */ },
    "createdAt": "2026-01-25T10:05:00Z",
    "retryCount": 1
  }
]
```

### Sync Payload Building

```typescript
// Group queued writes by entity type
const queue = await syncQueueStorage.getAll();

const recipes = queue
  .filter(q => q.entityType === 'recipes')
  .map(q => q.payload);

const lists = queue
  .filter(q => q.entityType === 'shoppingLists')
  .map(q => q.payload);

const items = queue
  .filter(q => q.entityType === 'shoppingItems')
  .map(q => q.payload);

const chores = queue
  .filter(q => q.entityType === 'chores')
  .map(q => q.payload);

const syncData: SyncDataDto = {
  recipes: recipes.length > 0 ? recipes : undefined,
  lists: lists.length > 0 ? lists : undefined,
  chores: chores.length > 0 ? chores : undefined,
};
```

### Optimistic Entity Creation

```typescript
// For creates, generate entity with localId
function createOptimisticRecipe(data: Partial<Recipe>): Recipe {
  const localId = uuidv4();
  return {
    id: localId, // Use localId as id initially (will be replaced by server id after sync)
    localId: localId,
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// For updates, ensure localId exists
function ensureLocalId(entity: Recipe): Recipe {
  if (!entity.localId) {
    // Entity from server may not have localId, generate one
    return { ...entity, localId: entity.id };
  }
  return entity;
}
```

**Important**: Always use `localId` for queue operations. The `id` field may be a server ID (for existing entities) or a localId (for new entities).

### Error Handling

**Network Errors During Queue Processing**:
- Catch `NetworkError` → Stop processing, queue remains
- Retry on next network status change

**API Errors During Sync**:
- Parse `SyncResult` for conflicts
- Handle partial success (some entities synced, others failed)
- Update cache for successful syncs
- Keep failed writes in queue (increment retry count)

**Storage Errors**:
- Log errors, don't crash app
- Gracefully degrade (writes may be lost if storage fails)

## Success Criteria

1. ✅ **Offline writes update UI instantly** (via write-through cache)
2. ✅ **Writes are queued when offline** (no errors thrown)
3. ✅ **Queue persists across app restarts** (AsyncStorage)
4. ✅ **Queue processes when back online** (automatic sync)
5. ✅ **Server IDs replace temporary IDs** (after sync)
6. ✅ **Conflicts are handled gracefully** (partial sync support)
7. ✅ **Retry logic prevents data loss** (exponential backoff)
8. ✅ **Backend schema supports queue persistence** (optional, for future server-side queue)

## Testing Strategy

### Manual Testing

1. **Offline Write Flow**:
   - Turn off network
   - Create/update/delete recipe, shopping item, chore
   - Verify UI updates immediately
   - Verify write is queued in storage
   - Turn on network
   - Verify queue processes automatically
   - Verify server IDs replace temporary IDs

2. **Queue Persistence**:
   - Queue writes offline
   - Close app
   - Reopen app (still offline)
   - Verify queue still exists
   - Turn on network
   - Verify queue processes

3. **Conflict Handling**:
   - Queue write offline
   - Modify same entity on another device
   - Sync queue when back online
   - Verify conflict resolution works

### Unit Tests (Future)

- Queue storage operations (enqueue, getAll, remove)
- Queue processor (payload building, retry logic)
- Repository offline behavior (queueing vs. service calls)
- Optimistic entity creation

## Dependencies

- ✅ `cacheAwareRepository.ts` - Cache operations
- ✅ `networkStatus.ts` - Network status detection
- ✅ `cacheEvents.ts` - UI update events
- ✅ Backend sync endpoint (`POST /auth/sync`)
- ✅ AsyncStorage - Local queue persistence
- ✅ `uuid` library - Generate queue item IDs

## Implementation Order

1. **Phase 1**: Mobile queue storage utilities (with precise schema and compaction)
2. **Phase 2**: Modify repositories for offline queueing (cache-first, then enqueue)
3. **Phase 3**: Sync queue processor (batch-state sync strategy)
4. **Phase 4**: Network status integration (process queue on network change)
5. **Phase 5**: Cache updates after sync (server ID mapping)

## Out of Scope

- ❌ Backend sync_queue table (mobile-only queue, syncs via existing `/auth/sync` endpoint)
- ❌ Server-side queue processing (separate epic if needed)
- ❌ Queue UI/visualization (can be added later)
- ❌ Manual queue retry UI (automatic retry only)
- ❌ Queue size limits UI warnings (log only)
- ❌ Comprehensive test suite (manual testing for now)
- ❌ Patch-based payloads (start with full entity, optimize later)

## Notes

- **Write Ordering**: Cache update → Event emit → Enqueue (non-negotiable)
- **Queue Compaction**: Prevents queue bloat from repeated operations (e.g., 20 toggles → 1 update)
- **Batch-State Sync**: Queue stores latest entity state, not operation log (aligns with `/auth/sync`)
- **LocalId-First**: Always use `localId` for queue operations (serverId may not exist offline)
- **Optimistic Updates**: UI updates immediately with entities containing `localId`
- **ID Mapping**: Server IDs replace localIds after sync, cache updated with final entities
- **Conflict Resolution**: Uses existing backend conflict resolution (timestamp-based LWW)
- **Queue Limits**: Max queue size (e.g., 100 items) prevents storage bloat
- **Deterministic Ordering**: `clientTimestamp` ensures consistent queue processing order