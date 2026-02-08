# Code Review: Add Recipe Modal – Ingredient Lock & Numeric Inputs

**Reviewer:** Senior Staff Engineer (code review)  
**Scope:** Latest modifications to `AddRecipeModal` and styles (ingredient name lock, numeric-only Prep Time/Qty, read-only styling)  
**Date:** 2025-02-08

---

## 1. Summary of Overall Code Quality

The changes implement two behaviors: (1) locking the ingredient name field once an ingredient has a name, and (2) restricting Prep Time and Qty inputs to numeric values. The intent is clear and the UI is improved with keyboard types and a read-only style. **Several issues should be addressed:** numeric helpers live in the component instead of shared utils (violates project rules), there are no tests for the new logic, and the ingredient-name lock can prevent users from typing a full name if a row ever has an empty name (e.g. in edit mode or a future “add empty row” flow). Overall: **approve with minor changes** once the issues below are fixed or explicitly accepted.

---

## 2. Detailed Issue List

### Issue 1: **[Coding standards] Numeric helpers belong in shared utils**

**Rule violated:** *“Centralize common operations in utilities”* (coding_rule.mdc §3) – shared string/math helpers should live in utility modules, not inside a single component.

**Explanation:** `stripToDigitsOnly` and `stripToNumeric` are generic input-sanitization helpers. Keeping them in `AddRecipeModal.tsx` prevents reuse (e.g. other numeric fields) and makes unit testing and discovery harder.

**Relevant code:**

```34:46:mobile/src/features/recipes/components/AddRecipeModal/AddRecipeModal.tsx
/** Keeps only digits (0-9). Use for integer-only inputs like prep time. */
function stripToDigitsOnly(text: string): string {
  return text.replace(/\D/g, '');
}

/** Keeps only digits and at most one decimal point. Use for quantity inputs. */
function stripToNumeric(text: string): string {
  const hasDecimal = /\./.test(text);
  const filtered = text.replace(hasDecimal ? /[^\d.]/g : /\D/g, '');
  if (!hasDecimal) return filtered;
  const parts = filtered.split('.');
  return parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : filtered;
}
```

**Recommended fix:**

- Add `mobile/src/common/utils/inputSanitization.ts` (or `mobile/src/features/recipes/utils/inputSanitization.ts`) and move both functions there.
- Export with JSDoc including `@param` and `@returns`.
- In `AddRecipeModal.tsx`, import and use these helpers.
- Add a small unit test file for the new utils with parameterized cases (see Testing section).

---

### Issue 2: **[Correctness / UX] Ingredient name locks after first character when name is empty**

**Explanation:** `editable={ing.name.trim().length === 0}` makes the name field read-only as soon as `ing.name` has any character. So if a row ever has an empty name (e.g. edit mode with bad data, or a future “add empty row” button), the user can type only one character before the field locks.

**Relevant code:**

```369:378:mobile/src/features/recipes/components/AddRecipeModal/AddRecipeModal.tsx
                editable={ing.name.trim().length === 0}
                accessibilityLabel={
                  ing.name.trim().length > 0
                    ? `Ingredient: ${ing.name} (name cannot be changed)`
                    : 'Ingredient name'
                }
```

**Recommended fix (choose one):**

- **Option A:** Lock only on blur: keep the field editable until the user leaves it (e.g. `onBlur` sets a “name committed” flag for that ingredient id), then treat it as locked. That way a user can type “Apple” and then blur to lock.
- **Option B:** Track “locked” explicitly: e.g. when adding from search, set a `nameLocked: true` (or `source: 'search'`) on the ingredient and only then make the field read-only; manually added rows (empty name) stay editable until blur or until you define another rule.

Current product flow may only add ingredients via search (with a name), so this might not surface today; the recommendation is to make the behavior robust for empty-name rows.

---

### Issue 3: **[Maintainability] Repeated expression for “name is locked”**

**Explanation:** `ing.name.trim().length > 0` and `ing.name.trim().length === 0` are used multiple times in the same ingredient row. Repeating the expression makes it easier to change the rule in one place and keeps the JSX clearer.

**Relevant code:** Same block as above; also style and `onChangeText`.

**Recommended fix:** Inside the `.map` callback, derive a single variable and use it everywhere:

```ts
const isNameLocked = ing.name.trim().length > 0;
// Then: editable={!isNameLocked}, style conditional, accessibilityLabel
```

---

### Issue 4: **[Coding standards] No tests for new behavior**

**Rules violated:** *“Follow TDD”* and *“Always parameterize tests”* (coding_rule.mdc §§9–10). New logic was added without tests.

**Explanation:** The new helpers are pure functions and are ideal for parameterized unit tests. The modal’s behavior (numeric filtering, name lock) is also testable.

**Recommended fix:**

1. **Unit tests for numeric helpers** (in `common/utils/__tests__/inputSanitization.test.ts` or under `recipes/utils/__tests__/`):

   - `stripToDigitsOnly`: parameterize over `['empty', '', ''], ['digits only', '123', '123'], ['with letters', '12ab34', '1234'], ['with spaces', '30 mins', '30']`.
   - `stripToNumeric`: parameterize over `['integer', '42', '42'], ['one decimal', '1.5', '1.5'], ['multiple decimals', '1.2.3', '1.23'], ['letters', '1a.2b', '1.2'], ['leading decimal', '.5', '.5']`.

2. **AddRecipeModal (optional but recommended):** Snapshot or behavior tests that prep time and qty inputs only accept numeric input, and that the ingredient name field is read-only when the name is non-empty (and optionally that it stays editable until blur if you implement Option A above).

---

### Issue 5: **[Documentation] JSDoc can include @param and @returns**

**Rule:** *“Document behaviors with language-appropriate comments”* (coding_rule.mdc §6) – include parameters, return values, and edge cases.

**Current:** One-line description only.

**Recommended fix:** For the new utils (once moved), use full JSDoc, e.g.:

```ts
/**
 * Keeps only digit characters (0-9). Use for integer-only inputs (e.g. prep time in minutes).
 * @param text - Raw input string
 * @returns String containing only digits; empty string if none
 */
export function stripToDigitsOnly(text: string): string { ... }
```

---

### Issue 6: **[Correctness] stripToNumeric and leading decimal**

**Explanation:** For input like `".5"`, `stripToNumeric` returns `".5"`. That’s valid for quantity (e.g. “.5 cups”). No change required; only noting that leading decimals are allowed. If product wants to reject leading decimals, that would be a separate validation rule (e.g. when saving or in a different sanitizer).

---

## 3. Compliance Report

| Area | Status | Notes |
|------|--------|--------|
| **Senior-level expectations** | Partial | Logic is sound; structure and testability need improvement. |
| **coding_rule.mdc** | Violations | §3 (centralize utilities), §6 (JSDoc params/returns), §9–10 (parameterized tests, TDD). |
| **Correctness** | Risk | Name lock can lock after one character if name is ever empty. |
| **Architecture** | Minor | Helpers should live in utils. |
| **Readability** | Good | Names and comments are clear; reduce duplication with `isNameLocked`. |
| **Performance** | OK | No concerns. |
| **Security / reliability** | OK | Numeric filtering is appropriate; no new risks identified. |
| **Testing** | Missing | No tests for new helpers or modal behavior. |

---

## 4. Final Recommendation

**Approve with minor changes.**

- **Must-do:** Move `stripToDigitsOnly` and `stripToNumeric` to a shared utils module and add parameterized unit tests for them. Optionally add JSDoc with `@param`/`@returns`.
- **Should-do:** Introduce `isNameLocked` (or equivalent) to avoid repeating `ing.name.trim().length` and consider locking the ingredient name on blur (or by explicit “added from search” flag) so that empty-name rows don’t lock after one character.
- **Nice-to-have:** Add tests or snapshots for AddRecipeModal’s numeric inputs and name lock behavior.

Once the “must-do” items are done (utils + tests), the change set is in line with project standards and ready to merge. The “should-do” item improves robustness and maintainability and is recommended before or soon after merge.
