# 2026-05-11 — Mobile cache/snappiness investigation plan

## Goal
Make KitchenHub feel native-fast by making mobile screens cache-first, reducing startup work, and avoiding unnecessary backend reads during normal interaction.

## Current product direction
- Premium foundation / RevenueCat connection work is on hold for now.
- Production stabilization is the top priority.
- User specifically reports first app open takes multiple seconds and remote/backend operations feel very slow.
- Desired behavior: cache aggressively on-device; use backend refresh only for explicit reload / pull-to-refresh / real invalidation rather than blocking normal screen usage.

## Recent baseline already on `main`
Latest relevant commits:
- `471b9d7` — enlarged FullHouse app icon artwork
- `b05bfdd` — initial FullHouse app icon asset replacement
- `a94a944` / PR #191 — shopping/recipe cache snappiness follow-up
- `f72a5b4` / PR #190 — recipe add-all catalog identity follow-up
- `c9279a0` / PR #189 — catalog sync/snappy flows/tab startup stabilization

Known improvements already shipped:
- recipe add/add-all preserves catalog identity, category, image more consistently
- shopping local/mock item IDs use UUIDs rather than timestamp collisions
- shopping screen reacts to optimistic cache events
- shopping list first render no longer blocks on display-name translation
- signed-in recipe warm cache avoids automatic refresh
- full cached recipe detail is trusted instead of refetching solely due to catalog-linked ingredients
- tabs were previously optimized to avoid eager mounting all hidden tabs on startup

## Investigation targets
Follow `systematic-debugging` before changing code: inspect and isolate root causes first.

### 1. Startup path
Inspect:
- `mobile/App.tsx`
- `mobile/src/navigation/RootNavigator.tsx`
- `mobile/src/navigation/MainTabsScreen.tsx`
- auth/bootstrap providers
- app asset/font/image preload behavior
- legal gate / onboarding gate / household bootstrap

Questions:
- Which providers run network calls before first useful render?
- Are all feature repositories/services initialized at startup?
- Are hidden tabs truly lazy-mounted after latest `main`?
- Are images/assets preloaded synchronously or rendered via remote URLs without device cache?

### 2. Device cache layer
Inspect:
- cache storage service(s) under `mobile/src/common/`
- repository cache TTL/staleness rules
- signed-in vs guest behavior
- cache event propagation
- app cold-start hydration order

Questions:
- What is cached locally today?
- What still requires DB/API before rendering?
- Do repositories return cache immediately and refresh in background, or await network?
- Are cache keys household/language/user scoped correctly?

### 3. Remote query slowness
Inspect:
- mobile API client/interceptors
- repository/service methods for shopping, recipes, chores, catalog, auth/bootstrap
- backend endpoints used at startup and tab open

Questions:
- Are there N+1 API calls on startup or tab open?
- Is catalog/display-name/image metadata fetched repeatedly?
- Are list/item endpoints split in a way that causes multiple sequential requests?
- Are refreshes happening on focus even when cache is warm?

### 4. High-frequency edit flows
Inspect shopping edit/toggle/add flows first because shopping is product priority #1.

Questions:
- Do toggles/quantity edits update UI before API returns?
- Does rollback work if API fails?
- Are optimistic updates pushed into device cache and screen-local state immediately?
- Are repeated edits debounced/batched or causing one backend write per tap?

## Likely first implementation themes after inspection
Do not implement before confirming root causes, but likely directions include:
- cache-first app bootstrap that renders last known household/shopping/recipe/chore state before network refresh
- explicit pull-to-refresh / background refresh policy instead of focus-triggered blocking refreshes
- persistent catalog/display-name/image cache keyed by catalog item + locale
- optimistic write-through for all frequent shopping edits, with rollback on failure
- request batching or endpoint consolidation where mobile currently makes sequential DB/API calls
- lazy/deferred loading for non-active feature data after first paint

## Validation strategy
Add targeted regression tests for each confirmed issue before fixing.
Potential test locations:
- `mobile/src/navigation/__tests__/MainTabsScreen.test.tsx`
- `mobile/src/common/repositories/**/__tests__`
- `mobile/src/features/shopping/screens/__tests__`
- `mobile/src/features/shopping/hooks/__tests__`
- `mobile/src/features/recipes/hooks/useRecipes.spec.ts`
- `mobile/src/features/chores/**/__tests__`

Manual validation:
- cold app open reaches useful UI quickly with cached data
- opening shopping/recipes/chores does not block on backend when cache is warm
- pull-to-refresh still fetches latest backend data
- offline/slow-network mode still shows cached data and supports optimistic local interactions where safe

## Guardrails
- Do not resume premium/RevenueCat work until user asks.
- Do not stage unrelated `.hermes/mockups/` folders.
- Do not change app identifiers, OTA runtime policy, or EAS channels.
- Keep changes small and sequential; one performance root cause per PR/task.
