# KitchenHub Recent Changes

Use this file to quickly orient a fresh LLM to the most relevant recent project-level changes and active workstreams.

This is not meant to replace git history or detailed plan files.
It should stay short and practical.

## Current important workstreams

### 1. Production stabilization and QA bug fixing
Status: active top-priority workstream

Current focus:
- stabilize the app for production
- fix bugs found during QA
- improve polish and reliability
- avoid regressions while making the experience smoother

Important instruction for future LLMs:
- prioritize stability over feature expansion
- prefer improving existing code rather than adding unnecessary new code
- when possible, modify the current implementation instead of introducing parallel abstractions or extra complexity

---

### 2. Per-user Frequently Added items
Status: active recent workstream

Current state:
- the UI work for Frequently Added items has already been done
- the next major step is backend support for per-user Frequently Added data

High-level direction:
- Frequently Added should reflect user-specific behavior
- this should not be faked with generic public catalog data
- the feature should remain useful in the UI while backend support is being completed

Primary references:
- `.hermes/plans/2026-04-28_0502-home-tab-frequent-items-recovery-plan.md`
- `mobile/src/features/dashboard/screens/DashboardScreen.tsx`
- `mobile/src/features/dashboard/components/FrequentlyAddedSection/`
- `mobile/src/features/dashboard/utils/dashboardFrequentItems.ts`

Important note:
The recent dashboard change removed the dashboard lists/recipes emphasis and added Frequently Added items instead.

---

### 3. Mobile/tablet layout and presentation stability
Status: active fragile area

The most fragile parts of the app right now are around the interaction experience on:
- phones
- tablets
- modals
- scrolling surfaces
- dropdowns
- keyboard-open states

When working in these areas, verify that:
- layouts still work on both tablet and mobile
- modals present correctly
- scrolling still works when dropdowns or keyboards are open
- interaction smoothness is preserved
- behavior is not only visually correct but also functionally correct

Primary references:
- `.hermes/plans/2026-04-27_095926-ios-form-presentation-rework.md`
- `.hermes/plans/2026-04-27_055530-mobile-modal-keyboard-scroll-plan.md`

---

### 4. Dashboard / home page direction shift
Status: recent product-direction change

The home page recently changed direction.

What changed:
- lists and recipes were removed from the dashboard emphasis
- Frequently Added items were added instead
- the dashboard became more focused on lightweight utility and quick access

Important implication:
If older docs or UI assumptions still describe the old home screen, verify the current approved direction before reverting anything.

---

## Most fragile areas right now

A fresh LLM should treat these as high-risk surfaces:
- mobile and tablet layout behavior
- modal presentation behavior
- scrolling with dropdowns and open keyboards
- animation smoothness
- UI stability after component edits
- persistence / state continuity after changes

---

## What changed direction recently

These product priorities shifted and should be treated as current guidance:

- **Production stabilization is more important than large new features**
- **Dashboard/home is lighter-weight and less central than shopping, recipes, and chores**
- **Frequently Added became a more important dashboard surface**
- **Guest mode is lower priority**
- **Household collaboration matters more than guest-mode investment**

---

## What a fresh LLM should check first

Before making changes, a fresh LLM should:

1. verify that the UI will not break on mobile or tablet
2. prefer improving existing code instead of adding extra code or extra abstractions
3. check whether older docs still match the current approved UI direction
4. verify modal, scrolling, dropdown, and keyboard-open behavior after UI edits
5. verify persistence and continuity after changes that touch state or interaction flows

Practical rule:
- do not add code just to feel productive
- keep the solution as small as possible while improving the current implementation

---

## Lower-priority areas for now

These are lower priority at the moment:
- guest mode
- large new features
- speculative expansions before the app is stable
- dashboard complexity beyond lightweight utility / quick access

---

## Important unfinished / future directions

These should still be visible to future LLMs as meaningful future directions, even if they are not the immediate focus:
- household member collaboration
- assistant integrations
- Siri / Google-style integrations
- continued production-readiness work
- backend support for per-user Frequently Added items

---

## Existing durable docs worth checking first

### Feature docs
- `docs/features/dashboard.md`
- `docs/features/shopping.md`
- `docs/features/recipes.md`
- `docs/features/chores.md`
- `docs/features/settings.md`
- `docs/features/auth.md`

### Architecture / product behavior
- `docs/architecture/DATA_MODES_SPEC.md`
- `docs/architecture/GUEST_STORAGE_DECISION.md`
- `docs/design/GUEST_MODE_SPECS.md`

### Implementation / historical investigations
- `docs/implementation/`
- `docs/code-review-latest.md`

---

## Recommended read order for a fresh LLM

1. `AGENTS.md`
2. `docs/project/PROJECT_OVERVIEW.md`
3. this file
4. relevant feature doc(s)
5. relevant `.hermes/plans/*.md`
6. relevant code

---

## When to update this file

Update this file when:
- a new major workstream starts
- a recent workstream materially changes direction
- a task-specific recovery plan becomes the main reference for a feature area
- an older doc becomes misleading compared with the current approved implementation direction
