# Root cause: Non‑stopping sync calls (POST /auth/sync)

## Symptom

The mobile app keeps sending `POST /api/v1/auth/sync` every few seconds and the queue never empties.

## Root cause

**The sync queue can have multiple entries for the same entity (same `entityType` + `target.localId`) with different `operationId`s. The client only sends one operation per entity (latest by `clientTimestamp`), so only one `operationId` per entity ever appears in the backend response. Entries with older `operationId`s are never in `succeeded`, so they are never removed → the queue never empties and sync runs repeatedly.**

### Flow

1. **Enqueue**  
   Each create/update enqueues a write with a new `operationId` (e.g. `op-1`, then `op-2` for the same recipe).

2. **Build payload**  
   `buildSyncPayload(readyItems)` uses `groupWritesByEntity(readyItems)` and keeps **one** write per entity (latest by `clientTimestamp`). So the payload contains only **one** `operationId` per entity (e.g. `op-2`).

3. **Backend**  
   Backend processes the payload and returns `succeeded: [op-2, ...]` (only the operationIds that were sent).

4. **Apply result**  
   `processSyncResultsByOperationId(readyItems, result)` only removes entries whose `operationId` is in `succeeded`. The entry with `op-2` is removed. The entry with `op-1` (same entity, never sent) is **not** in `succeeded` → it is treated as “unknown” and **kept** in the queue.

5. **Next run**  
   The worker sees a non‑empty queue, builds the payload again (again only `op-2` for that entity, or `op-1` if it’s the only one left), gets `succeeded` for that id, removes that one entry. Any other entry for the same entity (e.g. `op-1`) is still never in `succeeded` → stays forever → sync never stops.

So the **reason** sync doesn’t stop is: **duplicate queue entries per entity + compaction to one operation per entity + removal only by `operationId`** → some entries are never in `succeeded` and never removed.

## Fix (client)

When removing a queue entry because its `operationId` is in `succeeded`, also remove **all other entries in the same batch** that refer to the **same entity** (`entityType` + `target.localId`). That way one successful sync for an entity clears all duplicate entries for that entity and the queue can drain.

Implemented in: `syncQueueProcessor.ts` → `processSyncResultsByOperationId`: after removing an item by `operationId`, remove every other item in the same `queue` (batch) with the same `entityType` and `target.localId`.

## Other checks (already correct)

- **Backend idempotency skip**  
  When the backend skips an already‑processed operation, `processEntitiesWithTracking` still adds it to `succeeded` (the callback completes without throwing), so the client does get that `operationId` and can remove the entry. No change needed there.

- **Response shape**  
  Backend wraps with `{ success, data }`; the client unwraps via `unwrapSuccessData`, so the processor receives `{ status, conflicts, succeeded }` as expected.

- **4xx/5xx with body**  
  If the backend ever returns 4xx/5xx with a SyncResult body, the client cannot use it today because `ApiError` does not carry `response.data`. That would cause retries but is a separate issue from the endless sync loop above.
