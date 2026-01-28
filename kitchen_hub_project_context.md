## Kitchen Hub App — Project Context Overview

### Epic Status Summary

- **Backend Infrastructure & Data Architecture**: Prisma, PostgreSQL with soft-delete (`deletedAt`), `createdAt`/`updatedAt` directives. API-level versioning and deprecation are now documented; DB-wide schema rollback/versioning is still not formalized.
- **Public Catalog (Guest + Signed-In) – Plan 009**: Not detailed here.
- **Guest Mode – Mobile & API**:
  - Local-only data via AsyncStorage
  - Device-specific `deviceId`
  - Envelope versioning (v1) implemented in guestStorageHelpers
  - No multi-device sync

- **Product / UX Tickets**: Not detailed here.

- **Signed-In Cache + Offline Sync (Plan 008)**:
  - Batch-state sync strategy (not FIFO)
  - Compaction: merges creates/updates, drops create+delete pairs
  - Queue persisted in AsyncStorage
  - Worker loop filters by `lastAttemptAt`, retries with exponential backoff
  - Per-item tracking: `status`, `attemptCount`, `lastError`
  - **Checkpointing**: crash-safe `SyncCheckpoint` records for in-flight batches
    - Stored per signed-in user with `createdAt`, `attemptCount`, `lastAttemptAt`, `ttlMs`
    - Records `requestId` and `inFlightOperationIds` for the current batch
  - **Idempotency Keys**: Each queued write includes stable `operationId` (UUID) for safe retries
    - OperationId preserved through compaction
    - Deterministic generation for migration of old queue items
    - Optional `requestId` for batch observability
  - **Partial Batch Recovery**: Retries only failed items after partial sync failures
    - Backend returns granular per-entity results with `operationId` mapping
    - Mobile removes items ONLY when explicitly confirmed in `succeeded[]` array
    - Unknown items (not in succeeded or conflicts) are kept for retry (safety-first)
    - Handles confirmed responses even on non-2xx status codes
    - Full backward compatibility with older server versions
    - Invariant enforcement: every `operationId` must appear in results (logs error if violated)
  - **Crash-Safe Recovery via Checkpoints**:
    - On worker start, if a checkpoint exists, the worker **re-drives that exact batch first**
    - If checkpoint items no longer exist in the compacted queue, the checkpoint is cleared and normal processing resumes
    - Checkpoints use exponential backoff (`attemptCount` + `lastAttemptAt`) to avoid hot loops
    - TTL-based staleness (`now - createdAt > ttlMs`) clears stuck checkpoints; safe due to idempotent `operationId`s
  - Realtime updates via Supabase WebSocket channels
    - Instant cross-device synchronization for shopping lists and items
    - Custom `useShoppingRealtime` hook manages subscriptions
    - Cache updates trigger automatic UI re-renders via `useCachedEntities`
  - Conflict resolution via LWW and `deletedAt` tombstones
  - Sync result is deterministic, not order-dependent

- **Guest Mode – Local Persistence (Plan 007)**:
  - Versioned envelope format (v1)
  - No schema migration logic beyond v1
  - Legacy format auto-upgrades

- **Architecture & Cross-Cutting Foundations**:
  - Conflict resolution utilities implemented:
    - `compareTimestamps`, `determineConflictWinner`
    - `mergeEntitiesWithTombstones`, `mergeEntityArrays`
  - Used across cache-aware repos, backgroundRefresh, realtime
  - Realtime conflict resolution handles:
    - Deletion priority via `deletedAt`
    - LWW for scalar field conflicts (remote wins if timestamps equal)
  - **Cache-Aware Repository Pattern**: Shopping feature uses `CacheAwareShoppingRepository` with `useCachedEntities` hooks
    - Reactive cache updates via React hooks
    - Automatic UI updates when cache changes
    - Eliminates manual state management for signed-in users
  - **Realtime Sync Integration (Plan 007)**:
    - Custom `useShoppingRealtime` hook for managing Supabase subscriptions
    - Follows React composition patterns, decouples subscription logic from UI
    - Supports both signed-in (cache-based) and guest (state-based) modes
    - Repository methods: `applyRealtimeListChange()` and `applyRealtimeItemChange()`
    - Subscriptions filtered by `household_id` for RLS compliance
    - Memoized dependencies prevent unnecessary re-subscriptions
    - Comprehensive test coverage: hook tests, integration tests, RLS validation (36 tests)

  - **API Versioning Infrastructure**:
    - Backend now uses URI-based API versioning with explicit `/api/v1`, `/api/v2`, ... paths:
      - Global prefix `api` plus NestJS `enableVersioning({ type: URI })`.
      - Controllers declare `@Controller({ path: 'X', version: '1' })` so versions are explicit at the routing layer.
    - Common versioning module in `backend/src/common/versioning/`:
      - `api-version.constants.ts`: `CURRENT_API_VERSION = '1'`, `SUPPORTED_API_VERSIONS = ['1']`, `DEPRECATED_API_VERSIONS = []`, `SUNSET_API_VERSIONS = []`.
      - `versioning.config.ts`: helpers to answer whether a version is supported/deprecated/sunset and to fetch `VersionMetadata`.
      - `version.guard.ts`: global guard returning 404 for unsupported versions and 410 for sunset versions (with optional migration guide text).
      - `deprecation.decorator.ts` + `deprecation.interceptor.ts`: version-wide deprecation headers and optional per-endpoint deprecation.
      - `version.utils.ts`: shared `extractVersionFromRequest()` to parse `/api/v{n}` and NestJS `request.version`.
    - Version discovery endpoint in `HealthModule`:
      - `GET /api/version` (public, unversioned meta endpoint) returns `current`, `supported`, `deprecated`, `sunset`, and docs links (e.g. `/api/docs/v1`).
    - Mobile API client now takes an explicit API version:
      - Base URL is `http(s)://host:port/api`, and all calls target `/api/v{version}{endpoint}`.
      - `EXPO_PUBLIC_API_VERSION` (default `'1'`) feeds `config.api.version` and `ApiClient`’s `apiVersion`.
      - `setApiVersion()` validates version strings as positive integers before use.

---

### Offline Sync Mechanics

**Queue Behavior**
- Stores writes per entity (`entityType:localId`)
- Merges multiple writes into one latest state
- Not FIFO, only latest entity state sent
- Compaction rules (create + delete = no-op, delete wins)
- Each queue item has stable `operationId` (UUID) for idempotent backend processing
- OperationId preserved during compaction (surviving item keeps its operationId)

**Worker Loop**
- Filters for ready items based on `lastAttemptAt`
- Exponential backoff per item
- Retry limit: 3 attempts → `FAILED_PERMANENT`
- Batches all ready items in one `POST /api/v1/auth/sync` call
- Each entity in sync payload includes `operationId` for idempotent processing
- Optional `requestId` included for batch observability
- **Partial Batch Recovery**: Only failed items are retried after partial failures
  - Backend returns `succeeded[]` array with `operationId`s for successful entities
  - Backend returns `operationId` in `conflicts[]` for failed entities
  - Mobile matches results by `operationId` (never assumes success)
  - Unknown items (not in either array) are kept for retry with warning logged
  - Distinguishes confirmed responses (even on error) vs no confirmation (network error)
- **Checkpoint-First Processing**:
  - If a checkpoint exists, the worker first loads the queue and selects items whose `operationId` is in `checkpoint.inFlightOperationIds`
  - If none are found (compacted/cleared), the checkpoint is cleared and normal processing continues
  - Checkpoints use the same backoff strategy as items (`attemptCount`, `lastAttemptAt`) plus a TTL window
  - Prevents the “in-flight items forever filtered out” deadlock by always re-driving or clearing stale checkpoints

**Conflict Resolution**
- Client-side LWW (Last Write Wins) by `updatedAt` when merging **remote state into local cache**
- `deletedAt` wins over any update (tombstone semantics)
- Timestamps normalized (handles timezone, ISO strings)
- Realtime payloads also processed via LWW on the client
- Deterministic merge ensures same outcome regardless of order
- Backend currently uses simple Prisma `upsert` for `POST /api/v1/auth/sync` without server-side LWW gates or timestamp/version checks
  - The database reflects the order in which sync writes are successfully processed
  - The mobile client is responsible for reconciling local vs remote state using its LWW + tombstone utilities

---

### Limitations & Recommendations

**Schema Versioning & API Versioning**
- Guest mode: versioned envelope (v1) for local persistence; no additional migrations yet.
- Signed-in sync queue: storage schema versioning v1 for `QueuedWrite` and `SyncCheckpoint`:
  - `version` field on queue items and checkpoints.
  - Read-time migrations + best-effort write-back to normalize legacy records.
  - Future versions (`version` > current) are retained but marked `FAILED_PERMANENT` with a diagnostic `lastError`.
- Signed-in cache storage: storage schema versioning v1 for cache entity arrays and metadata:
  - Cache arrays stored as `{ version: number, entities: T[] }` wrapper format.
  - Cache metadata includes optional `version?: number` field.
  - Constants: `CURRENT_CACHE_ENTITY_STORAGE_VERSION` (global), `CURRENT_CACHE_METADATA_STORAGE_VERSION`.
  - Read-time migrations with write-back normalization for legacy data.
  - Future versions (`version` > current) are preserved but not migrated (status: `'future_version'`).
  - Corruption handling distinguishes: legacy, current, future, corrupt, wrong type.
  - Never writes back or clears corrupt/future version data.
- `POST /api/v1/auth/sync` payload: `payloadVersion` (positive integer, currently `1`) added to the sync DTO; missing or `1` are treated equivalently for backward compatibility.
- Backend DB: still no explicit DB-wide schema version tracking or rollback automation; HTTP API contract versioning and deprecation policies are now covered by dedicated backend docs.

**Idempotency & Retry**
- ✅ **Idempotency Keys Implemented**: Each sync operation includes unique `operationId` (UUID)
  - Backend uses atomic insert-first pattern (`SyncIdempotencyKey` + `processEntityWithIdempotency`) to prevent duplicate processing
  - Same `operationId` processed only once; safe retries without duplication
  - `SyncIdempotencyKey` table tracks processed operations with retention cleanup
  - Mobile generates stable `operationId` per queued write, preserved through compaction
- ✅ **Partial Batch Recovery Implemented**: Only failed items are retried after partial failures
  - Backend returns granular per-entity results with `operationId` mapping in `succeeded[]` and `conflicts[]` (for newer servers)
  - Mobile uses safety-first logic: removes items ONLY when `operationId` is in `succeeded[]`
  - Unknown items (not in `succeeded[]` or `conflicts[]`) are kept for retry to prevent data loss
  - Backend attempts to cover all `operationId`s and logs an error if any are missing; this is a **soft** invariant (no exception is thrown)
  - Mobile’s queue processor is written to tolerate invariant violations by treating missing `operationId`s as “no confirmation”
  - Handles backward compatibility with older server versions (missing `succeeded` array)
  - Processes confirmed responses even on non-2xx status codes

**Multi-Device / Multi-Account**
- Signed-in: ✅ syncs across devices
- Guest: ❌ device-specific only
- No UI for account switching or multi-account management

**Security & Sensitivity**
- Guest mode: no sensitive data, unlikely encryption required
- Signed-in: authentication secured, sync endpoint protected

---

### Future Improvements
- ✅ **Idempotency Keys**: Implemented for sync operations (backend + mobile)
- ✅ **Realtime Sync Integration**: Implemented for shopping lists/items with custom hook and cache integration
- ✅ **Partial Batch Recovery**: Implemented with granular operation tracking and safety-first logic
- ✅ **Cache Storage Schema Versioning**: Implemented for cache entity arrays and metadata with migration support
- Support schema migrations in guest mode
- Direct cache updates for serverId mappings (currently uses cache invalidation via refresh)
- API-side retry strategies for transient failures
- Build out account switching and multi-account session management
- Document DB schema migration/versioning strategies (API contract versioning and deprecation are already documented)
- Consider scheduled cleanup automation for idempotency keys (currently manual/optional)
- Extend realtime sync to other features (recipes, chores) using same hook pattern
- Consider adding server-side timestamp-aware conflict checks and clearer resurrection semantics for soft-deleted records, as described in `backend/docs/api-sync-and-conflict-strategy.md`

