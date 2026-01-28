## Kitchen Hub – Project Context

### Monorepo Overview
- **mobile/**: React Native / Expo app (TypeScript, strict mode) for household management (shopping, recipes, chores, settings, dashboard).
- **backend/**: NestJS (Fastify) REST API with PostgreSQL + Prisma, Supabase integration (auth, storage, RLS).
- Shared design: offline‑first, household‑scoped data model, soft‑delete for user‑owned entities, JWT auth.

### Sync Architecture (High-Level)
- **Offline writes (mobile)**:
  - Stored via the `syncQueue` module under `mobile/src/common/utils/syncQueue`.
  - Queue items (`QueuedWrite`) represent create/update/delete operations for recipes, shopping lists/items, and chores.
  - Queue is persisted in AsyncStorage with:
    - Compaction by `{entityType, target.localId}` to avoid thrash.
    - Bounded size (`MAX_QUEUE_SIZE`) and crash‑safe processing via checkpoints.
- **Background processor (mobile)**:
  - `syncQueueProcessor` batches ready items and calls backend `/auth/sync`.
  - Uses stable `operationId` per queued write (idempotency key) and a `requestId` per batch for observability.
  - Supports partial batch recovery using `succeeded[]` and `conflicts[]` from the server; only explicitly confirmed operations are removed.

### Storage Schema Versioning (Mobile)
- **Queue records**:
  - Type: `QueuedWrite` in `syncQueue/storage/syncQueueStorage.types.ts`.
  - New optional field: `version?: number` (storage schema version).
  - Constants:
    - `CURRENT_QUEUE_STORAGE_VERSION = 1`.
  - Behavior:
    - Legacy records without `version` are treated as **version 1** and normalized on read.
    - `readQueue()` validates shape, backfills `status`, generates deterministic `operationId` for legacy items, and writes back the normalized queue when any migration occurs.
    - Items with `version > CURRENT_QUEUE_STORAGE_VERSION` are **kept**, but marked `FAILED_PERMANENT` with a clear `lastError` explaining the unsupported version.
- **Checkpoints**:
  - Type: `SyncCheckpoint` in `syncQueue/storage/syncQueueStorage.types.ts`.
  - New optional field: `version?: number`.
  - Constants:
    - `CURRENT_CHECKPOINT_STORAGE_VERSION = 1`.
  - Behavior:
    - `validateCheckpointShape()` normalizes `version` to **1** when missing/invalid (legacy checkpoints).
    - `saveCheckpoint()` stamps new checkpoints with `version = CURRENT_CHECKPOINT_STORAGE_VERSION`.
    - `getCheckpoint()` writes back the normalized checkpoint (including version) after validation and user‑id check, so migrations don’t re‑run every startup.

### API Payload Versioning (`/auth/sync`)
- **Backend DTO**: `backend/src/modules/auth/dtos/sync-data.dto.ts`
  - Field: `payloadVersion?: number` with `@IsInt()`, `@Min(1)`, `@IsOptional()`.
  - Current contract: `payloadVersion` is optional; missing or `1` are treated identically.
- **Mobile payload**:
  - `SyncDataDto` in `mobile/src/common/utils/syncQueue/processor/syncQueueProcessor.types.ts` includes `payloadVersion?: number`.
  - The processor always sends `payloadVersion: 1` when building the sync payload.
- **Purpose**:
  - Makes the `/auth/sync` contract observable and ready for future payload shape changes.
  - Keeps current behavior unchanged while providing a clear path for backward‑compatible evolution.

### Key Invariants & Safety Rules
- Each queued operation has a stable `operationId` used for idempotent processing and matching server results.
- **Never delete queue items without explicit confirmation**:
  - Remove only when `operationId` appears in `succeeded[]`.
  - Keep items in `conflicts[]` or missing from both arrays for safe retry.
- Checkpoints represent *in‑flight batches*; they are:
  - User‑scoped (per signed‑in user).
  - TTL‑bounded; stale checkpoints are cleared to avoid stalls.

