## syncQueue/storage

This submodule is responsible for **persisting the signed-in offline write queue and its checkpoints**.

Responsibilities:

- Store queued writes (`QueuedWrite`) in AsyncStorage under a signed-in cache key.
- Enforce queue invariants:
  - Bounded size (`MAX_QUEUE_SIZE`).
  - Compaction by `{entityType, target.localId}` to avoid thrash.
  - Backward-compatible migrations for older formats (e.g., missing `operationId` or `status`).
- Manage **checkpoints** (`SyncCheckpoint`) that mark in-flight batches so the worker can re-drive them after crashes:
  - User-scoped storage keys to avoid cross-account leakage on shared devices.
  - TTL-based staleness handling.
  - Attempt metadata (`attemptCount`, `lastAttemptAt`) for checkpoint-level backoff.
  - Pruning of `inFlightOperationIds` that no longer exist in the queue (e.g. due to compaction).

Key files:

- `types.ts` – defines `SyncOp`, `QueuedWriteStatus`, `QueueTargetId`, `QueuedWrite`, `SyncCheckpoint`.
- `constants.ts` – queue-related constants and storage key prefixes.
- `storageInternal.ts` – low-level helpers for reading/writing the queue and compaction/migration.
- `checkpointStorage.ts` – checkpoint persistence and validation logic.
- `SyncQueueStorageImpl.ts` – implementation of the `SyncQueueStorage` interface.
- `index.ts` – public entry point exporting the `SyncQueueStorage` interface and the `syncQueueStorage` singleton used by the rest of the app.

## Schema versioning

- **Storage schema versions**:
  - `QueuedWrite` and `SyncCheckpoint` include an optional `version` field that represents the **storage schema version**.
  - Constants:
    - `CURRENT_QUEUE_STORAGE_VERSION`
    - `CURRENT_CHECKPOINT_STORAGE_VERSION`
  - Legacy records without `version` are treated as version `1` and normalized on read.
- **Migrations**:
  - Queue records:
    - `readQueue()` validates shape, backfills `status`, and generates a deterministic `operationId` for legacy items that are missing it.
    - If any item is migrated (status fixed, `operationId` added, or `version` defaulted), the entire queue is written back in normalized form.
  - Checkpoints:
    - `validateCheckpointShape()` normalizes the `version` field (defaulting to `1` when missing/invalid, matching queue record behavior).
    - `getCheckpoint()` writes back the normalized checkpoint after successful validation.
- **Unknown future versions**:
  - Queue items with `version > CURRENT_QUEUE_STORAGE_VERSION` are **kept** but marked as `FAILED_PERMANENT` to avoid processing data from an unsupported future schema.
  - Checkpoints with higher versions are accepted as long as their shape is valid; version is preserved on read/write.

If you want to:

- Change how many items can be in the queue → see `constants.ts`.
- Adjust compaction rules or migrations → see `storageInternal.ts`.
- Change checkpoint TTL, scoping, or backoff metadata → see `checkpointStorage.ts`.

