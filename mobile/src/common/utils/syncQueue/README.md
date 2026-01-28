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

### Schema and payload versioning

- **Storage schema versioning (mobile)**:
  - Queue records (`QueuedWrite`) and checkpoints (`SyncCheckpoint`) include a `version` field representing the **storage schema version**.
  - Legacy records without `version` are treated as version `1` and migrated on read; the normalized form is written back to AsyncStorage.
  - Queue items with an unknown future version are retained but marked as non-processable (`FAILED_PERMANENT`) to avoid corrupting data.
- **API payload versioning (`/auth/sync`)**:
  - Every sync request includes a top-level `payloadVersion` (currently `1`) in the payload built by the processor.
  - The backend `SyncDataDto` accepts `payloadVersion` as an optional number; missing or `1` are treated identically today.
  - This keeps the API contract observable and ready for future payload evolutions without breaking older clients.

If you want to:

- **Change how the queue is stored, compacted, or checkpointed** → see `storage/`.
- **Change how/when sync runs, how backoff or retries work, or how results are interpreted** → see `processor/`.

Both submodules are wired together by the `syncQueueProcessor`, which reads from `syncQueueStorage`, builds a sync payload, calls `/auth/sync`, and then applies results back to the queue and cache.

