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

If you want to:

- Change how many items can be in the queue → see `constants.ts`.
- Adjust compaction rules or migrations → see `storageInternal.ts`.
- Change checkpoint TTL, scoping, or backoff metadata → see `checkpointStorage.ts`.

