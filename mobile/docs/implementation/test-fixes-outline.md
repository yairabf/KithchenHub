# Outline: Fix Remaining Failing Mobile Tests

This document outlines how to fix the three remaining failing test suites so the full mobile test suite passes.

---

## 1. catalogService.spec.ts (9 failing tests)

### Root cause
- **Implementation behavior**: `getGroceryItems()` does more than “call API and return”:
  1. Calls `api.get('/groceries/search?q=')` for catalog items.
  2. Calls `getCustomItems()` (which uses `api.get` for custom grocery items).
  3. Merges catalog + custom items.
  4. **Supplements** with required categories from mock data (`REQUIRED_CATEGORIES`: `household`, `spices`) via `supplementMissingCategoryItems()`, which adds 4 household + 8 spices items from `mockGroceriesDB`.

- **Tests expect**: e.g. exactly 2 items from API success, or exact cached array.
- **Actual**: API success returns 2 items, then custom items are merged, then 12+ supplemented items are added → length is 14+.

### Fix strategy

| Option | Action |
|--------|--------|
| **A. Isolate API path** | Mock or stub `getCustomItems()` and the supplement step in tests so only the path under test runs (e.g. only API, or only cache). |
| **B. Mock api.get for all catalog endpoints** | In `beforeEach`, set `api.get` to resolve with the shape the service expects; ensure custom-items endpoint returns `[]` so merge doesn’t add items. Then either (1) stub `supplementMissingCategoryItems` / required-categories logic so it doesn’t run in tests, or (2) accept supplemented length and assert “at least 2” / “contains expected items” instead of exact length. |
| **C. Reset memoization** | Tests already clear `(service as any).groceryItemsPromise = null` in `beforeEach`. Ensure no shared state (e.g. single `CatalogService` instance) causes one test’s API/cache result to leak into another. |

**Recommended**: **B** – In `beforeEach`:
- `mockApiGet.mockResolvedValue([...])` for the main catalog call.
- Ensure a second `api.get` call (custom items) is mocked, e.g. `mockApiGet.mockResolvedValueOnce([...]).mockResolvedValue([])` so the first call is catalog, the second is custom (empty).
- Either mock the module that provides `supplementMissingCategoryItems` / required categories so they don’t run, or relax assertions to “minimum length + contains expected items” and allow supplemented data.

**Files**
- `mobile/src/common/services/__tests__/catalogService.spec.ts` – adjust mocks and expectations.
- `mobile/src/common/services/catalogService.ts` – no change unless you add a test-only seam for supplement/custom items.

---

## 2. useCachedEntities.test.tsx (17 failing tests)

### Root cause
- **Implementation**: `useCachedEntities` uses `useAuth()` and only runs the initial load when **auth is not loading**:

  ```ts
  if (isAuthLoading) {
    return;
  }
  loadFromCache(false);
  ```

- **Tests**: Do not mock `useAuth`, so the real (or default) auth context runs. If `isAuthLoading` stays `true` or is unstable, the effect never runs or runs at the wrong time, so `readCacheArray` is never called and assertions (data, loading, error) don’t match.

### Fix strategy

- **Mock `useAuth`** in the test file so that auth is “ready” and the load effect runs:
  - e.g. `jest.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ isLoading: false }) }));`
  - Place the mock before any import that pulls in `useCachedEntities` (so the hook sees the mock).

- Then:
  - **“should load data from cache on mount”**: With `isAuthLoading: false`, the effect runs, `readCacheArray` is called, and `data`/`isLoading`/`error` should match expectations.
  - **“should handle loading state correctly”**: Same; ensure delay in `readCacheArray` leaves `isLoading` true until the promise resolves.
  - **Error cases**: Keep mocking `readCacheArray` to reject with the right errors; with auth mocked, the effect will run and the hook will set `error` and clear loading as implemented.

**Files**
- `mobile/src/common/hooks/__tests__/useCachedEntities.test.tsx` – add `jest.mock('../../contexts/AuthContext', ...)` with `isLoading: false`, and ensure no other dependency (e.g. `cacheEvents`) blocks the first load.

---

## 3. syncQueueProcessor.test.ts (19 failing tests)

### Root cause
- **Payload validation**: The processor builds the sync payload from queued items. For **recipes**, it uses:
  - `isValidRecipe(payload)`: requires `payload.title` (string).
  - Test payloads use **`name`** (e.g. `payload: { id: 'recipe-1', name: 'Recipe 1', ingredients: [], instructions: [] }`).
- So recipe payloads **fail validation**. When no valid recipe (or list/chore) payload remains, `hasData` is false and the processor runs:

  ```ts
  if (!hasData) {
    for (const item of readyItems) {
      await syncQueueStorage.remove(item.id);
    }
    return;
  }
  ```

  So **every** queue item is removed, and the code never calls `handleSyncResult`. Tests then see `remove` called for all ids (e.g. both `queue-1` and `queue-2`) and never see `incrementRetry` for the “conflict” item, which contradicts the intended “partial batch recovery” behavior.

- **Instruction shape**: Processor maps `inst.text` for instructions; the app’s `Instruction` type uses **`instruction`**. So even if validation passed, the DTO could have wrong/undefined text. For tests, use the same shape the processor expects (e.g. support both or use `instruction` in the payload and fix the processor to use `inst.instruction || inst.text` if needed).

### Fix strategy

- **Use recipe payloads that pass validation** in all partial-batch and related tests:
  - Replace `name` with **`title`** for every recipe payload (e.g. `title: 'Recipe 1'`).
  - Ensure **`instructions`** match what the processor reads: today it uses `inst.text`; the type uses `instruction`. Either:
    - Change test payloads to use a shape that the processor actually reads (e.g. `instruction` and fix processor to `inst.instruction || inst.text`), or
    - Keep processor as-is and use `text` in test payloads if that’s what the processor expects.
- After that, the sync payload will be non-empty, `handleSyncResult` will run, and:
  - **“should remove items ONLY when operationId is in succeeded array”**: Only the item in `succeeded` should be removed; the one in `conflicts` should get `incrementRetry` only.
  - **“should keep unknown items”**: Items in neither `succeeded` nor `conflicts` should not be removed and not get `incrementRetry`.
  - **“missing succeeded array with status partial”**: Backward-compat path should not remove any; only conflict items get `handleFailedItem` (incrementRetry).
  - **“process confirmed response even on error status code”**: ApiError with `response.data` containing a valid `SyncResult` should still call `handleSyncResult`; then same remove/incrementRetry rules apply.
  - **“keep all items when no confirmation”**: When there is no valid result body, the catch path runs and should not call `remove`; it may call `incrementRetry` or `updateStatus` depending on error classification.
  - **“retry only failed items after partial failure”**: Only failed (conflict) item gets `incrementRetry`; succeeded items get `remove`.

- **Other failing tests** (e.g. “should process queue when online”, “should handle conflicts correctly”, “should increment retries for API errors”, backoff, error classification, idempotency keys): Ensure the same recipe (and list/chore) payloads use the correct fields so that:
  - `buildSyncPayload` produces a non-empty payload where intended.
  - The processor doesn’t short-circuit with “empty payload → remove all”.

**Files**
- `mobile/src/common/utils/__tests__/syncQueueProcessor.test.ts` – update all recipe payloads to use `title` (and align instruction shape with processor).
- `mobile/src/common/utils/syncQueueProcessor.ts` – optional: use `inst.instruction || inst.text` when mapping instructions so both shapes work.

---

## Summary

| Suite | Main fix | Extra |
|-------|----------|--------|
| **catalogService.spec.ts** | Mock API so custom items and (optionally) supplement are controlled; assert on “at least N” or “contains” instead of exact length where needed. | Reset memoization and avoid shared service state. |
| **useCachedEntities.test.tsx** | Mock `useAuth` to return `{ isLoading: false }` so the load effect runs. | Keep existing mocks for `readCacheArray` and `cacheEvents`. |
| **syncQueueProcessor.test.ts** | Use recipe payloads with `title` (and correct instruction shape) so validation passes and `handleSyncResult` runs; then remove/incrementRetry match expectations. | Optionally make processor accept `instruction` for instructions. |

After these changes, run:

```bash
cd mobile && npm test -- --no-cache
```

and fix any remaining assertion or mock details per test output.
