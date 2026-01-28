## syncQueue module

The `syncQueue` module implements the **signed-in offline write queue** and its background processor.
It is responsible for:

- Persisting dirty entity state for recipes, shopping lists/items, and chores while offline.
- Safely syncing those changes to the backend `/auth/sync` endpoint when the device is online.
- Ensuring **idempotent**, **partial-batch-safe**, and **crash-safe** behavior via:
  - Stable `operationId` per queued write.
  - Partial batch recovery using `succeeded[]` / `conflicts[]` from the server.
  - Lightweight **checkpoints** that mark in-flight batches and are re-driven after app restarts.

The module is split into two submodules:

- `storage/` – queue and checkpoint persistence in AsyncStorage.
- `processor/` – worker loop, backoff, batching, payload building, and result handling.

If you want to:

- **Change how the queue is stored, compacted, or checkpointed** → see `storage/`.
- **Change how/when sync runs, how backoff or retries work, or how results are interpreted** → see `processor/`.

Both submodules are wired together by the `syncQueueProcessor`, which reads from `syncQueueStorage`, builds a sync payload, calls `/auth/sync`, and then applies results back to the queue and cache.

