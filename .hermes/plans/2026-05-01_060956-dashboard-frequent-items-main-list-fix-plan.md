# Dashboard Frequently Added Main-List Fix Plan

> Recovery / implementation plan for continuing this work in a fresh LLM session.

## Metadata
- **Date:** 2026-05-01
- **Area:** mobile
- **Status:** proposed
- **Primary files:** `mobile/src/features/dashboard/screens/DashboardScreen.tsx`, `mobile/src/common/repositories/cacheAwareShoppingRepository.ts`, `mobile/src/features/dashboard/screens/__tests__/DashboardScreen.test.tsx`
- **Related docs:** `docs/features/dashboard.md`, `docs/features/shopping.md`, `.hermes/plans/2026-04-28_0502-home-tab-frequent-items-recovery-plan.md`

---

## Goal

- Make dashboard **Frequently Added** taps add directly to the household main list.
- Match the existing “quick add to main list” behavior already used elsewhere in the app.
- Fix the bug at the right layer so signed-in shopping cache state still stays correct.

---

## Why this work exists

On the dashboard, tapping a **Frequently Added** item currently routes into `handleQuickAddGroceryItem`, but that path depends on `mainList` state loaded into `DashboardScreen`.

The screen already fetches backend `frequentlyAddedItems`, but for signed-in users it loads `mainList` from `CacheAwareShoppingRepository.findAllLists()`. During inspection, the likely root cause is that the cache-aware repository maps shopping-list summaries with `isMain: false` instead of preserving the backend value. That means dashboard state can think there is **no main list** even though every household actually has one.

This explains the observed behavior:
- Frequent items are visible.
- Tapping them shows the “no main list” toast / no-list-attached behavior.
- Quick-add search-result flow may still work because `handleSelectGroceryItem` fetches fresh data via `shoppingService.getShoppingData()` and derives the main list from the service response instead of the cache-aware repository snapshot.

---

## Decisions already made

- Add dashboard frequent items to the **main list automatically**.
- Do **not** add a list picker or extra UI step for this fix.
- Keep using the shared quick-add path for frequent-item taps.
- Prefer a **small, targeted root-cause fix** over a dashboard-only workaround.
- Do not change the broader dashboard layout or frequent-items product direction.

---

## Current recovered state

### Already implemented
- `DashboardScreen` renders `FrequentlyAddedSection` and wires taps to `handleQuickAddGroceryItem`.
- `handleQuickAddGroceryItem` already uses `quickAddItem(...)` and routes signed-in writes through `CacheAwareShoppingRepository` so Shopping tab state stays in sync.
- Dashboard no-main-list fallback already exists and opens the shopping modal.
- `RemoteShoppingService` preserves backend `isMain` when mapping shopping lists.

### Still missing / uncertain
- `CacheAwareShoppingRepository` shopping-list summary mapping appears to drop `isMain` entirely.
- There is no regression test proving the dashboard can still quick-add frequent items when the signed-in screen state comes from the cache-aware repository path.
- There may also be a broader latent issue where cache-backed list ordering / main-list semantics are degraded outside the dashboard, even if not user-visible yet.

---

## Files to read first

- `AGENTS.md`
- `.hermes/PROJECT_CONTEXT.md`
- `docs/features/dashboard.md`
- `docs/features/shopping.md`
- `.hermes/plans/2026-04-28_0502-home-tab-frequent-items-recovery-plan.md`
- `mobile/src/features/dashboard/screens/DashboardScreen.tsx`
- `mobile/src/common/repositories/cacheAwareShoppingRepository.ts`
- `mobile/src/features/shopping/utils/selectionUtils.ts`
- `mobile/src/features/shopping/services/RemoteShoppingService.ts`

---

## Important code paths

### UI / screen layer
- `mobile/src/features/dashboard/screens/DashboardScreen.tsx`
  - `loadShoppingCacheState()` sets `mainList` from repository-backed list data.
  - `handleQuickAddGroceryItem()` blocks on `!mainList` before calling `quickAddItem(...)`.
  - `handleSelectGroceryItem()` separately fetches fresh shopping data and derives `mainList` from service results.

### State / hooks / services
- `mobile/src/features/shopping/utils/selectionUtils.ts`
  - `getMainList()` depends entirely on `list.isMain` being correct.
- `mobile/src/common/repositories/cacheAwareShoppingRepository.ts`
  - `ShoppingListSummaryDto` currently omits `isMain`.
  - `mapShoppingListSummary(...)` currently hardcodes `isMain: false`.
- `mobile/src/features/shopping/services/RemoteShoppingService.ts`
  - Already preserves `isMain`, which is a good reference implementation.

### Tests
- `mobile/src/features/dashboard/screens/__tests__/DashboardScreen.test.tsx`
  - Already covers frequent-item taps using a mocked repository, but not the broken repository-mapping scenario.
- A new repository test file may be warranted if there is not already coverage for `findAllLists()` mapping behavior.

---

## Constraints and guardrails

- Keep the fix targeted; do not redesign dashboard flows.
- Preserve signed-in cache/repository writes for dashboard quick add.
- Preserve existing toast/modal fallback when a household genuinely has no main list.
- Preserve guest vs signed-in behavior boundaries.
- Preserve RTL and current dashboard UX.
- Avoid introducing a dashboard-only workaround if the root cause is repository mapping.

---

## Step-by-step implementation plan

### Step 1 — Add focused regression coverage first
- Extend `mobile/src/features/dashboard/screens/__tests__/DashboardScreen.test.tsx` with a case that models the real bug shape:
  - service data contains a main list and frequent items,
  - repository-backed list state lacks `isMain`,
  - tapping a frequent item should still end up creating/updating an item in the main list once the root fix is applied.
- Add a repository-level regression test if needed to verify `findAllLists()` preserves `isMain` from `/shopping-lists` responses.

### Step 2 — Fix the root cause in the cache-aware repository
- Update `ShoppingListSummaryDto` in `mobile/src/common/repositories/cacheAwareShoppingRepository.ts` to include backend fields that already exist on the remote service side, especially `isMain` (and likely `icon` for consistency).
- Update `mapShoppingListSummary(...)` to map `isMain: list.isMain ?? false` instead of hardcoding `false`.
- Keep the mapping aligned with `RemoteShoppingService` to avoid split behavior between service and repository code paths.

### Step 3 — Re-check whether DashboardScreen needs any defensive fallback
- After the repository fix, re-evaluate whether `DashboardScreen` should keep relying on repository-derived `mainList` only.
- Default approach: no extra screen workaround if tests show the root fix fully restores the expected behavior.
- Only add a tiny defensive fallback if inspection/testing reveals a remaining race between repository cache load and service load.

### Step 4 — Verify the quick-add path end to end
- Confirm that frequent-item taps still use:
  - `handleQuickAddGroceryItem()`
  - `quickAddItem(...)`
  - repository writes for signed-in mode
- Confirm that the behavior increments quantity when the item already exists in the main list.

### Step 5 — Run targeted validation
- Run the focused dashboard test file.
- Run the targeted repository/shopping-service tests touched by the fix.
- Run `npx tsc --noEmit` in `mobile/` if implementation is approved and completed.

---

## Validation commands

### Mobile targeted
```bash
cd /home/claw/.hermes/hermes-agent/projects/KithchenHub/mobile
npm test -- src/features/dashboard/screens/__tests__/DashboardScreen.test.tsx --runInBand
npm test -- src/common/repositories/__tests__/<relevant-test-file>.test.ts --runInBand
npx tsc --noEmit
```

If the repository regression is added into an existing test file, replace `<relevant-test-file>` with the actual file name.

---

## Verification checklist

- [ ] Tapping a dashboard frequent item adds it to the main list automatically
- [ ] Signed-in dashboard quick add still writes through the shared shopping repository path
- [ ] The “no main list” fallback appears only when there truly is no main list
- [ ] Existing frequent-item behavior is not regressed
- [ ] Relevant mobile tests pass
- [ ] TypeScript check passes

---

## Handoff prompt for another LLM

```text
Work in /home/claw/.hermes/hermes-agent/projects/KithchenHub.
Read AGENTS.md, then .hermes/PROJECT_CONTEXT.md, then this plan file, then docs/features/dashboard.md and docs/features/shopping.md before making changes.
Focus on the dashboard frequent-items quick-add bug where signed-in users see a no-main-list error even though the household has a main list.
Verify the cache-aware repository list mapping before changing DashboardScreen.
```

---

## Final notes

Most likely root cause discovered during inspection:
- `RemoteShoppingService` maps `isMain` correctly.
- `CacheAwareShoppingRepository` appears to drop `isMain` by hardcoding `false` in `mapShoppingListSummary(...)`.
- `DashboardScreen` depends on repository-derived `mainList` for frequent-item taps.

So the best approach is probably to fix the repository mapping first, then verify the dashboard behavior with regression tests rather than patching around it only in the screen.