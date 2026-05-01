# KitchenHub Household Frequently Added Backend Implementation Plan

> Recovery / implementation plan for continuing this work in a fresh LLM session.
>
> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

## Metadata
- **Date:** 2026-04-28
- **Area:** backend
- **Status:** proposed
- **Primary files:** `backend/src/infrastructure/database/prisma/schema.prisma`, `backend/src/modules/shopping/services/shopping.service.ts`, `backend/src/modules/shopping/repositories/shopping.repository.ts`, `backend/src/modules/shopping/controllers/shopping.controller.ts`, `backend/src/modules/shopping/dtos/*`
- **Related docs:** `AGENTS.md`, `docs/project/PROJECT_OVERVIEW.md`, `docs/project/RECENT_CHANGES.md`, `docs/features/dashboard.md`, `docs/features/shopping.md`, `.hermes/plans/2026-04-28_0502-home-tab-frequent-items-recovery-plan.md`

---

## Goal
- Add real backend support for **household-level Frequently Added items** used by the dashboard.
- Replace the current dashboard-only derived ranking with a backend-backed top-items API that returns display-ready grocery items.
- Keep the implementation small, stable, and fast enough for production stabilization, while leaving room for a future cache layer.

---

## Why this work exists
The dashboard UI for Frequently Added already exists, but the current data is derived client-side from loaded shopping items. That is a temporary bridge and not the intended long-term source of truth.

The next step is to make Frequently Added a real backend capability based on **household behavior**, not per-user behavior and not generic catalog pseudo-personalization.

This matters because:
- the dashboard should stay fast and low-friction
- the ranking should reflect actual household add behavior
- shopping is the highest-priority feature, so the source of truth should live close to shopping behavior
- the current placeholder and UI are already ready to consume real backend data

---

## Decisions already made
- Frequently Added is **per household**, not per user.
- All relevant add sources count:
  - dashboard quick add
  - shopping tab adds
  - recipe ingredient adds
  - recipe add-all flows
  - custom/free-text item adds
- Scoring rules for v1:
  - **Add action:** +1 base point
  - **Quantity bonus:** +1 additional point only when the added quantity is greater than 1
  - **Manual quantity increase edit:** +1 point only
- Recency does **not** matter in v1.
- Checked/completed state does **not** matter.
- Deletion does **not** reduce frequency.
- Cold-start households should keep the existing empty placeholder UI.
- The mobile client should receive **display-ready items** with `id`, `name`, `image`, and `category`.
- The shopping backend should own the capability.
- **Do not** fake personalization with generic catalog frequency data.
- **Do not** store lifetime household frequency directly on `shopping_items` rows; those rows are list-scoped and soft-deletable current-state records, not durable household preference records.

---

## Current recovered state

### Already implemented
- Dashboard UI has a dedicated `FrequentlyAddedSection` under Quick Add.
- Dashboard currently derives ranked items client-side via `buildDashboardFrequentItems(allItems, limit)`.
- Tapping a frequent item already reuses the same quick-add path as normal shopping quick add.
- Empty-state placeholder UI is already intentional and tested.
- Backend schema already provides durable identity anchors for ranking:
  - catalog-backed items via `shopping_items.catalog_item_id`
  - household custom items via `shopping_items.custom_item_id` -> `custom_items.id`
- `custom_items` are household-scoped and durable, which aligns with the household-based product decision.

### Still missing / uncertain
- No backend table or aggregate currently exists for household frequent-item ranking.
- No API endpoint currently exists to fetch household frequent items.
- No update hooks currently exist in shopping add/update paths to maintain household ranking counters.
- The exact mobile integration step is not yet implemented; the dashboard still reads derived local data.
- Future cache strategy is desired but should remain phase-two unless the base query proves too slow.

---

## Files to read first
- `AGENTS.md`
- `docs/project/PROJECT_OVERVIEW.md`
- `docs/project/RECENT_CHANGES.md`
- `docs/features/dashboard.md`
- `docs/features/shopping.md`
- `.hermes/plans/2026-04-28_0502-home-tab-frequent-items-recovery-plan.md`
- `backend/src/infrastructure/database/prisma/schema.prisma`
- `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `backend/src/modules/shopping/services/shopping.service.ts`
- `backend/src/modules/shopping/repositories/shopping.repository.ts`
- `mobile/src/features/dashboard/screens/DashboardScreen.tsx`
- `mobile/src/features/dashboard/utils/dashboardFrequentItems.ts`

---

## Important code paths

### UI / screen layer
- `mobile/src/features/dashboard/screens/DashboardScreen.tsx`
  - currently computes `dashboardFrequentItems` from `allItems`
  - should eventually switch to backend-backed fetch results
- `mobile/src/features/dashboard/components/FrequentlyAddedSection/FrequentlyAddedSection.tsx`
  - already renders populated and empty placeholder states
- `mobile/src/features/dashboard/utils/dashboardFrequentItems.ts`
  - current temporary ranking helper that should become fallback-only or be removed from primary path

### State / mobile services
- `mobile/src/features/shopping/services/shoppingService.ts`
  - likely integration point for new backend fetch method
- any dashboard data-loading hook/service added later for fetching backend frequent items

### Backend / API layer
- `backend/src/infrastructure/database/prisma/schema.prisma`
  - add the new household frequent-items aggregate model
- `backend/src/modules/shopping/controllers/shopping.controller.ts`
  - add shopping-owned endpoint for fetching frequent items
- `backend/src/modules/shopping/services/shopping.service.ts`
  - maintain aggregate counters on add/update flows
  - expose frequent-items query service method
- `backend/src/modules/shopping/repositories/shopping.repository.ts`
  - add repository methods for upsert/increment/query logic
- `backend/src/modules/shopping/dtos/`
  - add request/response DTOs for frequent-items endpoint if needed

---

## Recommended data model

### New table: `household_item_frequency`
Create a lightweight aggregate table rather than a full event log.

Suggested columns:
- `id` — primary key
- `household_id` — required FK to `households`
- `catalog_item_id` — nullable FK to `master_grocery_catalog`
- `custom_item_id` — nullable FK to `custom_items`
- `name` — denormalized display name snapshot
- `category` — denormalized display category snapshot
- `image` — denormalized display image snapshot
- `add_event_count` — integer, default 0
- `quantity_bonus_count` — integer, default 0
- `manual_quantity_increase_count` — integer, default 0
- `created_at`
- `updated_at`

Suggested constraints/indexes:
- FK: `household_id -> households.id` with cascade delete
- FK: `catalog_item_id -> master_grocery_catalog.id` with set null or restrict based on existing pattern
- FK: `custom_item_id -> custom_items.id` with set null or restrict based on existing pattern
- check or application-level rule that **at least one** of `catalog_item_id` or `custom_item_id` is present
- unique key for catalog-backed identity: `(household_id, catalog_item_id)` when `catalog_item_id` is not null
- unique key for custom identity: `(household_id, custom_item_id)` when `custom_item_id` is not null
- index for fast ranking query on household and score inputs, e.g. `(household_id, add_event_count, quantity_bonus_count, manual_quantity_increase_count)`

### Why not extend `shopping_items`
Do not store lifetime household frequency on `shopping_items` because those rows:
- belong to a specific list
- are soft-deletable
- represent current list state rather than durable household item preference
- would fragment ranking history across deleted/recreated rows and multiple lists

---

## Recommended API contract

### Endpoint
Add a shopping-owned authenticated endpoint:
- `GET /v1/shopping-items/frequent`

This keeps the capability shopping-owned and item-oriented without inventing a separate dashboard backend module.

### Response shape
Return a display-ready top-N list:

```ts
interface FrequentShoppingItemDto {
  id: string;
  name: string;
  category?: string;
  image?: string;
  sourceType: 'catalog' | 'custom';
}
```

Optional metadata if useful for debugging/future use:
- `score`
- `addEventCount`
- `quantityBonusCount`
- `manualQuantityIncreaseCount`

For dashboard use, keep the default response minimal and focused on rendering.

### Query params
Optional:
- `limit` with default 10 and max guardrail 20
- `lang` only if catalog localization needs to affect names in the response

---

## Frequency update rules

### Add-item flows
When a shopping add action succeeds:
- resolve household identity from the list
- resolve item identity by preference order:
  1. `catalogItemId` when present
  2. `customItemId` when present
- upsert the aggregate row
- increment:
  - `add_event_count += 1`
  - `quantity_bonus_count += 1` only if **added quantity > 1**
- refresh denormalized display fields (`name`, `category`, `image`) from the latest persisted item values

### Manual quantity increase edits
When `PATCH /shopping-items/:id` increases quantity relative to previous quantity:
- increment `manual_quantity_increase_count += 1`
- do **not** also increment `quantity_bonus_count`
- do nothing for unchanged or reduced quantity

### Ignored operations in v1
- checking/unchecking items
- deleting items
- decreasing quantity
- time decay / recency rebalance

### Important implementation rule
Only increment ranking after the underlying shopping write succeeds. Do not allow failed writes to mutate ranking counters.

---

## Proposed implementation phases

### Phase 1 — Schema and repository foundation
Objective: add a minimal durable aggregate table and DB access methods.

Likely files:
- Modify: `backend/src/infrastructure/database/prisma/schema.prisma`
- Create: new Prisma migration under `backend/src/infrastructure/database/prisma/migrations/.../migration.sql`
- Modify: `backend/src/modules/shopping/repositories/shopping.repository.ts`
- Possibly modify DTO exports if needed

Tasks:
1. Add `HouseholdFrequentItem` Prisma model.
2. Add indexes/uniques/FKs.
3. Generate migration.
4. Add repository methods:
   - `upsertFrequentItemForAdd(...)`
   - `incrementFrequentItemForManualQuantityIncrease(...)`
   - `findTopFrequentItemsByHousehold(householdId, limit)`
5. Keep repository methods small and deterministic.

### Phase 2 — Service-layer write-path integration
Objective: update counters from the real shopping write paths.

Likely files:
- Modify: `backend/src/modules/shopping/services/shopping.service.ts`
- Possibly modify create/update helpers around:
  - `addItems(...)`
  - `createItemFromInput(...)`
  - `updateItem(...)`

Tasks:
1. Identify all successful add-item entry points.
2. Centralize frequent-item updates in a helper to avoid duplicated scoring logic.
3. After add success, call repository aggregate update.
4. In `updateItem(...)`, compare previous and next quantity.
5. If quantity increased, apply the manual edit increment rule.
6. Ensure checked-state-only updates do not change ranking.

### Phase 3 — Frequent-items read endpoint
Objective: expose household frequent items to the app.

Likely files:
- Modify: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- Modify/Create: DTO file under `backend/src/modules/shopping/dtos/`
- Modify: `backend/src/modules/shopping/services/shopping.service.ts`

Tasks:
1. Add authenticated endpoint for current household.
2. Add service method to fetch top frequent items.
3. Normalize response to dashboard-friendly item shape.
4. Guard missing household membership with the same existing error pattern.
5. Add sensible limit default/max.

### Phase 4 — Tests first, then implementation hardening
Objective: lock behavior with focused backend tests.

Likely files:
- Modify/Create: `backend/src/modules/shopping/services/shopping.service.spec.ts`
- Modify/Create: `backend/src/modules/shopping/controllers/shopping.controller.spec.ts`
- Possibly add repository tests if this codebase has a pattern for DB/repository unit coverage

Required test cases:
1. add action with quantity 1 increments only base count
2. add action with quantity > 1 increments base + quantity bonus
3. manual quantity increase increments manual counter only
4. quantity decrease does not increment counters
5. checked-state patch does not increment counters
6. custom-item adds are ranked correctly
7. top-items query returns highest-score household items only
8. data is isolated by household
9. empty household returns empty array for UI placeholder handling

### Phase 5 — Mobile integration handoff
Objective: define the follow-up needed to switch dashboard from temporary local ranking to backend ranking.

Likely files:
- Modify later: `mobile/src/features/shopping/services/shoppingService.ts`
- Modify later: `mobile/src/features/dashboard/screens/DashboardScreen.tsx`
- Modify later: mobile tests around dashboard loading and placeholder behavior

Tasks:
1. Add mobile service method to fetch backend frequent items.
2. Replace primary use of `buildDashboardFrequentItems(...)` with backend data.
3. Preserve placeholder when backend returns empty array.
4. Keep current local helper only as a temporary fallback if rollout requires staged release.

---

## Cache-layer follow-up (not required for v1)
The plan should include future caching, but not require it for the first backend release.

## Backfill decision for v1
- Start **without backfill**.
- Existing households will begin accumulating household frequency from rollout forward.
- This is intentional because current `shopping_items` rows represent current state, not a trustworthy historical add-event ledger.
- The existing dashboard placeholder already makes empty-state rollout acceptable.

### Recommended follow-up
- Keep the DB as source of truth.
- Add a cache key per household, e.g. `shopping:frequent-items:${householdId}:${limit}`.
- Invalidate or refresh cache after successful aggregate updates.
- Only add this after measuring if direct DB reads are a bottleneck.

### Why defer cache initially
- v1 ranking query is simple: household filter + top-N sort
- adding cache now increases write-path and invalidation complexity
- production stabilization favors the smaller reliable version first

---

## Constraints and guardrails
- Keep the solution **household-based**, not user-based.
- Keep shopping as the ownership boundary; do not invent a new dashboard backend subsystem unless clearly necessary.
- Keep changes targeted and reusable; avoid broad refactors.
- Preserve soft-delete behavior and existing authorization checks.
- Follow existing backend patterns:
  - Nest exceptions
  - Prisma-managed timestamps
  - `ACTIVE_RECORDS_FILTER` where applicable
- Do not fake frequency with generic catalog data.
- Do not let list-row lifecycle determine historical household preference.
- Keep the endpoint fast and payload small because dashboard is a quick utility surface.

---

## Step-by-step implementation plan

### Step 1 — Inspect current shopping write paths
- Read `addItems(...)`, `createItemFromInput(...)`, and `updateItem(...)` carefully.
- Confirm all add sources ultimately flow through the same backend write methods.
- Identify whether any recipe add-all or dashboard quick-add path bypasses standard shopping item creation.

### Step 2 — Write failing backend tests
- Add focused tests for the scoring rules and household isolation.
- Start with service-layer tests because the core behavior is business logic.

### Step 3 — Add schema support
- Add `HouseholdFrequentItem` to Prisma schema.
- Generate/apply migration.
- Add repository helpers for upsert/increment/query.

### Step 4 — Implement service-layer updates
- Hook aggregate updates into successful shopping add flows.
- Hook manual quantity-increase scoring into `updateItem(...)`.
- Ensure non-relevant updates do not change ranking.

### Step 5 — Add read endpoint
- Add authenticated shopping endpoint for top frequent items.
- Return display-ready data only.
- Add default limit 10.

### Step 6 — Verify backend behavior
- Run unit tests for service/controller coverage.
- Run typecheck/build/lint.

### Step 7 — Handoff for mobile integration
- Document the exact response contract.
- Note the dashboard files that should switch from temporary local ranking to backend ranking.

---

## Validation commands

### Backend targeted
```bash
cd /home/claw/.hermes/hermes-agent/projects/KithchenHub/backend
npm run test:unit -- src/modules/shopping/services/shopping.service.spec.ts
npm run test:unit -- src/modules/shopping/controllers/shopping.controller.spec.ts
npm run typecheck
npm run build
npm run lint
```

### Broader backend pass if needed
```bash
cd /home/claw/.hermes/hermes-agent/projects/KithchenHub/backend
npm run test:unit
```

---

## Verification checklist
- [ ] Household frequency is stored independently of current shopping-list rows
- [ ] Catalog and custom items both work
- [ ] Add event scoring matches product decisions
- [ ] Manual quantity-increase scoring matches product decisions
- [ ] Decrease/check/delete operations do not corrupt ranking
- [ ] Top-N query is household-isolated and returns display-ready data
- [ ] Empty households return empty array so the UI placeholder remains valid
- [ ] Relevant backend tests pass
- [ ] Mobile handoff is documented
- [ ] Cache follow-up is documented but not required for v1

---

## Handoff prompt for another LLM

```text
Work in /home/claw/.hermes/hermes-agent/projects/KithchenHub.
Read AGENTS.md, docs/project/PROJECT_OVERVIEW.md, docs/project/RECENT_CHANGES.md, docs/features/dashboard.md, docs/features/shopping.md, and .hermes/plans/2026-04-28_161929-household-frequently-added-backend-plan.md before making changes.
The goal is to implement backend support for household-level Frequently Added items in the shopping module. Use a lightweight aggregate table keyed by household + durable item identity (catalog item or custom item), not shopping_items row-level counters. Follow the v1 scoring rules in the plan exactly, add targeted backend tests first, then implement the read endpoint and write-path updates.
```

---

## Final notes
- Repo-schema inspection was enough to choose the architecture; live Supabase inspection was not required to draft this plan.
- The main architectural insight is that `shopping_items` represent current list state, while household frequency needs a durable identity layer that survives row deletion/recreation.
- The most likely future optimization is caching the top frequent-items response per household, not redesigning the data model.
