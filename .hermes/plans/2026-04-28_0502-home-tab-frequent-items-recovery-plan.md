# KitchenHub Home Tab Frequent Items Recovery Plan

> Recovery document created so another LLM or a fresh session can resume the work without prior chat context.

## What this plan is for

Refactor the KitchenHub mobile dashboard/home tab so it becomes more action-oriented and aligned with the current app style:

1. Keep **Quick Add** at the top.
2. Remove the old **Suggested Items** surface from Quick Add.
3. Remove the **quick stats row** (`Saved Recipes`, `Shopping Lists`).
4. Add a dedicated dashboard-native **Frequently Added** section directly under Quick Add.
5. Keep **Important Chores** below that.
6. Make frequent-item taps use the same quick-add path as normal grocery quick add.
7. If there is no main shopping list, tapping quick add / frequent items should show the normal toast and open the shopping modal.
8. Use a visible in-UI placeholder for the frequent-items area when backend/personalized frequency support is not ready yet.

This follows Yair’s preference for **visible placeholders for backend-dependent UI instead of hiding the section entirely**.

---

## Recovered requirements and decisions

### Product / UX decisions

- The home tab should feel like a lightweight command center, not a metrics dashboard.
- The old **Suggested Items** UI should be removed from the home tab.
- The old dashboard **quick stats** row should be removed.
- The new **Frequently Added** section should live at the dashboard level, not inside the Quick Add card.
- The dashboard should **not** use catalog pseudo-frequency data and label it as personalized frequency.
- Frequent-item recommendations should come from **shopping activity** (`allItems`) or future real ranking data.
- Until backend/user-history support is fully trustworthy, the UI should still reserve the space and show a clear placeholder state.
- The redesign should remain visually consistent with the current KitchenHub style system.
- RTL support is required.

### Data-source rule

**Do not use `useCatalog().frequentlyAddedItems` as real dashboard frequency data.**
That source is misleading here. Dashboard frequency must come from actual shopping activity.

---

## Current recovered code state

As of this recovery snapshot, the repo already contains the main structural implementation for this plan on `main`.

### Git state observed during recovery

From `mobile/`:

```bash
git status --short --branch
```

Observed:

```bash
## main...origin/main
?? ../.hermes/
```

So the code changes below are currently present in the repository, and the only untracked path observed from `mobile/` was the repo-level `.hermes/` folder.

---

## Files involved

### Dashboard screen
- `mobile/src/features/dashboard/screens/DashboardScreen.tsx`

### Quick Add card
- `mobile/src/features/dashboard/components/QuickAddCard/QuickAddCard.tsx`
- `mobile/src/features/dashboard/components/QuickAddCard/types.ts`
- `mobile/src/features/dashboard/components/QuickAddCard/styles.ts`
- `mobile/src/features/dashboard/components/QuickAddCard/__tests__/QuickAddCard.test.tsx`

### New Frequently Added section
- `mobile/src/features/dashboard/components/FrequentlyAddedSection/FrequentlyAddedSection.tsx`
- `mobile/src/features/dashboard/components/FrequentlyAddedSection/types.ts`
- `mobile/src/features/dashboard/components/FrequentlyAddedSection/styles.ts`
- `mobile/src/features/dashboard/components/FrequentlyAddedSection/index.ts`
- `mobile/src/features/dashboard/components/FrequentlyAddedSection/__tests__/FrequentlyAddedSection.test.tsx`

### Frequency ranking utility
- `mobile/src/features/dashboard/utils/dashboardFrequentItems.ts`
- `mobile/src/features/dashboard/utils/__tests__/dashboardFrequentItems.test.ts`

### Likely related styling / support files
- `mobile/src/features/dashboard/screens/styles.ts`
- `mobile/src/common/components/TextBlock/*`
- `mobile/src/common/components/SafeImage/*`

### Legacy surface still present in codebase but intended to be removed from dashboard usage
- `mobile/src/features/dashboard/components/QuickStats/QuickStatsRow.tsx`
- `mobile/src/features/dashboard/components/QuickStats/QuickStatCard.tsx`

---

## What has already been implemented

### 1) Quick Add card has been simplified

`QuickAddCard` now focuses on search + quick input only.

Recovered prop surface from:
- `mobile/src/features/dashboard/components/QuickAddCard/types.ts`

Current props:
- `isTablet`
- `isRtl?`
- `searchValue`
- `onSearchChange`
- `searchResults`
- `onSelectItem`
- `onQuickAddItem`
- `showMainListBadge?`

Notably, there are no longer props for:
- suggested items
- suggestion toggling
- suggestion chip taps

That means the old suggested-items dashboard behavior has already been removed from this component API.

### 2) Dashboard-native Frequently Added section exists

Recovered file:
- `mobile/src/features/dashboard/components/FrequentlyAddedSection/FrequentlyAddedSection.tsx`

Current behavior:
- Renders a titled card with:
  - `frequentlyAdded.title`
  - `frequentlyAdded.subtitle`
- Renders grid tiles when items exist.
- Each tile calls `onItemPress(item)`.
- Each tile shows:
  - image
  - item name
  - add icon
- If there are no items, it renders a visible empty/placeholder state instead of returning `null`.
- RTL-specific footer/text styling is already wired in.

This matches the requested product direction.

### 3) Dashboard frequency is derived from shopping activity

Recovered file:
- `mobile/src/features/dashboard/utils/dashboardFrequentItems.ts`

Current utility behavior:
- Accepts `ShoppingItem[]` and a `limit`.
- Builds a ranking map.
- Deduplicates by:
  - `catalogItemId` when available
  - otherwise normalized item name
- Scores by quantity when available, otherwise by occurrence count.
- Preserves best available image.
- Returns top N ranked items as `GroceryItem[]`.

This is the correct direction because it avoids misleading catalog-based pseudo-personalization.

### 4) Dashboard screen is already wired to the new section

Recovered file:
- `mobile/src/features/dashboard/screens/DashboardScreen.tsx`

Observed integration:
- Imports `FrequentlyAddedSection`
- Imports `buildDashboardFrequentItems`
- Computes:

```ts
const dashboardFrequentItems = useMemo(
  () => buildDashboardFrequentItems(allItems, FREQUENT_ITEMS_MAX),
  [allItems],
);
```

- Renders layout in this order:
  1. `QuickAddCard`
  2. `FrequentlyAddedSection`
  3. `ImportantChoresCard`

- Wires frequent-item taps to:

```ts
onItemPress={handleQuickAddGroceryItem}
```

### 5) No-main-list fallback is already implemented on the quick-add path

Recovered from `DashboardScreen.tsx`:

```ts
if (!mainList) {
  showToast(t("detail.toasts.noMainList", { ns: "recipes" }));
  openShoppingModal();
  return;
}
```

This is exactly the intended fallback behavior.

### 6) Rapid-tap protection and optimistic quick add exist

Recovered from `DashboardScreen.tsx`:
- `allItemsRef` keeps a current synchronous snapshot.
- `pendingQuickAddKeys` prevents duplicate concurrent taps.
- `quickAddItem(...)` is used with optimistic update hooks.
- stale-item 404 handling removes dead items from local state so future taps can recreate them cleanly.

This means the implementation already went beyond static UI and addressed interaction robustness.

---

## Tests already present

### Quick Add card tests
File:
- `mobile/src/features/dashboard/components/QuickAddCard/__tests__/QuickAddCard.test.tsx`

Recovered assertions include:
- Quick Add renders without legacy Suggested Items.
- Main List badge renders.
- RTL rendering does not crash.
- mobile layout does not crash.
- accessibility labels exist for mic button.
- search results do not reintroduce legacy suggested chips.

### Frequently Added section tests
File:
- `mobile/src/features/dashboard/components/FrequentlyAddedSection/__tests__/FrequentlyAddedSection.test.tsx`

Recovered assertions include:
- section renders with populated items.
- tapping an item calls `onItemPress` with that item.
- empty state renders an in-UI placeholder.

### Ranking utility tests
File:
- `mobile/src/features/dashboard/utils/__tests__/dashboardFrequentItems.test.ts`

Recovered assertions include:
- ranking comes from shopping data, not generic catalog data.
- empty input returns `[]`.
- requested limit is respected.

---

## Exact implementation summary for a fresh LLM

If another LLM needs to reason about this feature, the implementation should be understood as:

1. **QuickAddCard is now only the add/search entry point.**
   - Do not reintroduce Suggested Items there.

2. **FrequentlyAddedSection is a separate dashboard card.**
   - Keep it below Quick Add.
   - Keep it visually native to the dashboard.

3. **Frequency must be derived from actual shopping activity.**
   - Source: `allItems`
   - Transformer: `buildDashboardFrequentItems(...)`

4. **Frequent-item taps must use the same action path as quick add.**
   - Use `handleQuickAddGroceryItem`
   - Do not create a separate add flow unless explicitly requested.

5. **If no main list exists, fallback behavior is mandatory.**
   - Show toast
   - Open shopping modal

6. **Placeholder state is intentional.**
   - Do not hide the whole section when no items exist unless Yair explicitly changes that preference.

7. **RTL support is mandatory.**
   - Preserve row reversal, text alignment, and writing direction in the new section.

---

## Remaining verification / polish checklist

Even though the core implementation appears present, a fresh session should still verify the following before calling the work fully done:

### Functional verification
- [ ] Suggested Items no longer appear anywhere on the dashboard home tab.
- [ ] Quick stats row no longer appears on the dashboard.
- [ ] Frequently Added appears directly below Quick Add.
- [ ] Tapping a frequent item increments/adds to the main list via the same quick-add flow.
- [ ] Without a main list, tapping a frequent item shows the toast and opens the shopping modal.
- [ ] Empty frequent-items state shows the intended placeholder UI.

### Visual verification
- [ ] spacing between Quick Add, Frequently Added, and Important Chores looks intentional on phone
- [ ] tablet layout still feels balanced
- [ ] RTL layout is visually correct
- [ ] tile imagery/text truncation look good for long grocery names

### Code verification
- [ ] no stale imports remain for dashboard quick stats usage
- [ ] no stale suggested-item props remain in dashboard callers
- [ ] no dead dashboard code paths remain for removed UI

---

## Recommended validation commands

Run from:
- `/home/claw/.hermes/hermes-agent/projects/KithchenHub/mobile`

### Targeted checks
```bash
npx tsc --noEmit
npm test -- src/features/dashboard/components/QuickAddCard/__tests__/QuickAddCard.test.tsx --runInBand
npm test -- src/features/dashboard/components/FrequentlyAddedSection/__tests__/FrequentlyAddedSection.test.tsx --runInBand
npm test -- src/features/dashboard/utils/__tests__/dashboardFrequentItems.test.ts --runInBand
```

### Broader dashboard regression pass
```bash
npm test -- --runInBand
```

---

## Known architectural rationale

### Why not use catalog “frequent” data?
Because that is not trustworthy user-history data in this codebase. Labeling it as Frequently Added would make the UI look personalized when it is actually just a generic catalog-derived slice.

### Why keep a placeholder instead of hiding the section?
Because the product direction here is to preserve the intended dashboard layout and communicate that personalized backend-driven content will populate later.

### Why route frequent-item taps through the same quick-add function?
To guarantee identical add/increment behavior, reuse optimistic update logic, and avoid forked state-management bugs.

---

## Handoff prompt for another LLM

Use this exact prompt if restarting in another model:

```text
You are working in /home/claw/.hermes/hermes-agent/projects/KithchenHub/mobile.
Read .hermes/plans/2026-04-28_0502-home-tab-frequent-items-recovery-plan.md first.
The goal is to verify and finish the KitchenHub dashboard home-tab refactor that removes Suggested Items and quick stats, adds a dashboard-native Frequently Added section under Quick Add, uses shopping activity instead of catalog pseudo-frequency data, preserves RTL, and keeps a visible placeholder state when backend-driven frequent data is not yet ready. Re-verify current code, run the targeted tests/typecheck, then report any remaining gaps or polish items before making changes.
```

---

## Bottom line

The recovered plan is:
- **Quick Add** stays
- **Suggested Items** go away
- **Quick stats** go away
- **Frequently Added** becomes a real dashboard section
- **Frequency is derived from shopping activity**
- **No-main-list fallback opens the shopping modal**
- **Placeholder state stays visible**
- **RTL support remains intact**

And the repo already appears to contain most or all of that implementation, so the next step is mainly **verification, cleanup, and polish**, not re-inventing the feature from scratch.
