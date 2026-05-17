# Mobile Offline, Cache, and Sync Architecture

Last updated: 2026-05-16

This document is the source-backed map for KitchenHub mobile offline behavior, signed-in cache behavior, guest storage, and the offline write queue. It is documentation-only: it records current source behavior and known inconsistencies without proposing hosted pages, routes, or implementation work.

## Source inspected

Mobile source:

- `mobile/src/common/types/dataModes.ts`
- `mobile/src/common/storage/dataModeStorage.ts`
- `mobile/src/common/utils/guestStorage.ts`
- `mobile/src/common/utils/guestStorageHelpers.ts`
- `mobile/src/common/utils/cacheStorage.ts`
- `mobile/src/common/utils/cacheStorage.README.md`
- `mobile/src/common/utils/cacheMetadata.ts`
- `mobile/src/common/config/cacheConfig.ts`
- `mobile/src/common/repositories/cacheAwareRepository.ts`
- `mobile/src/common/repositories/cacheAwareShoppingRepository.ts`
- `mobile/src/common/repositories/cacheAwareRecipeRepository.ts`
- `mobile/src/common/repositories/cacheAwareChoreRepository.ts`
- `mobile/src/common/utils/syncQueueStorage.ts`
- `mobile/src/common/utils/syncQueueProcessor.ts`
- `mobile/src/common/utils/syncQueue/README.md`
- `mobile/src/common/utils/syncQueue/storage/*`
- `mobile/src/common/utils/syncQueue/processor/*`
- `mobile/src/common/hooks/useSyncQueue.ts`
- `mobile/src/common/hooks/useSyncStatus.ts`
- `mobile/src/common/utils/networkStatus.ts`
- `mobile/src/contexts/NetworkContext.tsx`
- `mobile/src/contexts/AppLifecycleContext.tsx`

Related docs:

- `docs/architecture/DATA_MODES_SPEC.md`
- `docs/architecture/GUEST_STORAGE_DECISION.md`
- `docs/api/mobile-api-client-integration.md`
- `backend/docs/api-sync-and-conflict-strategy.md`
- `docs/implementation/sync-queue-endless-sync-root-cause.md`

## Data modes

KitchenHub uses three data modes:

### Guest mode

- Purpose: local-only data for unauthenticated/guest users.
- Storage prefix: `@kitchen_hub_guest_`.
- Source: `mobile/src/common/utils/guestStorage.ts` and `mobile/src/common/storage/dataModeStorage.ts`.
- Backend sync: none during guest mode.
- Guest-to-signed import path: `mobile/src/services/import/importService.ts` uses validation from `mobile/src/common/validation/dataModeValidation.ts`.

Guest entity storage keys currently include:

- `@kitchen_hub_guest_recipes`
- `@kitchen_hub_guest_shopping_lists`
- `@kitchen_hub_guest_shopping_items`
- `@kitchen_hub_guest_chores`

Guest storage uses full collection read/write behavior through AsyncStorage. The operational limit and migration rationale live in `docs/architecture/GUEST_STORAGE_DECISION.md`.

### Signed-in mode

- Purpose: cloud-backed household data with local cache for startup speed and offline continuity.
- Storage prefix: `@kitchen_hub_cache_`.
- Primary backend routes: documented in `docs/api/backend-endpoints.md` and mapped from mobile in `docs/api/mobile-api-client-integration.md`.
- Sync queue storage key: `@kitchen_hub_cache_sync_queue` through `getSignedInCacheKey('sync_queue')`.

Signed-in user-owned entities currently include:

- recipes
- shopping lists
- shopping items
- chores

### Public catalog mode

- Purpose: read-only grocery/catalog reference data.
- Storage prefix: `@kitchen_hub_catalog_` for catalog cache helpers.
- Backend routes: public `/api/v1/groceries/*` endpoints.
- Writes: not exposed to public catalog mobile flows.

## Storage prefix guardrails

`mobile/src/common/storage/dataModeStorage.ts` defines the storage mode prefixes:

```ts
guest: '@kitchen_hub_guest_'
signedIn: '@kitchen_hub_cache_'
publicCatalog: '@kitchen_hub_catalog_'
```

It also provides:

- `getGuestStorageKey(entityType)`
- `getSignedInCacheKey(entityType)`
- `getPublicCatalogCacheKey(entityType)`
- `validateStorageKey(key, expectedMode)`
- `getModeFromStorageKey(key)`
- `extractEntityTypeFromKey(key)`

## Signed-in cache behavior

`mobile/src/common/repositories/cacheAwareRepository.ts` implements the shared cache-first read strategy used by feature-specific repositories.

Current behavior:

- `forceRefresh=true` and online: fetch from API, replace cache, update metadata, emit cache event.
- cache status `future_version`: preserve local data; if online, fetch/merge remote updates but do not wipe future-version data.
- cache status `corrupt`: return empty when offline; fetch from network when online.
- cache state `missing`: fetch from API if online; return empty if offline.
- cache state `fresh`, `stale`, or `expired`: return cached data without automatic network fetch.

Important current-source correction: comments in older docs may describe background refresh or blocking refresh on expired cache. The current shared repository implementation serves cached data for fresh/stale/expired states and uses explicit refresh paths for network refresh.

### Cache state thresholds

`mobile/src/common/config/cacheConfig.ts` defines cache states and TTLs:

- `fresh`: age <= stale threshold
- `stale`: age > stale threshold and <= ttl
- `expired`: age > ttl
- `missing`: no usable metadata timestamp

Current thresholds:

- recipes: stale after 5 minutes; expired after 10 minutes
- shopping lists: stale after 2 minutes; expired after 5 minutes
- shopping items: stale after 1 minute; expired after 3 minutes
- chores: stale after 2 minutes; expired after 5 minutes

Because the shared repository returns cached data for expired cache unless `forceRefresh=true`, "expired" currently means "eligible for explicit refresh", not "always blocks UI until network returns".

### Cache storage format

`mobile/src/common/utils/cacheStorage.ts` stores signed-in entity arrays in a versioned wrapper:

```ts
{ version: number, entities: T[] }
```

`mobile/src/common/utils/cacheStorage.README.md` documents read statuses:

- `ok`
- `migrated`
- `future_version`
- `corrupt`

Corrupt data is not silently overwritten by read-time migration. Future-version data is preserved.

## Offline write queue

Signed-in write operations can be queued when the device is offline. The queue is stored in AsyncStorage under:

```text
@kitchen_hub_cache_sync_queue
```

The current runtime import path used by app hooks and cache-aware repositories is:

```text
mobile/src/common/utils/syncQueueStorage.ts
mobile/src/common/utils/syncQueueProcessor.ts
```

Current runtime import references include:

- `mobile/src/common/hooks/useSyncQueue.ts`
- `mobile/src/common/hooks/useSyncStatus.ts`
- `mobile/src/common/repositories/cacheAwareShoppingRepository.ts`
- `mobile/src/common/repositories/cacheAwareRecipeRepository.ts`
- `mobile/src/common/repositories/cacheAwareChoreRepository.ts`

A newer modularized tree also exists under:

```text
mobile/src/common/utils/syncQueue/storage/*
mobile/src/common/utils/syncQueue/processor/*
```

But during this documentation pass, direct runtime imports from app hooks/repositories were found pointing to the root-level `syncQueueStorage.ts` and `syncQueueProcessor.ts`, not the modular `syncQueue/processor` index. Treat the modular tree as present source but verify imports before calling it the active runtime path.

### Queue item model

Root-level `syncQueueStorage.ts` defines queued writes with:

- `id`
- `operationId`
- `entityType`
- `op`: `create`, `update`, or `delete`
- `target.localId`
- optional `target.serverId`
- `payload`
- `clientTimestamp`
- `attemptCount`
- optional `lastAttemptAt`
- `status`: `PENDING`, `RETRYING`, or `FAILED_PERMANENT`
- optional `lastError`
- optional `requestId`

Queue limit:

```text
MAX_QUEUE_SIZE = 100
```

### Worker lifecycle

`mobile/src/common/hooks/useSyncQueue.ts` manages the worker lifecycle:

- starts the worker only when the app is online and the queue has items
- starts on online transitions if queued items exist
- starts on foreground transitions if queued items exist
- stops when offline
- stops when app backgrounds
- stops on hook unmount

`mobile/src/features/mobile-ui-map.md` notes that `MainNavigator` runs `useSyncQueue()` so queued local changes can sync when network/app lifecycle allows.

### Sync endpoint

Both root and modular processors call:

```text
POST /api/v1/auth/sync
```

The API client call uses `api.post('/auth/sync', payload)`, which `mobile/src/services/api.ts` expands to `/api/v1/auth/sync`.

## Error, retry, and result behavior

Root `syncQueueProcessor.ts` current behavior includes:

- network errors: retry without incrementing attempt count
- 401/403: stop worker because re-auth is required
- 4xx validation errors: retry with attempt increment, eventually permanent failure
- 5xx errors: retry with attempt increment and backoff
- maximum retry attempts: 3
- base backoff: 1 second
- max backoff: 30 seconds
- minimum interval between sync requests: 3 seconds
- max sync requests per worker run: 5

The modular processor constants define:

- `MAX_BATCH_SIZE = 50`
- `MAX_RETRY_ATTEMPTS = 3`
- `BASE_BACKOFF_DELAY_MS = 1000`
- `MAX_BACKOFF_DELAY_MS = 30000`

Do not assume the modular constants govern runtime unless imports are changed to use the modular processor.

## Sync status UI

`mobile/src/common/hooks/useSyncStatus.ts` and `mobile/src/common/utils/syncStatusUtils.ts` derive sync status from queued writes. Feature docs currently mention this for chores, where cards can show pending/confirmed/failed states.

## Known current-source inconsistencies

These are documentation/source alignment notes only:

- `mobile/src/common/utils/networkTest.ts` still references `${API_BASE_URL}/api/health`, while current backend health routes are versioned under `/api/v1/health*`.
- `mobile/src/common/utils/syncQueue/README.md` describes the modular `syncQueue` tree as the module split, but runtime imports still point at root-level `syncQueueStorage.ts` and `syncQueueProcessor.ts`.
- Older docs may imply expired cache forces a blocking network fetch; current `getCached()` returns cached data for expired cache unless `forceRefresh=true` and online.
- `docs/architecture/DATA_MODES_SPEC.md` still has some historical "New Files Created" wording; treat it as architecture/spec context, not a release log.

## Verification checklist for future docs updates

Before changing offline/cache/sync docs, verify:

- runtime imports for sync queue storage/processor
- cache TTLs in `mobile/src/common/config/cacheConfig.ts`
- cache read behavior in `mobile/src/common/repositories/cacheAwareRepository.ts`
- storage prefixes in `mobile/src/common/storage/dataModeStorage.ts`
- queue model and retry constants in the active processor path
- mobile API route expansion in `mobile/src/services/api.ts`
- `/auth/sync` backend contract in `backend/docs/api-sync-and-conflict-strategy.md` and backend auth sync controller/service source
