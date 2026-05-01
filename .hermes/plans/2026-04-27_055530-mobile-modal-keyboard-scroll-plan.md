# Mobile modal keyboard/scroll bug plan

> **For Hermes:** Planning only. Do not implement from this document without a separate execution request.

**Goal:** Fix the mobile UI bug where creating a new recipe or new chore becomes hard or impossible when the keyboard is open because the form cannot scroll enough to reach the bottom actions/save controls.

**Architecture:** Make the shared centered modal keyboard-aware and height-constrained to the visible viewport, then let form content scroll inside that constrained shell. Keep the fix centered in the reusable modal layer so recipe and chore creation paths benefit together, while allowing the form components to opt into scroll-friendly content behavior.

**Tech stack:** Expo React Native, TypeScript, reusable modal primitives in `mobile/src/common/components`.

---

## Current investigation findings

### Likely root cause
1. `mobile/src/common/components/CenteredModal/CenteredModal.tsx` renders a plain React Native `Modal` with a centered container and **no** `KeyboardAvoidingView`, no keyboard listeners, and no viewport-aware max height.
2. `mobile/src/common/components/CenteredModal/styles.ts` gives the modal a fixed centered card (`width: '85%'`, `maxWidth: 400`) but **no vertical cap** such as `maxHeight` or flexible content region.
3. `mobile/src/features/recipes/components/AddRecipeModal/AddRecipeModal.tsx` wraps a long form in a `ScrollView`, but that scroll view only has `maxHeight: 400` from `AddRecipeModal/styles.ts`; the shared modal itself is not keyboard-aware, so the keyboard can still cover the lower area and/or the action row.
4. `mobile/src/features/chores/components/ChoreDetailsModal/ChoreDetailsModal.tsx` does **not** wrap the body in a vertical `ScrollView` at all, so when the keyboard opens there is even less room for the content plus bottom actions.
5. The quick-add chore modal (`mobile/src/features/chores/components/ChoresQuickActionModal/ChoresQuickActionModal.tsx`) appears to use the same shared `CenteredModal`. Even if it is not the primary add flow today, it is a likely secondary regression surface and should be checked.

### Relevant files inspected
- `mobile/src/common/components/CenteredModal/CenteredModal.tsx`
- `mobile/src/common/components/CenteredModal/styles.ts`
- `mobile/src/common/components/CenteredModal/types.ts`
- `mobile/src/common/components/EntityFormModal/EntityFormModal.tsx`
- `mobile/src/common/components/EntityFormModal/types.ts`
- `mobile/src/features/recipes/components/AddRecipeModal/AddRecipeModal.tsx`
- `mobile/src/features/recipes/components/AddRecipeModal/styles.ts`
- `mobile/src/features/chores/components/ChoreDetailsModal/ChoreDetailsModal.tsx`
- `mobile/src/features/chores/components/ChoreDetailsModal/styles.ts`
- `mobile/src/features/chores/components/ChoresQuickActionModal/ChoresQuickActionModal.tsx`

---

## Proposed approach

### Recommendation
Fix this at the shared modal layer first, not separately in each feature.

### Why
- Both recipe and chore flows already share `CenteredModal`/`EntityFormModal`.
- The keyboard overlap problem is structural, not business-logic-specific.
- A shared fix reduces duplicate workaround code and lowers future bug risk for other modals.

### Expected implementation shape
1. Add keyboard-aware layout to `CenteredModal`.
2. Give the modal shell a viewport-relative max height and a flexible content region.
3. Allow forms to scroll within the modal content area.
4. Update the chore form body to be vertically scrollable.
5. Adjust the recipe form so its scroll container participates correctly in the new flexible modal layout instead of relying on a hard-coded `maxHeight: 400`.

---

## Step-by-step implementation plan

### Task 1: Make `CenteredModal` keyboard-aware

**Objective:** Ensure the modal reflows when the software keyboard opens.

**Files:**
- Modify: `mobile/src/common/components/CenteredModal/CenteredModal.tsx`
- Modify: `mobile/src/common/components/CenteredModal/styles.ts`
- Modify: `mobile/src/common/components/CenteredModal/types.ts`

**Plan:**
1. Wrap the modal content card in `KeyboardAvoidingView`.
   - iOS: likely `behavior="padding"`
   - Android: likely `behavior="height"` or omit if layout works better in testing
2. Add an optional prop set to `CenteredModal` for form-like modals if needed, for example:
   - `keyboardAware?: boolean`
   - `contentContainerStyle?`
   - `contentScrollEnabled?: boolean` only if necessary
3. Keep the default behavior backward-compatible so non-form modals do not visually regress.

**Notes:**
- Prefer a minimal API extension over a breaking change.
- Avoid hard-coding offsets until testing shows they are required.

### Task 2: Constrain modal height to the visible viewport

**Objective:** Prevent tall forms from extending past the screen when the keyboard is open.

**Files:**
- Modify: `mobile/src/common/components/CenteredModal/styles.ts`
- Possibly modify: `mobile/src/common/components/CenteredModal/CenteredModal.tsx`

**Plan:**
1. Add a modal `maxHeight` based on screen height or a percentage such as ~`85%-90%`.
2. Convert the modal internals into a three-part layout:
   - fixed header
   - flexible content region
   - fixed actions row
3. Ensure the content region can shrink and scroll instead of pushing the action row off-screen.

**Important detail:**
- The content wrapper likely needs `flexShrink: 1` and/or `minHeight: 0` to allow nested `ScrollView` content to size correctly.

### Task 3: Make `EntityFormModal` compatible with scrollable form content

**Objective:** Ensure form modals can benefit from the shared modal fix without awkward nesting behavior.

**Files:**
- Modify: `mobile/src/common/components/EntityFormModal/EntityFormModal.tsx`
- Modify: `mobile/src/common/components/EntityFormModal/types.ts` if new shared modal props are passed through

**Plan:**
1. Pass the new keyboard-aware/shared layout props from `EntityFormModal` into `CenteredModal`.
2. Keep `EntityFormModal` simple: it should remain a thin wrapper, not re-implement keyboard logic.
3. If a content-region style prop is introduced, set it here for form modals by default.

### Task 4: Update the chore add/edit form body to be vertically scrollable

**Objective:** Ensure the chore form remains usable on smaller screens while typing.

**Files:**
- Modify: `mobile/src/features/chores/components/ChoreDetailsModal/ChoreDetailsModal.tsx`
- Modify: `mobile/src/features/chores/components/ChoreDetailsModal/styles.ts`
- Test: `mobile/src/features/chores/components/ChoreDetailsModal/__tests__/ChoreDetailsModal.test.tsx`

**Plan:**
1. Wrap the main form body inside a vertical `ScrollView`.
2. Add `keyboardShouldPersistTaps="handled"` so taps on controls work while the keyboard is up.
3. Keep horizontal chip scrollers for icons/assignees nested inside the vertical scroll carefully.
4. Verify the save/add action remains reachable with the keyboard open.

**Implementation note:**
- The outer modal should own keyboard/height behavior.
- `ChoreDetailsModal` should only be responsible for making its body scrollable.

### Task 5: Update the recipe form to use the new flexible modal layout

**Objective:** Make the recipe form scroll cleanly under keyboard pressure without relying on a brittle fixed height.

**Files:**
- Modify: `mobile/src/features/recipes/components/AddRecipeModal/AddRecipeModal.tsx`
- Modify: `mobile/src/features/recipes/components/AddRecipeModal/styles.ts`
- Test: `mobile/src/features/recipes/screens/__tests__/RecipesScreen.test.tsx` if modal integration coverage is easiest there
- Consider adding a dedicated modal test file if one does not exist yet

**Plan:**
1. Keep the recipe body in a vertical `ScrollView`, but align it with the new flexible modal content area.
2. Replace or relax `styles.scrollContent.maxHeight = 400` if the shared modal now provides the real height constraint.
3. Add/verify:
   - `keyboardShouldPersistTaps="handled"`
   - content container padding near the bottom so the last field is not trapped behind the action row
4. Verify long content cases, especially ingredients/instructions lists and multiline text areas.

### Task 6: Check the quick-add chore modal for parity/regression

**Objective:** Ensure the same underlying bug does not remain in other chore creation UI.

**Files:**
- Review/possibly modify: `mobile/src/features/chores/components/ChoresQuickActionModal/ChoresQuickActionModal.tsx`
- Review/possibly modify: `mobile/src/features/chores/components/ChoresQuickActionModal/styles.ts`
- Test: `mobile/src/features/chores/components/ChoresQuickActionModal/__tests__/ChoresQuickActionModal.test.tsx`

**Plan:**
1. Confirm whether this modal is still reachable in the app.
2. If reachable, ensure its body also scrolls or fits under the keyboard after the shared fix.
3. If not reachable, keep this as a regression audit rather than mandatory implementation scope.

### Task 7: Add focused regression tests

**Objective:** Lock in the layout contract at the component level.

**Files:**
- Modify/create tests under:
  - `mobile/src/features/chores/components/ChoreDetailsModal/__tests__/ChoreDetailsModal.test.tsx`
  - `mobile/src/features/chores/components/ChoresQuickActionModal/__tests__/ChoresQuickActionModal.test.tsx`
  - `mobile/src/common/components/CenteredModal/` test file if the repo has room for one
  - recipe modal test file if practical

**Test ideas:**
1. Assert chore details body is rendered inside a `ScrollView` when visible.
2. Assert recipe modal still renders the `ScrollView` and save action in visible mode.
3. If `CenteredModal` gets new props, test their default values and form-mode behavior.
4. Prefer structural tests over brittle snapshot tests.

---

## Files likely to change

### Shared modal layer
- `mobile/src/common/components/CenteredModal/CenteredModal.tsx`
- `mobile/src/common/components/CenteredModal/styles.ts`
- `mobile/src/common/components/CenteredModal/types.ts`
- `mobile/src/common/components/EntityFormModal/EntityFormModal.tsx`
- `mobile/src/common/components/EntityFormModal/types.ts`

### Recipe form
- `mobile/src/features/recipes/components/AddRecipeModal/AddRecipeModal.tsx`
- `mobile/src/features/recipes/components/AddRecipeModal/styles.ts`

### Chore form
- `mobile/src/features/chores/components/ChoreDetailsModal/ChoreDetailsModal.tsx`
- `mobile/src/features/chores/components/ChoreDetailsModal/styles.ts`

### Possible follow-up parity surface
- `mobile/src/features/chores/components/ChoresQuickActionModal/ChoresQuickActionModal.tsx`
- `mobile/src/features/chores/components/ChoresQuickActionModal/styles.ts`

### Tests
- `mobile/src/features/chores/components/ChoreDetailsModal/__tests__/ChoreDetailsModal.test.tsx`
- `mobile/src/features/chores/components/ChoresQuickActionModal/__tests__/ChoresQuickActionModal.test.tsx`
- Possibly a new shared-modal test file if worthwhile

---

## Validation plan

Run from `mobile/`:

```bash
npx tsc --noEmit
npm test -- ChoreDetailsModal
npm test -- ChoresQuickActionModal
npm test -- RecipesScreen
```

### Manual QA checklist
1. Open **new recipe** modal.
2. Focus a low field (description, ingredient row, or last instruction) and confirm the screen still scrolls.
3. Confirm the primary save/add action remains reachable with the keyboard open.
4. Open **new chore** modal.
5. Focus the name field, open date picker if applicable, and verify the bottom action area is still reachable.
6. Repeat on both iOS and Android if available, because keyboard avoidance behavior differs.
7. Repeat in RTL if possible because these forms contain RTL-specific layout logic.

---

## Risks and tradeoffs

### Risks
- A shared `CenteredModal` change could affect other consumers such as shopping/settings modals.
- Nested scroll views can become awkward on Android if flex sizing is wrong.
- Keeping the action bar fixed while the body scrolls may require careful styling (`minHeight: 0`, `flexShrink`) to avoid content clipping.
- The DateTime picker modal could interact unexpectedly with a parent keyboard-aware modal if focus is not dismissed cleanly.

### Tradeoffs
- **Shared modal fix:** best long-term maintainability, slightly higher regression risk.
- **Per-screen workaround:** lower blast radius, but duplicates logic and likely misses future form modals.

**Recommended tradeoff:** do the shared modal fix, but keep the API narrowly scoped and validate a few unrelated `CenteredModal` consumers before merging.

---

## Open questions

1. Is the currently user-facing “new chore” path `ChoreDetailsModal` add mode, `ChoresQuickActionModal`, or both?
2. Should the action buttons remain fixed at the bottom of the modal while only the body scrolls, or is it acceptable for the actions to scroll with content?
3. Do you want this fix scoped strictly to recipe/chore creation, or should we take the opportunity to harden all form-based `CenteredModal` consumers now?

---

## Suggested execution order

1. Shared `CenteredModal` keyboard/height fix
2. `EntityFormModal` pass-through updates
3. `ChoreDetailsModal` body scroll support
4. `AddRecipeModal` body sizing cleanup
5. Quick-add chore parity check
6. Typecheck + targeted tests + manual QA
