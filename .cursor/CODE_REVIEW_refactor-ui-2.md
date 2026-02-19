# Code Review — `refactor-ui-2` Branch (Commits: bbfee13..b40c1db)

**Reviewer:** Senior Staff Engineer  
**Date:** 2026-02-16  
**Scope:** 5 commits covering RTL/i18n pass, shopping realtime + optimistic UI, dashboard component extraction, chore modal refactor, and shared component cleanup.

---

## 1. Summary of Overall Code Quality

The batch represents a **substantial, well-intentioned improvement** to internationalization coverage, component decomposition, and UI responsiveness. Architecture is clearly understood by the author—feature-based folders, shared utilities, discriminated unions for modal props, and optimistic updates all reflect senior-level thinking.

However, several concrete bugs and quality issues were introduced or left unaddressed:

- One potential **infinite re-render loop** in `ShoppingListsScreen`.
- One **data-loss bug** in `ChoreDetailsModal` (recurrence pattern drops to `'daily'` on edit).
- A **stale closure** in `handleAddToList` that can silently read stale state.
- Widespread **`useCallback`/`useMemo` omissions** in the 1 000-line screen component causing avoidable re-renders.
- A **DRY violation** where `handleRefresh` is a near-duplicate of `loadShoppingData`.
- `isWebRtl` declared but **never used**.
- A TypeScript **`as any` escape hatch** and a **type defined inside a component function**.
- Inconsistency in `apiErrorGuards.ts`: some guards return `boolean` instead of a type-predicate, breaking narrowing.

---

## 2. Detailed Issue List

---

### Issue 1 — CRITICAL BUG: `useEffect` with `selectedItemCategory` dependency causes an infinite re-render loop

**File:** `mobile/src/features/shopping/screens/ShoppingListsScreen.tsx:143–192`

**Explanation:**  
The effect that loads categories has `[selectedItemCategory]` in its dependency array. On line 173 it calls `setSelectedItemCategory(...)` when the current selection is not in the freshly loaded list. That state write triggers the effect again on the next render — and if the loaded list is stable the cycle repeats on every mount cycle. In practice this fires multiple extra API/AsyncStorage calls on every category selection.

```typescript
// ❌ The effect both depends on AND mutates selectedItemCategory
useEffect(() => {
  const loadCategoriesWithMigration = async () => {
    // ...
    if (!mergedCategories.includes(normalizedSelected)) {
      setSelectedItemCategory(normalizeCategoryKey(mergedCategories[0])); // ← triggers re-run
    }
  };
  loadCategoriesWithMigration();
}, [selectedItemCategory]); // ← depends on the value it writes
```

**Fix:** Run category loading only once on mount. The defaulting of `selectedItemCategory` should be handled as a derived value, not as a side effect.

```typescript
// ✅ Load once on mount; remove the category dependency
useEffect(() => {
  let cancelled = false;
  const loadCategoriesWithMigration = async () => {
    // ... same logic ...
    if (!cancelled) setAvailableCategories(mergedCategories);
  };
  loadCategoriesWithMigration();
  return () => { cancelled = true; };
}, []); // No selectedItemCategory dependency

// Derive default separately
const effectiveItemCategory = useMemo(() => {
  if (availableCategories.length > 0 && !availableCategories.includes(normalizeCategoryKey(selectedItemCategory))) {
    return normalizeCategoryKey(availableCategories[0]);
  }
  return selectedItemCategory;
}, [availableCategories, selectedItemCategory]);
```

---

### Issue 2 — DATA BUG: Edit mode in `ChoreDetailsModal` always resets recurrence to `'daily'`

**File:** `mobile/src/features/chores/components/ChoreDetailsModal/ChoreDetailsModal.tsx:66`

**Explanation:**  
When seeding the form with an existing chore in edit mode, the code branches only on the boolean `isRecurring` and hard-codes `'daily'`, discarding whatever actual pattern the chore had (`'weekly'`, `'monthly'`, etc.).

```typescript
// ❌ Loses the actual recurrence pattern
setRecurrencePattern(props.chore.isRecurring ? 'daily' : null);
```

**Fix:** Use the actual `recurrencePattern` field from the chore.

```typescript
// ✅ Preserves the real pattern
setRecurrencePattern(props.chore.recurrencePattern ?? null);
```

---

### Issue 3 — STALE CLOSURE: `handleAddToList` reads stale `allItems` inside async callback

**File:** `mobile/src/features/shopping/screens/ShoppingListsScreen.tsx:648–658`

**Explanation:**  
The `operation` callback passed to `executeWithOptimisticUpdate` reads `allItems` directly from the closure. By the time the async `updateItem` call executes, the optimistic update has already run and changed `allItems`—but the closure still holds the pre-optimistic snapshot. In rapid-tap scenarios this causes quantity calculations to use stale data.

```typescript
// ❌ allItems captured at the time the closure was created
async () => {
  const currentItems = allItems; // stale reference
  const currentItem = currentItems.find(item => item.id === itemId || item.localId === itemLocalId);
  const currentQuantity = currentItem?.quantity ?? baseQuantity;
  return await updateItem(itemId, { quantity: currentQuantity + quantity });
},
```

**Fix:** Capture the latest quantity directly from the optimistic updater or pass a ref.

```typescript
// ✅ Use the quantity that was already computed in the optimistic update
async () => {
  // nextQuantity is derived from baseQuantity + quantity at the time of the call,
  // which is the same value applied optimistically — safe to reuse
  const nextQuantity = baseQuantity + quantity;
  return await updateItem(itemId, { quantity: nextQuantity });
},
```

---

### Issue 4 — DRY VIOLATION: `handleRefresh` duplicates `loadShoppingData`

**File:** `mobile/src/features/shopping/screens/ShoppingListsScreen.tsx:261–321`

**Explanation:**  
`loadShoppingData` and `handleRefresh` contain the same fetch-sort-setState logic. Any future bug fix or feature addition must be applied to both places.

```typescript
// ❌ Near-identical bodies
const loadShoppingData = useCallback(async () => {
  setIsListsLoading(true); setIsItemsLoading(true);
  try {
    const data = await shoppingService.getShoppingData();
    const sortedLists = sortListsWithMainFirst(data.shoppingLists);
    setShoppingLists(sortedLists); setAllItems(data.shoppingItems);
    setSelectedList((current) => getSelectedList(sortedLists, current?.id));
  } catch (error) { console.error(...); }
  finally { setIsListsLoading(false); setIsItemsLoading(false); }
}, [...]);

const handleRefresh = async () => {          // ← identical logic
  setIsRefreshing(true);
  try {
    const data = await shoppingService.getShoppingData();
    const sortedLists = sortListsWithMainFirst(data.shoppingLists);
    setShoppingLists(sortedLists); setAllItems(data.shoppingItems);
    setSelectedList((current) => getSelectedList(sortedLists, current?.id));
  } catch (error) { console.error(...); }
  finally { setIsRefreshing(false); }
};
```

**Fix:** `handleRefresh` should delegate to `loadShoppingData`, managing only the refresh indicator.

```typescript
// ✅ Single source of truth
const handleRefresh = useCallback(async () => {
  setIsRefreshing(true);
  try {
    await loadShoppingData();
  } finally {
    setIsRefreshing(false);
  }
}, [loadShoppingData]);
```

---

### Issue 5 — DEAD CODE: `isWebRtl` is declared but never used

**File:** `mobile/src/features/dashboard/screens/DashboardScreen.tsx:80`

**Explanation:**  
`isWebRtl` is computed on every render but is never referenced in JSX or logic. All RTL usage in the file consumes `isRtl` only. This is dead code that misleads maintainers.

```typescript
// ❌ Computed but never consumed
const isWebRtl = isRtl && Platform.OS === 'web';
```

**Fix:** Remove the declaration entirely, or use it where RTL + web-specific overrides are needed.

---

### Issue 6 — TYPE SAFETY: `as any` escape hatch in `handleAddToList`

**File:** `mobile/src/features/shopping/screens/ShoppingListsScreen.tsx:702`

**Explanation:**  
The comment acknowledges the underlying type mismatch but resolves it with `as any` — suppressing all compiler protection for the call site.

```typescript
// ❌ Loses all type checking downstream
} as any); // Type assertion needed because ShoppingItem doesn't have catalogItemId
```

**Fix:** Move `ShoppingItemWithCatalog` (currently defined inside the component — see Issue 7) to module scope and use it properly.

```typescript
// ✅ At module level:
type ShoppingItemCreationPayload = Partial<ShoppingItem> & {
  catalogItemId?: string;
  masterItemId?: string;
};

// In the component:
const newItem = await createItem({
  name: itemName,
  listId: activeList.id,
  quantity,
  category: categoryToUse,
  image: selectedGroceryItem.image,
  catalogItemId: selectedGroceryItem.id.startsWith('custom-') ? undefined : selectedGroceryItem.id,
} satisfies ShoppingItemCreationPayload);
```

---

### Issue 7 — ANTIPATTERN: TypeScript type defined inside a component function

**File:** `mobile/src/features/shopping/screens/ShoppingListsScreen.tsx:379–382`

**Explanation:**  
Types defined inside functions are re-evaluated on every render (they're erased at runtime, but it's a bad signal in code review — they can't be imported, referenced in tests, or documented externally). Violates the "organize code by responsibility" rule.

```typescript
// ❌ Type trapped inside the function body
const createItem = async (item: ShoppingItemWithCatalog) => { ... };
// ...
type ShoppingItemWithCatalog = Partial<ShoppingItem> & {
  catalogItemId?: string;
  masterItemId?: string;
};
```

**Fix:** Hoist to module scope (at the top of the file alongside other type imports).

---

### Issue 8 — PERFORMANCE: `filteredItems` is not memoized

**File:** `mobile/src/features/shopping/screens/ShoppingListsScreen.tsx:371`

**Explanation:**  
`filteredItems` iterates over `allItems` on every render, including renders caused by unrelated state changes (modal visibility, search query, etc.). With large lists this is measurably expensive.

```typescript
// ❌ Runs on every render
const filteredItems = allItems.filter(item => item.listId === activeList.id);
```

**Fix:**

```typescript
// ✅ Memoized — only recomputes when data changes
const filteredItems = useMemo(
  () => allItems.filter((item) => item.listId === activeList.id),
  [allItems, activeList.id],
);
```

---

### Issue 9 — PERFORMANCE: Most handler functions in `ShoppingListsScreen` lack `useCallback`

**File:** `mobile/src/features/shopping/screens/ShoppingListsScreen.tsx`

**Explanation:**  
`handleRefresh`, `handleQuantityChange`, `handleDeleteItem`, `handleToggleItemChecked`, `handleSelectGroceryItem`, `handleQuickAddItem`, `handleAddToList`, `handleCancelQuantityModal`, `handleQuantityInputChange`, `handleOpenCreateListModal`, `handleOpenEditListModal`, `handleCancelCreateListModal`, `handleCreateList`, `handleConfirmDeleteList`, `handleCategoryClick`, `handleCloseCategoryModal`, and `handleSelectItemFromCategory` are all plain `const` functions re-created on every render.

These callbacks are passed down to memoized child components (`ShoppingListPanel`, `CreateCustomItemModal`, `CategoriesGrid`, etc.), defeating those components' own memoization. Violates the "pure functions" and performance coding rules.

**Fix:** Wrap each handler in `useCallback` with its correct dependency array. Example:

```typescript
// ✅
const handleDeleteItem = useCallback(async (itemId: string) => {
  // ... existing body ...
}, [allItems, isSignedIn, deletingItemIdsRef, executeWithOptimisticUpdate, deleteItem]);
```

---

### Issue 10 — CODE SMELL: `DashboardScreen` defines a private `getAvatarUri` that duplicates `getAssigneeAvatarUri`

**File:** `mobile/src/features/dashboard/screens/DashboardScreen.tsx:68–71`

**Explanation:**  
`getAssigneeAvatarUri` was extracted to `mobile/src/common/utils/avatarUtils.ts` specifically to prevent this duplication. `ImportantChoresCard` already imports the shared version, but `DashboardScreen` declares its own local copy. Two implementations, one concept — future changes to the avatar URL pattern must be made in two places.

```typescript
// ❌ Local duplicate — already exists in common/utils/avatarUtils.ts
function getAvatarUri(assignee?: string): string {
  const seed = assignee ?? "default";
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}
```

**Fix:**

```typescript
// ✅ Import and use the shared utility
import { getAssigneeAvatarUri } from "../../../common/utils/avatarUtils";
// ... and replace getAvatarUri(user?.name ?? "user") → getAssigneeAvatarUri(user?.name)
```

---

### Issue 11 — TYPE SAFETY: Status-specific error guards in `apiErrorGuards.ts` should return type predicates

**File:** `mobile/src/common/utils/apiErrorGuards.ts`

**Explanation:**  
`isApiError` and `isNetworkError` correctly use the type-predicate syntax (`error is ApiError`), enabling TypeScript to narrow the type after the check. But `is404Error`, `is401Error`, `is403Error`, `is409Error`, `isServerError`, and `isClientError` return `boolean`. This means the compiler cannot narrow inside an `if (is404Error(error))` block.

```typescript
// ❌ No narrowing possible after this check
export function is404Error(error: unknown): boolean {
  return isApiError(error) && error.statusCode === 404;
}

// Usage:
if (is404Error(error)) {
  error.statusCode; // ← TypeScript still sees error as unknown
}
```

**Fix:** Return type predicates consistently.

```typescript
// ✅ Caller gets full type narrowing
export function is404Error(error: unknown): error is ApiError {
  return isApiError(error) && error.statusCode === 404;
}
```

---

### Issue 12 — INCONSISTENCY: `logShoppingError` wrapper coexists with direct `console.error` calls

**File:** `mobile/src/features/shopping/screens/ShoppingListsScreen.tsx:373–375`

**Explanation:**  
`logShoppingError` is defined as a thin wrapper around `console.error` and used in 6 places. However, 5 other `console.error` calls in the same file bypass it (lines 111, 178, 274, 317, 366, 825). The wrapper adds no additional functionality (no Sentry, no toast, no tag), making it pure noise. Either add real value to the wrapper and use it everywhere, or delete it and use `console.error` consistently.

---

### Issue 13 — DOCUMENTATION: `App.tsx` tree remount loses navigation state without explanation

**File:** `mobile/App.tsx:86`

**Explanation:**  
Incrementing `treeKey` causes a full unmount/remount of `RootNavigator` on language change. While this is a pragmatic RTL bootstrap approach, it silently resets all navigation state (current screen, stack history). This is a significant UX tradeoff with no inline comment or mitigation.

**Recommendation:** Add a comment explaining the deliberate tradeoff, and consider persisting + restoring navigation state via `@react-navigation/native`'s `initialState` prop.

---

### Issue 14 — MINOR: `shareText` memo has a redundant `i18n.language` dependency

**File:** `mobile/src/features/shopping/screens/ShoppingListsScreen.tsx:852`

**Explanation:**  
`useTranslation` already creates a new `t` reference when the language changes. Including `i18n.language` as an explicit `useMemo` dependency is therefore redundant — the memo will recompute correctly even without it.

```typescript
// ❌ i18n.language is redundant — t already updates on language change
const shareText = useMemo(
  () => formatShoppingListText(activeList.name, filteredItems, t),
  [activeList.name, filteredItems, t, i18n.language],  // ← unnecessary
);

// ✅
const shareText = useMemo(
  () => formatShoppingListText(activeList.name, filteredItems, t),
  [activeList.name, filteredItems, t],
);
```

---

## 3. Compliance Report

| Rule | Status | Notes |
|---|---|---|
| Descriptive function/variable names | ✅ Pass | Generally excellent naming throughout |
| Break down complex logic into helpers | ✅ Pass | `executeWithOptimisticUpdate`, `sortListsWithMainFirst`, `getDueDateSection` all good |
| Use utility modules | ⚠️ Partial | `getAvatarUri` still duplicated in `DashboardScreen` (Issue 10) |
| Single responsibility per function | ⚠️ Partial | `handleAddToList` handles creation AND update AND quantity merge in 90 lines |
| TDD / tests first | ⚠️ Partial | New utilities (`apiErrorGuards`, `avatarUtils`) lack unit tests |
| Parameterized tests | N/A | No new test files introduced in this batch |
| No `any` type | ❌ Fail | Line 702 uses `as any` (Issue 6) |
| Pure functions | ⚠️ Partial | Handlers are not `useCallback`-wrapped (Issue 9) |
| No mutable operations | ✅ Pass | Spread / filter / map patterns used correctly throughout |
| Strict TypeScript | ⚠️ Partial | Type defined inside component (Issue 7), non-predicate guards (Issue 11) |
| Pre-commit checks | N/A | Handled by hooks |

**Senior-level expectations:**  
The refactoring direction is sound. The issues listed are concrete, fixable, and mostly fall into two buckets: (a) bugs that will manifest in production (Issues 1–3) and (b) maintainability/performance debt (Issues 4–14). Issues 1–3 require immediate fixes before shipping.

---

## 4. Final Recommendation

**Request Changes**

Three production bugs (infinite re-render, data loss on edit, stale closure) must be fixed before this branch can be merged. The remaining issues are important code quality improvements that should also be addressed.

### Priority Order

1. 🔴 **Issue 1** — Infinite re-render loop in category loading effect  
2. 🔴 **Issue 2** — `ChoreDetailsModal` drops actual recurrence pattern on edit  
3. 🔴 **Issue 3** — Stale closure in `handleAddToList`  
4. 🟠 **Issue 4** — `handleRefresh` duplicates `loadShoppingData`  
5. 🟠 **Issue 6 + 7** — `as any` and type inside component  
6. 🟠 **Issue 8 + 9** — Missing `useMemo` / `useCallback`  
7. 🟡 **Issue 10** — Duplicate `getAvatarUri`  
8. 🟡 **Issue 11** — Error guard type predicates  
9. 🟡 **Issue 12** — Inconsistent error logging  
10. 🟡 **Issue 5, 13, 14** — Dead code, navigation comment, redundant memo dep  
