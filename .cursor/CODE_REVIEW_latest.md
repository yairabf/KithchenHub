# Senior Staff Engineer Code Review
**Date:** February 18, 2026  
**Branch:** `edit-list`  
**Scope:** Latest modifications since last review

---

## 1. Summary of Overall Code Quality

This batch of changes is **substantial and architecturally meaningful**. The major themes are:

- **ChoreDetailsModal refactored** to handle both `add` and `edit` modes, replacing the now-deprecated `ChoresQuickActionModal`
- **Dashboard decomposed** into `ImportantChoresCard`, `QuickStatsRow`, and shared `TextBlock` components
- **`EntityFormModal`** introduced as a generic form wrapper for modal add/edit patterns
- **i18n expanded** across chores, shopping, and dashboard screens
- **RTL propagation** added to chore components via `isWebRtl` prop

Overall code quality is **good**. The component decomposition decisions are well-motivated, and the `EntityFormModal` abstraction is clean. However, there are several **medium-to-high severity issues** that should be addressed before merging.

**Assessment: REQUEST CHANGES**

---

## 2. Detailed Issue List

---

### Issue 1 — HIGH: `ChoresQuickActionModal` Deleted Without Tests or Deprecation Trail

**Category:** Correctness / Architecture  
**Location:** `mobile/src/navigation/MainTabsScreen.tsx`, deleted `ChoresQuickActionModal`

**Problem:**  
`ChoresQuickActionModal` is removed and replaced with `ChoreDetailsModal mode="add"` directly in `MainTabsScreen`. If `ChoresQuickActionModal` had unique logic that was not fully migrated, behaviour is silently dropped. There is no test validating the new `add` path end-to-end.

**Current Code:**
```tsx
// MainTabsScreen.tsx
<ChoreDetailsModal
  visible={choresModalVisible}
  mode="add"
  onClose={handleCloseChoresModal}
  onAddChore={handleAddChore}
/>
```

**Missing:**  
- Confirm `ChoresQuickActionModal` source has been fully reconciled into `ChoreDetailsModal`
- Add a test that renders `ChoreDetailsModal mode="add"` and verifies it submits correctly

**Recommendation:**
```typescript
// ChoreDetailsModal.test.tsx
describe.each([
  ['add mode', 'add', undefined],
  ['edit mode', 'edit', mockChore],
])('ChoreDetailsModal in %s', (_, mode, chore) => {
  it('should render without crashing', () => { ... });
  it('should disable submit when name is empty', () => { ... });
  it('should call correct handler on submit', () => { ... });
});
```

---

### Issue 2 — HIGH: `handleAdd` Silently Discards Recurrence Pattern

**Category:** Correctness  
**Location:** `ChoreDetailsModal.tsx` line 69–78

**Problem:**  
`onAddChore` receives `recurrencePattern` as a field, but the `choreFactory.ts` `createChore()` function's `NewChoreData` interface does **not** include `recurrencePattern`. The value is accepted at call-site but never persisted.

**Offending Code:**
```typescript
onAddChore?.({
  title: choreName.trim(),
  icon: selectedIcon,
  assignee: selectedAssignee,
  dueDate: dayjs(selectedDateTime).format('MMM D, YYYY'),
  dueTime: dayjs(selectedDateTime).format('h:mm A'),
  section: getDueDateSection(selectedDateTime, isRecurring),
  isRecurring,
  recurrencePattern,  // ← Not in NewChoreData interface!
});
```

**`NewChoreData` interface:**
```typescript
interface NewChoreData {
  title: string;
  icon: string;
  assignee?: string;
  dueDate: string;
  dueTime?: string;
  section: 'today' | 'thisWeek' | 'recurring';
  isRecurring?: boolean;
  // recurrencePattern is MISSING
}
```

**Fix:**
```typescript
// choreFactory.ts
interface NewChoreData {
  title: string;
  icon: string;
  assignee?: string;
  dueDate: string;
  dueTime?: string;
  section: 'today' | 'thisWeek' | 'recurring';
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | null;
}

export const createChore = (data: NewChoreData): Chore => {
  return withCreatedAtAndUpdatedAt({
    id: Date.now().toString(),
    localId: Crypto.randomUUID(),
    title: data.title,
    assignee: data.assignee,
    dueDate: data.dueDate,
    dueTime: data.dueTime,
    isCompleted: false,
    section: data.section,
    icon: data.icon,
    isRecurring: data.isRecurring ?? false,
    recurrencePattern: data.recurrencePattern ?? null,
  });
};
```

**Coding Standard Violation:** Rule #12 — Handle edge cases gracefully. Silent data loss is a correctness bug.

---

### Issue 3 — HIGH: `EntityFormModal` Has Hard-Coded English Strings

**Category:** i18n / Correctness  
**Location:** `EntityFormModal.tsx` lines 18–19

**Problem:**  
The modal title and button labels are constructed with hardcoded English strings. This directly contradicts the systematic i18n work done across the rest of this branch.

**Offending Code:**
```typescript
const title = `${mode === 'add' ? 'Add' : 'Edit'} ${entityName}`;
const submitText = mode === 'add' ? 'Add' : 'Save';
```

**Fix:**
```typescript
// EntityFormModal accepts translated strings from caller
export interface EntityFormModalProps {
  ...
  title: string;          // caller provides translated title
  submitText?: string;    // caller provides translated submit label
  cancelText?: string;
}

// Usage in ChoreDetailsModal:
<EntityFormModal
  title={mode === 'add' ? t('modal.addTitle') : t('modal.editTitle')}
  submitText={mode === 'add' ? t('common.add') : t('common.save')}
  ...
>
```

Alternatively, have `EntityFormModal` accept an `i18n` key prefix and use `useTranslation` internally. Either is acceptable, but the current approach is **not acceptable** for a multi-language app.

**Coding Standard Violation:** Rule #12 — Handle edge cases gracefully. Rule #1 — Use language-appropriate conventions.

---

### Issue 4 — MEDIUM: `handleSave` Only Sends Delta Updates, `handleAdd` Never Validates Input Beyond Name

**Category:** Correctness / Reliability  
**Location:** `ChoreDetailsModal.tsx` lines 83–125

**Problem:**  
`handleSave` only sends changed fields (`updates`), which is good for patch semantics. However, `handleAdd` requires `choreName.trim()` and `selectedDateTime` are truthy but `selectedDateTime` is initialised to `new Date()` in add mode, meaning the `!selectedDateTime` guard is always `false`. The guard is misleading — it can never protect against a null date in add mode.

**Offending Code:**
```typescript
const submitDisabled = !choreName.trim() || !selectedDateTime;
// In add mode, selectedDateTime = new Date(), so !selectedDateTime is always false
```

**Fix:**
```typescript
const isSubmitDisabled = !choreName.trim();
// Only check date if it can actually be unset
```

Also: `handleAdd` uses `onAddChore?.()` with optional chaining, but if `onAddChore` is undefined in `add` mode, the modal closes silently having done nothing. In `add` mode, `onAddChore` should be **required**, not optional.

```typescript
// types.ts
type ChoreDetailsModalProps =
  | { mode: 'add'; onAddChore: (data: NewChoreData) => void; chore?: never; onUpdateChore?: never; ... }
  | { mode: 'edit'; chore: Chore; onUpdateChore: (id: string, updates: Partial<Chore>) => void; onAddChore?: never; ... };
```

This discriminated union enforces at compile time that the correct props are provided per mode.

---

### Issue 5 — MEDIUM: `TextBlock` Is Now a Shared Component But Lives Under `dashboard/`

**Category:** Architecture  
**Location:** `mobile/src/features/dashboard/components/TextBlock/`

**Problem:**  
`TextBlock` is now used by both `QuickAddCard` (dashboard) **and** `ImportantChoresCard` (dashboard). But the pattern is clearly generic — an RTL-aware title+subtitle block. Placing it under `dashboard/components/` means it cannot be imported by other features (e.g., chores, recipes) without crossing feature boundaries.

**Current import in ImportantChoresCard:**
```typescript
import { TextBlock } from "../TextBlock";
```

**If recipes or chores ever need this pattern, they'd import across feature boundaries, violating CLAUDE.md's architecture rules.**

**Recommendation:**  
Move `TextBlock` to `mobile/src/common/components/TextBlock/`. It is a pure UI primitive with no feature-specific logic.

```bash
mv mobile/src/features/dashboard/components/TextBlock/ mobile/src/common/components/TextBlock/
```

**Coding Standard Violation:** Rule #3 — Centralize common operations in utilities. CLAUDE.md architecture: shared code goes to `common/`.

---

### Issue 6 — MEDIUM: `isWebRtl` Prop Drilling Pattern Is Brittle

**Category:** Architecture / Scalability  
**Location:** `ChoresScreen.tsx`, `ChoreCard.tsx`, `ChoresSection.tsx`, `ChoresProgressCard.tsx`

**Problem:**  
RTL detection (`Platform.OS === 'web' && i18n.dir() === 'rtl'`) is computed in `ChoresScreen` and passed as `isWebRtl` prop through 3–4 levels of the component tree. This is classic prop-drilling, making the tree fragile to refactor and creating an implicit contract that every component in the chain must accept and forward the prop.

**Current pattern:**
```
ChoresScreen (computes isWebRtl)
  → ChoresSection (receives isWebRtl, passes down)
    → ChoreCard (receives isWebRtl)
  → ChoresProgressCard (receives isWebRtl)
```

**Recommendation:**
```typescript
// common/hooks/useRtlLayout.ts
export function useRtlLayout() {
  const { i18n } = useTranslation();
  return {
    isWebRtl: Platform.OS === 'web' && i18n.dir() === 'rtl',
    isNativeRtl: Platform.OS !== 'web' && I18nManager.isRTL,
    isRtl: I18nManager.isRTL || (Platform.OS === 'web' && i18n.dir() === 'rtl'),
  };
}

// Each leaf component calls the hook directly
export const ChoreCard = React.memo(function ChoreCard({ chore, ...props }: ChoreCardProps) {
  const { isWebRtl } = useRtlLayout();
  // No isWebRtl prop needed
```

This eliminates the prop chain entirely and gives each component self-contained RTL behaviour.

---

### Issue 7 — MEDIUM: `getDueDateSection` Logic Has an Off-By-One Ambiguity

**Category:** Correctness  
**Location:** `ChoreDetailsModal.tsx` lines 39–62

**Problem:**  
`getDueDateSection` returns `'thisWeek'` for any date that isn't today. But a date 6 months from now would also return `'thisWeek'`. The `section` field has three values: `'today'`, `'thisWeek'`, `'recurring'`. Future non-today dates should arguably not silently fall into `'thisWeek'`.

**Current Code:**
```typescript
const getDueDateSection = (date: Date, isRecurring: boolean): 'today' | 'thisWeek' | 'recurring' => {
  if (isRecurring) return 'recurring';
  const today = dayjs().startOf('day');
  const compareDate = dayjs(date).startOf('day');
  if (compareDate.isSame(today, 'day')) return 'today';
  return 'thisWeek'; // ← Any non-today date is called "thisWeek"
};
```

**Fix:**
```typescript
const getDueDateSection = (date: Date, isRecurring: boolean): 'today' | 'thisWeek' | 'recurring' => {
  if (isRecurring) return 'recurring';
  const today = dayjs().startOf('day');
  const compareDate = dayjs(date).startOf('day');
  if (compareDate.isSame(today, 'day')) return 'today';
  // Consider: return compareDate.diff(today, 'days') <= 7 ? 'thisWeek' : 'upcoming';
  return 'thisWeek';
};
```

At minimum, add a comment explaining the intent. If the app only shows today/this-week, document that the min date picker constraint enforces the range.

---

### Issue 8 — LOW: `inputRef` Is Created but Never Used for Auto-Focus

**Category:** UX / Correctness  
**Location:** `ChoreDetailsModal.tsx` line 27

**Problem:**  
```typescript
const inputRef = useRef<TextInput>(null);
```

`inputRef` is attached to the `TextInput` but `autoFocus` is not set, and `useEffect` does not call `inputRef.current?.focus()` on modal open. The ref serves no observable purpose.

**Fix:**
```typescript
useEffect(() => {
  if (visible && mode === 'add') {
    // Small delay to allow modal animation to complete before focusing
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }
}, [visible, mode]);
```

Or remove `inputRef` entirely if auto-focus is not desired.

---

### Issue 9 — LOW: `getAvatarUri` Duplicated Between `ImportantChoresCard` and `DashboardScreen`

**Category:** DRY / Architecture  
**Location:** `ImportantChoresCard.tsx` line 23, `DashboardScreen.tsx` (old code carried over)

**Problem:**  
The DiceBear avatar URL construction is duplicated. It should be extracted once:

```typescript
// common/utils/avatarUtils.ts
/**
 * Returns a deterministic avatar URL for a given assignee name.
 * Uses DiceBear Avataaars style with a seeded random appearance.
 */
export function getAssigneeAvatarUri(assignee?: string): string {
  const seed = assignee ?? 'default';
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}
```

---

### Issue 10 — LOW: Recurrence Options Are Hardcoded Strings, Not Translated

**Category:** i18n  
**Location:** `ChoreDetailsModal.tsx` lines 182–250 (recurrence section)

**Problem:**  
While the rest of the branch systematically replaces hardcoded strings with `t()` calls, the recurrence options ("None", "Daily", "Weekly", "Monthly") and section labels ("ICON:", "REPEAT:", "Assign to:") remain in English.

**Fix:** Add translation keys for these labels in `chores.json` and use `t()`.

---

### Issue 11 — LOW: `choreFactory.ts` Uses `Date.now().toString()` for ID

**Category:** Reliability  
**Location:** `choreFactory.ts` line 16

**Problem:**  
```typescript
id: Date.now().toString(),
```

`Date.now()` is millisecond-precision. Two chores created in the same millisecond (unlikely but possible in rapid adds) would collide. `Crypto.randomUUID()` is already imported and used for `localId`. Use it for `id` as well, or use a UUID consistently for both.

**Fix:**
```typescript
const id = Crypto.randomUUID();
const localId = Crypto.randomUUID();
```

---

## 3. Compliance Report

### Coding Standards Compliance

| Rule | Description | Status |
|------|-------------|--------|
| #1 | Descriptive function names | ✅ `isCustomGroceryItem`, `getSafeGroceryCategory`, `getDueDateSection` — good |
| #2 | Break down complex operations | ✅ Dashboard decomposition is excellent |
| #3 | Centralize shared code | ❌ `TextBlock` under `dashboard/`, `getAvatarUri` duplicated |
| #5 | Single responsibility | ⚠️ `ChoreDetailsModal` handles add + edit — acceptable with discriminated union |
| #6 | JSDoc documentation | ❌ `EntityFormModal`, `choreFactory`, `TextBlock` lack documentation |
| #8 | Run build/lint/tests before commit | ❌ TypeScript errors still blocking commits |
| #9 | Parameterize tests | ❌ No tests for `ChoreDetailsModal add/edit`, `EntityFormModal`, `TextBlock` |
| #10 | TDD — tests first | ❌ New components (`EntityFormModal`, `ImportantChoresCard`, `TextBlock`) have no tests |
| #12 | Handle edge cases | ❌ `handleAdd` with missing `onAddChore`, hardcoded strings in `EntityFormModal` |
| #13 | TypeScript strict | ⚠️ `mode: 'add' | 'edit'` is good; discriminated union not yet enforced |

### Senior-Level Engineering Expectations

- **Architecture direction:** ✅ Excellent decomposition of Dashboard and modal patterns
- **Correctness:** ❌ Issue #2 (recurrence data loss) and Issue #3 (i18n bypass) are blockers
- **Maintainability:** ⚠️ `isWebRtl` prop drilling will become painful as the feature grows
- **Testing:** ❌ Significant new code with zero test coverage

---

## 4. Final Recommendation

### 🛑 **REQUEST CHANGES**

**Must Fix Before Merge:**

1. **Issue #2** — `recurrencePattern` silently lost on chore add (data loss bug)
2. **Issue #3** — `EntityFormModal` hardcoded English strings (i18n regression)
3. **Issue #1** — Add tests for `ChoreDetailsModal` add and edit paths

**Should Fix Before Merge:**

4. **Issue #4** — Enforce discriminated union for `ChoreDetailsModalProps`
5. **Issue #5** — Move `TextBlock` to `common/components/`

**Nice To Have (Post-Merge OK):**

6. **Issue #6** — Replace `isWebRtl` prop drilling with `useRtlLayout` hook
7. **Issue #7** — Clarify `getDueDateSection` fallback intent
8. **Issue #8** — Wire up `inputRef` auto-focus or remove it
9. **Issue #9** — Extract `getAvatarUri` to shared utility
10. **Issue #10** — Translate recurrence option labels
11. **Issue #11** — Use UUID for chore `id`

**Estimated time to bring to Approve:** ~3 hours (primarily Issue #2, #3, #4 + writing 3–4 targeted tests)

---

**Reviewed by:** Senior Staff Engineer (AI)  
**Date:** February 18, 2026  
**Files Reviewed:** ~25 files (new + modified since last review)
