## syncQueue/processor

This submodule implements the **background worker** that drives the signed-in offline sync queue.
It coordinates:

- When to attempt sync (online status, per-item backoff).
- How many items to send at once (batching).
- How to build the sync payload for `/auth/sync`.
- How to interpret the server response (including partial success and conflicts).
- How to apply results back to the queue and cache (removing succeeded items, retrying failed ones).
- How to **re-drive checkpoints** after crashes using idempotent `operationId`s.

Key behavior:

- **Checkpoint-first**: if a checkpoint exists, the worker always tries to re-drive that in-flight batch before processing new work.
- **Per-item and per-checkpoint backoff** to prevent hot loops.
- **Partial batch recovery** using `succeeded[]` and `conflicts[]` from the server.
- **Safety-first invariants**: never delete items without explicit confirmation; unknown `operationId`s are kept for retry.

Key files:

- `index.ts` – public entry point exposing `SyncQueueProcessor`, `createSyncQueueProcessor`, and `getSyncQueueProcessor`. Owns the worker loop and high-level orchestration.
- `types.ts` – `SyncResult` and sync DTO types used for the `/auth/sync` payload and response.
- `constants.ts` – processor-specific constants (e.g., `MAX_BATCH_SIZE`).
- `backoff.ts` – exponential backoff helpers for items and checkpoints.
- `errorHandling.ts` – error classification (`RETRY`, `STOP_WORKER`, `DEAD_LETTER`) and mapping from exceptions to policies.
- `payloadBuilder.ts` – transforms queued entities into backend DTOs (`SyncDataDto`).
- `resultHandler.ts` – applies server results back to the queue and cache (remove/retain items, increment retries, invalidate cache).
- `checkpointWorker.ts` (optional) – encapsulates checkpoint re-drive logic if needed.

If you want to:

- Change how often sync runs or how long we wait between retries → see `backoff.ts` and `constants.ts`.
- Change how errors are classified (e.g., which HTTP codes dead-letter) → see `errorHandling.ts`.
- Extend what gets sent to `/auth/sync` → update `payloadBuilder.ts` and the DTO types in `types.ts`.
- Modify how partial results are applied → see `resultHandler.ts`.

