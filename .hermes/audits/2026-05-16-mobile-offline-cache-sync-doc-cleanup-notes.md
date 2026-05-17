# Mobile Offline / Cache / Sync Documentation Notes

Date: 2026-05-16

## Source inspected

Mobile source:

- `mobile/src/common/types/dataModes.ts`
- `mobile/src/common/storage/dataModeStorage.ts`
- `mobile/src/common/utils/guestStorage.ts`
- `mobile/src/common/utils/guestStorageHelpers.ts`
- `mobile/src/common/utils/cacheStorage.ts`
- `mobile/src/common/config/cacheConfig.ts`
- `mobile/src/common/repositories/cacheAwareRepository.ts`
- `mobile/src/common/repositories/cacheAwareShoppingRepository.ts`
- `mobile/src/common/repositories/cacheAwareRecipeRepository.ts`
- `mobile/src/common/repositories/cacheAwareChoreRepository.ts`
- `mobile/src/common/utils/syncQueueStorage.ts`
- `mobile/src/common/utils/syncQueueProcessor.ts`
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

## Documentation added

Added `docs/architecture/mobile-offline-cache-sync.md` as the current source-backed map for:

- guest/signed-in/public catalog data modes
- storage prefixes and keys
- signed-in cache TTL states and current read behavior
- versioned cache array format
- offline write queue storage model
- active root-level sync queue processor/storage import path
- modular sync queue tree caveat
- sync worker lifecycle in `useSyncQueue()`
- retry/backoff/error handling behavior
- known source inconsistencies

## Important findings

- Current app/runtime imports point to root-level `mobile/src/common/utils/syncQueueStorage.ts` and `mobile/src/common/utils/syncQueueProcessor.ts`.
- A modular tree exists under `mobile/src/common/utils/syncQueue/*`, but hooks/repositories inspected in this pass do not directly import its processor/storage indexes.
- `cacheAwareRepository.getCached()` returns cached data for fresh/stale/expired cache states unless explicit `forceRefresh=true` is used and online. Older wording that implies expired cache always blocks on network should be treated as stale.
- `networkTest.ts` still references `/api/health`, while source-backed backend health endpoints are versioned under `/api/v1/health*`.

## Files updated

- `docs/architecture/mobile-offline-cache-sync.md`
- `docs/project/DOCUMENTATION_MAP.md`
- `docs/project/ARCHITECTURE.md`
- `docs/project/RECENT_CHANGES.md`

## Archive decision

No stale duplicate docs were moved in this pass. Existing docs were left in place and cross-linked because they still contain useful narrow implementation detail or historical rationale.

## Open questions

- Whether the modular `mobile/src/common/utils/syncQueue/*` tree should eventually replace the root-level runtime queue files is a code ownership question, not a documentation change.
- Whether `networkTest.ts` should be updated to `/api/v1/health` is an implementation question; docs only recorded the mismatch.
