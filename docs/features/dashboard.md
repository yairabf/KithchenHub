# Dashboard Feature

**Feature area:** `mobile/src/features/dashboard/`

**Current source map**: see [`mobile-ui-map.md`](./mobile-ui-map.md). Current dashboard source includes `DashboardScreen`, `QuickAddCard`, `FrequentlyAddedSection`, `ImportantChoresCard`, `QuickStats` components, `useDashboardChores`, and frequent-item utility logic.

## Purpose

The dashboard is a **lightweight utility surface** for KitchenHub.
It is not the center of the product and it is not meant to be a full home-management control center.

Its job is mainly to provide:
- **quick adding to the main shopping list**
- **frequently added items** for fast repeat additions
- **important chores visibility** so users can quickly see what must be done today

The dashboard should act like a convenient lens into the most time-sensitive household actions, especially in a kitchen setting.

---

## Product intent

A key use case for the dashboard is a **shared tablet in the kitchen** or attached near the fridge.
In that environment, the dashboard should make it very easy to:
- add shopping items quickly
- use frequently added items to reduce friction
- eventually interact through assistant/voice-driven flows
- glance at important chores that need attention today

This is the one area of KitchenHub that is more **tablet-friendly by intent**, even though the rest of the product overall still needs strong mobile support.

---

## What the dashboard should do

Right now, the dashboard is supposed to:

1. provide a fast **Quick Add** path into the main shopping list
2. expose **Frequently Added** items as a fast-add surface
3. show **Important Chores** in a simple, high-visibility way
4. stay easy to understand at a glance
5. feel smooth, light, and low-friction

### Current key elements
- **Quick Add** to the main shopping list
- **Frequently Added** section
  - signed-in users load frequent items through the shopping service and cache the last non-empty result with `frequentItemsCache`
  - guest/mock mode uses the shopping service's local data path
- **Important Chores** section

Among these, the highest-value parts are:
1. Quick Add
2. Frequently Added
3. Important Chores

---

## What the dashboard should not do

The dashboard is **not** supposed to:
- be the main product experience
- become a cluttered home page full of stats and secondary information
- act like a smart-home control center
- focus on household-member overview or unrelated summary widgets
- overshadow the core feature areas of shopping, recipes, and chores

It should remain a practical launch/utility surface, not a complex destination.

---

## Priority relative to other features

The dashboard is the **least important** of the four main product areas.

Priority order:
1. **Shopping**
2. **Recipes**
3. **Chores**
4. **Dashboard / Home**

This means dashboard work should usually support the core shopping/recipe/chore flows rather than compete with them.

---

## Recent direction changes

The dashboard recently became simpler and more focused.

### What was removed / downgraded
These older dashboard ideas are no longer important for the homepage:
- showing how many shopping lists you have
- showing how many recipes you have
- list/recipe count summary cards or similar stats-heavy widgets

### What became more important
- Quick Add
- Frequently Added items
- Important Chores

The dashboard moved away from summary/stat widgets and toward **fast action + useful visibility**.

---

## UX style

The dashboard should feel:
- **quick**
- **lightweight**
- **very easy to understand**
- **tablet-friendly**
- **low-friction**
- **utility-focused**

It should not feel:
- cluttered
- overloaded
- stats-heavy
- confusing
- slow

This is the one feature area where the UI should strongly support the **shared kitchen-tablet** use case.

---

## Important behavior and UX rules

### Quick Add is the most important dashboard action
Quick Add should feel immediate and reliable.
This is one of the main reasons the dashboard exists.

### Frequently Added should reduce friction
Frequently Added is meant to make repeat additions extremely easy.
It should feel like a natural shortcut, not decorative content.

### Important Chores should be glanceable
Important Chores are included so users can instantly see whether something important must be done today.
This should stay simple and obvious.

### Frequently Added should use the current service/cache path
For signed-in users, `DashboardScreen` reads cached frequent items first, then requests `shoppingService.getFrequentItems(DASHBOARD_FREQUENT_ITEMS_LIMIT)` and writes non-empty results back through `writeCachedFrequentItems()`.
For guest/mock data, it reads frequent items from the local shopping service data path.

The UI still has an empty state, but the current source is no longer just a placeholder-only surface.

---

## Fragile / easy-to-break areas

A fresh LLM should be careful with:
- Quick Add behavior
- Frequently Added item behavior and ranking/display logic
- responsiveness and layout balance
- modal opening flows
- animation smoothness
- state persistence / continuity
- overall dashboard simplicity

Because the dashboard is intended to feel effortless, small regressions in:
- smoothness
- responsiveness
- interaction speed
- visual clarity

can significantly reduce its value.

---

## Current source-backed behavior

### Shopping data and quick add

- `DashboardScreen` creates a shopping service with `createShoppingService(userMode)`.
- Signed-in mode wraps the service with `CacheAwareShoppingRepository`; guest/mock mode uses the service directly.
- Quick Add targets the main shopping list. If no main list is available, the screen shows a toast and opens the shopping modal.
- Rapid duplicate taps are guarded by `pendingQuickAddKeys` so repeated taps do not race past the deduplication check.
- Optimistic updates are reverted on failure through `executeWithOptimisticUpdate()`.

### Frequently Added

- Limit: `DASHBOARD_FREQUENT_ITEMS_LIMIT = 8`.
- Signed-in path:
  - read cached frequent items with `readCachedFrequentItems()`
  - request service frequent items and main list in parallel
  - write non-empty service results through `writeCachedFrequentItems()`
- UI component: `mobile/src/features/dashboard/components/FrequentlyAddedSection/FrequentlyAddedSection.tsx`.
- Tile behavior: pressing a tile vibrates briefly, runs a scale/overlay feedback animation, then calls the same quick-add handler as search selection.

### Important Chores

- Hook: `mobile/src/features/dashboard/hooks/useDashboardChores.ts`.
- Component: `mobile/src/features/dashboard/components/ImportantChoresCard/ImportantChoresCard.tsx`.
- Supports toggling chores and navigation to the Chores tab.

---

## Suggested reading before editing this feature

1. `AGENTS.md`
2. `docs/project/PROJECT_OVERVIEW.md`
3. `docs/project/RECENT_CHANGES.md`
4. `.hermes/plans/2026-04-28_0502-home-tab-frequent-items-recovery-plan.md`
5. dashboard source files under `mobile/src/features/dashboard/`

---

## Guidance for future LLMs

When changing the dashboard:
- keep it simple
- prioritize Quick Add and Frequently Added
- do not reintroduce unnecessary stats or home-page clutter
- remember that this is a **tablet-friendly utility surface**
- verify that the experience still feels fast, smooth, and easy to understand
