# Shopping Feature

**Feature area:** `mobile/src/features/shopping/`

## Purpose

The shopping feature is the highest-priority feature in KitchenHub.

In simple product terms, it allows users to manage their grocery lists quickly and reliably.
Users can:
- manage multiple shopping lists
- keep one list as the main day-to-day list
- add grocery items from the app’s item database
- browse by category when they are not sure what they are looking for
- remove items quickly
- track what they already picked up while shopping

This feature needs to work especially well in real-life grocery shopping situations.

---

## Why shopping is the top priority

Shopping is the most important product area because it is the most repeatedly used and the most central to day-to-day household value.

The core value of KitchenHub depends heavily on making grocery management feel:
- fast
- reliable
- low-friction
- easy to understand
- easy to use while moving through a store

If shopping feels slow, fragile, or overcomplicated, the product loses a large part of its practical value.

---

## Main product model

### Shopping lists at the top
The feature is organized around shopping lists.
At the top, users can manage their lists, including a **main list**.

Important list-level actions include:
- creating lists
- deleting lists
- switching between lists
- using the main list as the primary target for quick add flows from elsewhere in the app

### Items database and search
Users can add grocery items from the app’s item database.
Search is an important part of the experience and is still an area to improve further for speed and responsiveness.

### Category browsing
Below the list experience, the shopping flow includes categories.
These allow users to browse items by category when they are not sure what specific item they want.
Each category can surface a large number of items, so future pagination or performance improvements may become relevant.

---

## Most important user flows

The highest-value shopping flows are:

1. **easy adding to the item list / quick add**
2. **swiping to remove items**
3. **creating lists**
4. **deleting lists**

Other important flows include:
- viewing the main list
- searching for items from the grocery database
- browsing categories
- checking whether items are already in the grocery bag / already handled
- refreshing to get the latest synced state

---

## Shared behavior with other features

The shopping feature is deeply connected to other parts of the app.

### Shared with recipes
- the search bar / item search experience is shared with recipe-related flows
- recipe ingredient selection uses the same grocery item database/search concepts
- recipes can quick-add ingredients into the main shopping list
- “add all ingredients” type behavior depends on shopping being reliable

### Shared with dashboard
- dashboard quick add depends on the shopping quick-add path
- dashboard Frequently Added is related to shopping activity and shopping behavior

### Shared interaction patterns
- swipe interactions are shared with other features
- list/item manipulation patterns can affect other screens if shared components are changed

Because of this, shopping changes can easily ripple into recipes, dashboard, and other flows.

---

## UX style

Shopping should feel:
- **snappy**
- **fast**
- **easy to handle**
- **easy to understand**
- **easy to scan**
- **mobile-first**

A key usage context is being physically in the grocery store and using the app to monitor what is already in the cart/bag and what still needs to be picked up.

The shopping experience should minimize friction and reduce the amount of tapping required to complete a task.

---

## What shopping should not become

Shopping should **not** become:
- complicated
- slow
- multi-step for simple tasks
- cluttered
- tap-heavy for common actions

If a user has to perform too many taps to add, remove, or manage items, the feature is losing its purpose.

---

## Fragile / easy-to-break areas

A fresh LLM should be especially careful with the following:

### 1. Sync and persistence
One of the most fragile areas is making sure shopping changes:
- appear quickly in the UI
- persist correctly
- reflect correctly in the database
- remain correct across reloads and devices

### 2. Deletion behavior
Swipe-to-delete is fragile, especially when combined with:
- optimistic UI updates
- persistence
- syncing
- refresh/pull-to-refresh behavior
- multi-device consistency expectations

### 3. Reloading / latest-state behavior
When users pull down to reload, the app needs to reflect the latest known database state correctly.
This makes refresh behavior and state reconciliation important.

### 4. Search and item addition
Search is central and currently still not as fast as desired.
Changes here can affect:
- quick add speed
- search clarity
- cross-feature item addition flows
- recipe-related ingredient flows

### 5. Category browsing performance
Categories may load many items at once.
This can create future performance pressure and may require pagination or optimization later.

---

## Current / recent workstreams

Important recent or active themes in shopping include:
- persistence behavior
- caching behavior
- synchronization correctness
- swipe deletion stability
- making sure item state stays correct after deletion and refresh
- improving the overall reliability of the feature

These are more important right now than speculative new complexity.

---

## Future directions

A fresh LLM should know these future directions exist:

### Assistant-driven item addition
The shopping feature should eventually support assistant-based flows, where users can tell an assistant to add items rather than manually typing everything.

### Better search speed
Search is important and still a likely candidate for further speed/performance improvements.

### Category scalability improvements
If categories continue to surface very large item sets, pagination or other performance strategies may be needed.

### Better syncing and multi-device continuity
The feature needs strong persistence and syncing behavior so users trust the list state everywhere.

---

## What must be verified after changing shopping

Before finishing shopping work, verify that:

- persistence still works correctly
- syncing behavior is not broken
- deletion state stays correct after swipe/delete flows
- the UI updates quickly after changes
- pull-to-refresh or reload still reflects the latest state properly
- cross-feature flows that depend on shopping still work
  - dashboard quick add
  - recipe ingredient add
  - recipe add-all-to-shopping flows
- the feature still feels fast and low-friction on mobile

---

## Suggested reading before editing this feature

1. `AGENTS.md`
2. `docs/project/PROJECT_OVERVIEW.md`
3. `docs/project/RECENT_CHANGES.md`
4. `docs/features/recipes.md`
5. `docs/features/dashboard.md`
6. shopping source files under `mobile/src/features/shopping/`

---

## Guidance for future LLMs

When changing shopping:
- keep common actions extremely fast
- avoid adding unnecessary steps
- protect persistence and sync correctness
- remember that shopping is the highest-priority product surface
- treat search, deletion, reload, and quick-add behavior as high-risk areas
