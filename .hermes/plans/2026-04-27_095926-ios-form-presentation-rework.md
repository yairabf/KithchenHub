# iOS Form Presentation Rework Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Replace the broken centered add-recipe and add-chore dialogs with iOS-appropriate form presentations that keep actions visible, keep content clipped to the container, and behave correctly with the software keyboard.

**Architecture:** Stop using the current small centered alert-style modal for multi-field forms. Keep `CenteredModal` for short prompts/pickers only, and introduce a dedicated form presentation shell that supports a fixed header, a fixed primary action area, a bounded scrollable body, and keyboard-aware safe-area behavior. Use a full-screen form presentation for recipes and a sheet-style form presentation for chores, unless implementation simplicity favors sharing one full-screen form shell for both.

**Tech Stack:** Expo React Native, TypeScript, reusable modal primitives in `mobile/src/common/components`, iOS UX guidance from Apple HIG (Sheets, Modality, Scroll Views, Keyboard Layout Guide concepts).

---

## Current context / findings

### Product issue
The screenshots and user feedback show the current implementation is visually and interactionally broken:
- body content overflows outside the rounded modal card
- submit buttons disappear or become unreachable when the keyboard is open
- scrolling feels wrong and conflicts with the modal shell
- the recipe form is too large for a small centered dialog pattern

### UX conclusion
This is not just a keyboard bug. It is a **wrong presentation pattern** problem.

### Relevant platform guidance
From Apple HIG and UIKit docs reviewed during investigation:
- **Sheets** are the preferred iOS pattern for scoped tasks related to the current context.
- Longer or multi-step tasks can use a **full-screen modal experience**.
- Layout should adapt to the keyboard so important controls remain reachable.
- Scrollable content should live inside a bounded, clipped container.

### Resulting recommendation
- `AddRecipeModal` should become a **full-screen modal form**.
- `ChoreDetailsModal` add/edit flow should become a **sheet-style or full-screen form**, not a small centered popup.
- `CenteredModal` should go back to its intended role: confirmations, small pickers, short prompts.

---

## Proposed approach

### Recommended target UX

#### Add Recipe
Use a **full-screen form modal** with:
- safe-area aware header
- top-left close/cancel
- top-right save/add
- scrollable body only
- keyboard-aware bottom inset / focused-field visibility
- no floating footer buttons inside a cramped card

#### Add Chore
Use a **sheet-style form** or **the same full-screen form shell** with:
- fixed header actions
- bounded scrollable body
- enough height that the keyboard doesn’t crush the form

### Engineering recommendation
For lowest risk and best consistency:
1. Create one reusable `FullScreenFormModal` or `FormPresentationModal`
2. Migrate recipe first
3. Migrate chore add/edit second
4. Leave `CenteredModal` for small content only

If needed for speed, both chore and recipe can use the same full-screen form shell now, and a more compact sheet variant can come later.

---

## Step-by-step implementation plan

### Task 1: Add a dedicated reusable form presentation component

**Objective:** Create a reusable shell specifically for multi-field forms.

**Files:**
- Create: `mobile/src/common/components/FormPresentationModal/FormPresentationModal.tsx`
- Create: `mobile/src/common/components/FormPresentationModal/styles.ts`
- Create: `mobile/src/common/components/FormPresentationModal/types.ts`
- Optionally create/update barrel export if this repo uses one for common components

**Plan:**
1. Build a new presentation component that uses React Native `Modal`.
2. Support two modes if cheap:
   - `fullScreen`
   - `sheet`
3. Structure it as:
   - header (fixed)
   - body container (flex, clipped)
   - optional footer/action region OR top-bar save action only
4. Wrap it in keyboard-aware layout.
5. Ensure only the body scrolls.
6. Add safe-area handling and rounded top corners for sheet mode.

**Acceptance criteria:**
- no body overflow beyond container boundaries
- action affordances remain visible with keyboard open
- body can scroll independently

### Task 2: Keep `CenteredModal` limited to short content

**Objective:** Stop forcing long forms through the wrong modal primitive.

**Files:**
- Modify only if needed: `mobile/src/common/components/CenteredModal/CenteredModal.tsx`
- Modify only if needed: `mobile/src/common/components/CenteredModal/styles.ts`

**Plan:**
1. Revert any form-specific hacks that tried to make centered dialogs behave like sheets.
2. Keep `CenteredModal` optimized for:
   - short pickers
   - confirmations
   - compact, non-form content
3. Do not use it for add recipe / add chore after migration.

### Task 3: Migrate recipe creation to the new form presentation

**Objective:** Put the recipe form in the correct iOS pattern.

**Files:**
- Modify: `mobile/src/features/recipes/components/AddRecipeModal/AddRecipeModal.tsx`
- Modify: `mobile/src/features/recipes/components/AddRecipeModal/styles.ts`
- Possibly rename component later, but keep API stable for now if easier
- Test surface: recipe screen tests or a new component test file

**Plan:**
1. Replace `EntityFormModal`/`CenteredModal` usage with the new form presentation shell.
2. Put save action in the header or a fixed footer that stays above the keyboard.
3. Keep the recipe body as a vertical scroll view.
4. Ensure the body gets enough bottom padding for multiline fields, ingredients, and steps.
5. Verify image picker, ingredient search, and nested unit picker still behave correctly.

**Preferred UX:**
- full-screen presentation on iPhone
- sticky top bar with close + save

### Task 4: Migrate chore add/edit to the new form presentation

**Objective:** Give chore creation/editing a usable sheet/full-screen form.

**Files:**
- Modify: `mobile/src/features/chores/components/ChoreDetailsModal/ChoreDetailsModal.tsx`
- Modify: `mobile/src/features/chores/components/ChoreDetailsModal/styles.ts`
- Possibly update its types if the shell API differs

**Plan:**
1. Replace the current form wrapper with the new form presentation shell.
2. Keep body content vertically scrollable.
3. Keep quick tap targets for icons/recurrence/assignee chips.
4. Keep primary action fixed and visible.
5. If the implementation supports two display modes, use `sheet` here first.

### Task 5: Decide whether quick-add chore should also migrate now

**Objective:** Prevent duplicate broken patterns.

**Files:**
- Review/possibly modify: `mobile/src/features/chores/components/ChoresQuickActionModal/ChoresQuickActionModal.tsx`
- Review/possibly modify: `mobile/src/features/chores/components/ChoresQuickActionModal/styles.ts`

**Plan:**
1. If this flow is still user-facing, migrate it too.
2. If it is no longer primary, either:
   - migrate for consistency now, or
   - explicitly defer with a follow-up issue

**Recommendation:** If it is reachable in the UI, migrate it in the same PR.

### Task 6: Add focused regression coverage around presentation structure

**Objective:** Lock in the correct container hierarchy.

**Files:**
- Modify/create tests under:
  - `mobile/src/features/chores/components/ChoreDetailsModal/__tests__/ChoreDetailsModal.test.tsx`
  - `mobile/src/features/chores/components/ChoresQuickActionModal/__tests__/ChoresQuickActionModal.test.tsx`
  - new recipe modal test file if needed
  - new shared form presentation test file if worthwhile

**Plan:**
1. Assert form modals render through the new form shell, not `CenteredModal`.
2. Assert body scroll containers exist.
3. Assert header action affordances render in visible mode.
4. Prefer simple structural assertions over brittle snapshots.

---

## Files likely to change

### New shared component
- `mobile/src/common/components/FormPresentationModal/FormPresentationModal.tsx`
- `mobile/src/common/components/FormPresentationModal/styles.ts`
- `mobile/src/common/components/FormPresentationModal/types.ts`

### Shared modal primitives
- `mobile/src/common/components/CenteredModal/CenteredModal.tsx` (possibly cleanup only)
- `mobile/src/common/components/CenteredModal/styles.ts` (possibly cleanup only)

### Recipe
- `mobile/src/features/recipes/components/AddRecipeModal/AddRecipeModal.tsx`
- `mobile/src/features/recipes/components/AddRecipeModal/styles.ts`

### Chores
- `mobile/src/features/chores/components/ChoreDetailsModal/ChoreDetailsModal.tsx`
- `mobile/src/features/chores/components/ChoreDetailsModal/styles.ts`
- `mobile/src/features/chores/components/ChoresQuickActionModal/ChoresQuickActionModal.tsx` (if kept user-facing)
- `mobile/src/features/chores/components/ChoresQuickActionModal/styles.ts`

### Tests
- `mobile/src/features/chores/components/ChoreDetailsModal/__tests__/ChoreDetailsModal.test.tsx`
- `mobile/src/features/chores/components/ChoresQuickActionModal/__tests__/ChoresQuickActionModal.test.tsx`
- possibly a new recipe modal test file
- possibly a new `FormPresentationModal` test file

---

## Validation / verification

Run from `mobile/`:

```bash
npx tsc --noEmit
npm test -- ChoreDetailsModal --runInBand
npm test -- ChoresQuickActionModal --runInBand
npm test -- RecipesScreen --runInBand
```

### Manual QA checklist
1. Open add recipe on iPhone-sized viewport.
2. Focus top, middle, and bottom fields with the keyboard open.
3. Confirm save action is always visible and tappable.
4. Confirm no content escapes the modal/sheet surface.
5. Open add chore and repeat the same checks.
6. Verify RTL layout remains correct.
7. Verify image picker / nested unit picker still work.

---

## Risks / tradeoffs

### Risks
- introducing a new form shell affects multiple feature flows at once
- nested pickers inside a new sheet/full-screen pattern need attention
- the quickest path may require temporary API duplication before consolidation

### Tradeoffs
- **Correct UX pattern now** costs more than patching the old dialog, but avoids repeated keyboard/layout failures.
- **Shared form shell** is slightly more work up front, but much safer than continuing to patch each form independently.

---

## Open questions

1. Should chore use a compact sheet while recipe uses full-screen, or should both share full-screen for consistency and speed?
2. Do you want save/add in the header only, or also duplicated in a sticky footer on Android?
3. If quick-add chore is not a major path anymore, do you want it migrated in this PR or separately?

---

## Recommended implementation decision for this PR

For this PR, I recommend:
- **Add Recipe** → full-screen form modal
- **Add Chore** → full-screen form modal too

Reason:
- simplest stable implementation
- best chance of getting rid of keyboard/layout issues quickly
- consistent UX between both creation flows
- can later introduce a smaller sheet variant for chores if desired
