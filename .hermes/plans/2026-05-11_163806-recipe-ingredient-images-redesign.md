# Recipe Ingredient Images Redesign Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Redesign the Recipe Detail ingredients section so every catalog-backed ingredient displays its centralized catalog image in the recipe page itself, while keeping Recipe → Shopping List add/add-all behavior snappy and preserving catalog identity.

**Architecture:** Recipe ingredients should be enriched once in `RecipeDetailScreen` from the centralized catalog (`catalogItemId` first, normalized-name fallback second), then passed down as display-ready data to `RecipeContentWrapper`/`RecipeIngredients`. The visual layer should render image-first ingredient rows using the existing shared grocery-card primitives where possible, with a clean fallback for ingredients that truly have no image.

**Tech Stack:** Expo React Native, TypeScript, Jest + React Native Testing Library, existing KitchenHub catalog/shopping repository services.

---

## Current Context From Inspection

Relevant files inspected:
- `mobile/src/features/recipes/screens/RecipeDetailScreen.tsx`
- `mobile/src/features/recipes/components/RecipeIngredients/RecipeIngredients.tsx`
- `mobile/src/features/recipes/components/RecipeIngredients/styles.ts`
- `mobile/src/features/recipes/components/IngredientCard/IngredientCard.tsx`
- `mobile/src/common/components/GroceryCard/GroceryCardContent.tsx`
- `mobile/src/common/components/GroceryCard/styles.ts`
- `mobile/src/features/recipes/screens/__tests__/RecipeDetailScreen.test.tsx`

Important current behavior:
- `RecipeDetailScreen.tsx` already contains a `displayRecipe` memo that fills missing `ingredient.image` from `useCatalog().groceryItems`.
- The resolver currently prefers `catalogItemId` and falls back to normalized names.
- `RecipeIngredients.tsx` already passes `image={ingredient.image}` into `GroceryCardContent` and uses `imagePosition={ingredient.image ? 'left' : 'none'}`.
- Existing regression tests already assert catalog images flow into the mocked `RecipeContentWrapper`.
- The remaining feature work should therefore be treated as a **UI/UX hardening and redesign pass**, not a raw data-plumbing-only change.

## Acceptance Criteria

1. Recipe Detail ingredients visually show images for catalog-backed ingredients.
2. The image is visible in the ingredients tab, not only after adding to the shopping list.
3. Ingredient rows remain compact, native-feeling, and mobile-first.
4. Missing-image ingredients have a polished fallback, not a broken/blank row.
5. Add-single and Add All still preserve:
   - `catalogItemId`
   - catalog category
   - catalog image
   - snappy cache-aware repository behavior
6. RTL layout still behaves correctly.
7. Existing shopping-list behavior is not regressed.

---

## Proposed UX Direction

Use a compact card row similar to the shopping item style but tuned for recipes:

- Left side: 44–48px rounded ingredient image.
- Main text:
  - ingredient name, strong and readable
  - quantity/unit as a small recipe-colored meta label
- Right side: circular cart/add button.
- Card background: subtle surface with enough spacing so images do not feel cramped.
- Missing image fallback:
  - show a soft recipe-colored icon/avatar, e.g. `restaurant-outline` or first-letter badge
  - do **not** hide the image column entirely, because that causes rows to jump between image/no-image layouts.

Design principle: ingredient rows should feel like “real food items from the same catalog” rather than plain text rows.

---

## Task 1: Lock Down Image Enrichment Regression

**Objective:** Ensure recipe ingredient image enrichment remains protected before changing UI.

**Files:**
- Modify: `mobile/src/features/recipes/screens/__tests__/RecipeDetailScreen.test.tsx`

**Steps:**
1. Confirm the existing test `enriches signed-in recipe ingredients with catalog images for display` still covers:
   - ingredient with `catalogItemId`
   - missing image in recipe DTO
   - image resolved from `useCatalog().groceryItems`
2. Add one extra assertion if needed for name fallback, e.g. recipe ingredient `Large Eggs` without `catalogItemId` resolves to catalog `Eggs` image.
3. Run:
   ```bash
   cd mobile
   npm test -- --runInBand src/features/recipes/screens/__tests__/RecipeDetailScreen.test.tsx
   ```
4. Expected: tests pass before/after UI work.

**Notes:** If the existing `Large Eggs` test only checks create payload after Add All, extend it so the mocked `RecipeContentWrapper` also exposes the display image for that ingredient.

---

## Task 2: Add a Component-Level Test for RecipeIngredients Image UI

**Objective:** Verify the actual `RecipeIngredients` component renders an image when `ingredient.image` exists and renders a stable fallback when it does not.

**Files:**
- Create or modify: `mobile/src/features/recipes/components/RecipeIngredients/__tests__/RecipeIngredients.test.tsx`
- Modify if needed: `mobile/src/features/recipes/components/RecipeIngredients/RecipeIngredients.tsx`

**Test cases:**
1. With image:
   - render a recipe with `ingredient.image = 'apple.png'`
   - assert the image-backed row renders the image path via `SafeImage`/`GroceryCardContent` test seam
2. Without image:
   - render a recipe ingredient without `image`
   - assert the fallback icon/avatar is rendered
   - assert the layout still includes the same image/avatar column
3. Add button:
   - pressing the cart button calls `onAddIngredient(ingredient)`
4. Add All:
   - pressing Add All calls `onAddAllIngredients()`

**Run:**
```bash
cd mobile
npm test -- --runInBand src/features/recipes/components/RecipeIngredients/__tests__/RecipeIngredients.test.tsx
```

**Expected:** Initially fail if fallback UI/test IDs are not yet implemented, then pass after implementation.

---

## Task 3: Redesign RecipeIngredients Row Rendering

**Objective:** Update ingredient cards to always reserve an image/avatar slot and look polished on mobile.

**Files:**
- Modify: `mobile/src/features/recipes/components/RecipeIngredients/RecipeIngredients.tsx`
- Modify: `mobile/src/features/recipes/components/RecipeIngredients/styles.ts`
- Possibly modify shared styling in: `mobile/src/common/components/GroceryCard/styles.ts` only if reusable primitives need non-breaking support.

**Implementation direction:**
- Keep using `ListItemCardWrapper` + `GroceryCardContent` if possible.
- Change `imagePosition` from conditional hiding to a stable left-side visual:
  - for real images: pass `image={ingredient.image}`
  - for missing images: pass a recipe fallback `customIcon`
  - use `imagePosition="left"` consistently
- Suggested fallback icon:
  ```tsx
  <Ionicons name="restaurant-outline" size={20} color={colors.recipes} />
  ```
- Ensure title is `ingredient.name || t('detail.ingredientFallbackName')`.
- Keep quantity/unit in `IngredientInfo`.
- Keep cart button on the right.
- Slightly increase image size if visually needed by adding a recipe-specific row wrapper rather than changing shopping-wide image sizes globally.

**Pitfall:** Do not hide the image column for missing images; the user explicitly wants ingredient images in the recipe surface, so a stable visual image/fallback area makes the redesign feel intentional.

---

## Task 4: Improve Ingredient Image Resolver Reuse

**Objective:** Avoid duplicate catalog resolution logic inside `RecipeDetailScreen` and keep display enrichment aligned with shopping payload creation.

**Files:**
- Modify: `mobile/src/features/recipes/screens/RecipeDetailScreen.tsx`

**Implementation direction:**
- Reuse `resolveIngredientCatalogItem(ingredient)` inside the `displayRecipe` memo instead of duplicating catalog lookup logic.
- Keep these rules:
  1. if `ingredient.image` exists, preserve it
  2. else resolve by `catalogItemId`
  3. else resolve by normalized name
  4. else leave unchanged so the UI fallback appears
- If moving code requires reorder, place `resolveIngredientCatalogItem` before `displayRecipe` or extract a small helper function in the same file.

**Why:** One resolver should be responsible for both display images and shopping-list metadata to prevent drift.

---

## Task 5: Verify Recipe → Shopping Metadata Is Still Preserved

**Objective:** Ensure the redesign does not break the previous shopping-list consistency fixes.

**Files:**
- Existing test: `mobile/src/features/recipes/screens/__tests__/RecipeDetailScreen.test.tsx`

**Run:**
```bash
cd mobile
npm test -- --runInBand src/features/recipes/screens/__tests__/RecipeDetailScreen.test.tsx
```

**Expected assertions still passing:**
- single add uses cache-aware repository
- add-all preserves `catalogItemId`
- add-all preserves category
- add-all preserves image
- variant ingredient like `Large Eggs` resolves to canonical catalog metadata

---

## Task 6: Visual Preview / Screenshot

**Objective:** Show the redesigned ingredient rows before merging.

**Options:**
1. Preferred if app preview is straightforward:
   - run the Expo web/mock app
   - open a recipe detail page
   - capture screenshot of ingredients tab
2. If app boot/auth is slow or blocked:
   - create a small `.hermes/mockups/recipe-ingredients-images/` HTML mockup matching the implemented row design
   - use browser screenshot for visual review

**Verification checklist:**
- Ingredients tab shows food images for catalog-backed ingredients.
- Fallback rows still look intentional.
- Add All remains visible and compact.
- Cart buttons remain easy to tap.
- No text truncation that hides important ingredient names on common mobile widths.

---

## Task 7: Full Verification Before PR

**Run from `mobile/`:**
```bash
npm test -- --runInBand \
  src/features/recipes/screens/__tests__/RecipeDetailScreen.test.tsx \
  src/features/recipes/components/RecipeIngredients/__tests__/RecipeIngredients.test.tsx
npx tsc --noEmit
```

**Run from repo root:**
```bash
git diff --check
```

**Expected:** all pass.

---

## Files Likely to Change

Primary:
- `mobile/src/features/recipes/components/RecipeIngredients/RecipeIngredients.tsx`
- `mobile/src/features/recipes/components/RecipeIngredients/styles.ts`
- `mobile/src/features/recipes/components/RecipeIngredients/__tests__/RecipeIngredients.test.tsx`
- `mobile/src/features/recipes/screens/RecipeDetailScreen.tsx`
- `mobile/src/features/recipes/screens/__tests__/RecipeDetailScreen.test.tsx`

Possibly, only if needed:
- `mobile/src/common/components/GroceryCard/styles.ts`
- `mobile/src/common/components/GroceryCard/GroceryCardContent.tsx`

Avoid unless necessary:
- Backend recipe APIs
- Shopping service/repository internals
- Global catalog service behavior

---

## Risks / Tradeoffs

1. **Full catalog availability:** recipe detail image enrichment depends on `useCatalog().groceryItems`. If the full catalog is not loaded yet, fallback icons will show until catalog data arrives. This is acceptable initially but should be monitored for perceived loading.
2. **Shared component blast radius:** changing `GroceryCardContent` styles affects shopping, dashboard, and recipe surfaces. Prefer recipe-local styling/wrappers when possible.
3. **RTL:** image/action order must remain sane in RTL. Existing `GroceryCardContent` has RTL handling; tests or visual inspection should include this if the change touches layout direction.
4. **Over-polishing:** keep this as a focused ingredient-row redesign, not a full recipe detail redesign.

---

## Recommended PR Scope

One PR only:
- title: `feat: show recipe ingredient images`
- branch: `feat/recipe-ingredient-images`
- include tests and screenshot in PR description

Do **not** include unrelated `.hermes` mockup files unless explicitly requested.

---

## Suggested Execution Order

1. Checkout `main`, pull latest.
2. Create branch `feat/recipe-ingredient-images`.
3. Add/extend failing component-level tests for `RecipeIngredients` image/fallback rendering.
4. Implement stable image/fallback slot in `RecipeIngredients`.
5. Refactor `RecipeDetailScreen` resolver reuse only if needed and covered by tests.
6. Run targeted tests.
7. Capture visual preview screenshot.
8. Run `npx tsc --noEmit` and `git diff --check`.
9. Commit, push, open PR, wait for checks.
