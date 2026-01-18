---
name: Recipe Modal Enhancement
overview: Remove the servings field and integrate the GrocerySearchBar component into the ingredients section of AddRecipeModal, allowing users to search and add ingredients with quantity controls.
todos:
  - id: remove_servings
    content: Remove servings field from AddRecipeModal interface and UI
    status: completed
  - id: import_grocery_search
    content: Import GrocerySearchBar and add groceryItems prop
    status: completed
  - id: add_handlers
    content: Add handleSelectGroceryItem and handleQuickAddGroceryItem functions
    status: completed
  - id: integrate_search_ui
    content: Add GrocerySearchBar component to ingredients section
    status: completed
  - id: update_recipes_screen
    content: Pass groceryItems prop from RecipesScreen to modal
    status: completed
  - id: test_integration
    content: Test the complete flow and verify all functionality works
    status: completed
---

# Recipe Modal Enhancement Plan

## Overview

This plan removes the servings field from the recipe modal and integrates the existing `GrocerySearchBar` component into the ingredients section, enabling users to search and quickly add ingredients.

## Changes Required

### 1. Remove Servings Field

**File:** [`src/components/modals/AddRecipeModal.tsx`](src/components/modals/AddRecipeModal.tsx)

- Remove `servings` property from `NewRecipeData` interface (line 25)
- Remove `servings: ''` from `createEmptyRecipe()` function (line 46)
- Delete the entire "Prep Time & Servings Row" section (lines 197-220)
- Update the "Prep Time" field to be a full-width input instead of half-width

### 2. Integrate GrocerySearchBar into Ingredients Section

**File:** [`src/components/modals/AddRecipeModal.tsx`](src/components/modals/AddRecipeModal.tsx)

**Import the component:**

```typescript
import { GrocerySearchBar, GroceryItem } from '../common/GrocerySearchBar';
```

**Add grocery items data:**

- Since the modal doesn't have access to the shopping list's `mockGroceriesDB`, we need to either:
  - Pass it as a prop to the modal
  - Create a shared grocery database file
  - Use a subset/simplified version

**Recommended approach:** Pass `groceryItems` as a prop to `AddRecipeModalProps`:

```typescript
interface AddRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (recipe: NewRecipeData) => void;
  categories?: string[];
  groceryItems?: GroceryItem[]; // Add this
}
```

**Add handler functions:**

```typescript
const handleSelectGroceryItem = (item: GroceryItem) => {
  // Add new ingredient row with name filled, quantity/unit empty
  setRecipe({
    ...recipe,
    ingredients: [
      ...recipe.ingredients,
      { id: generateId(), quantity: '', unit: '', name: item.name }
    ]
  });
  // Keep search open for rapid addition
};

const handleQuickAddGroceryItem = (item: GroceryItem) => {
  // Same as handleSelectGroceryItem - add with empty quantity/unit
  handleSelectGroceryItem(item);
};
```

**Update Ingredients Section UI (around line 236):**

- Add `GrocerySearchBar` component above the ingredient rows
- Style it to match the modal's design aesthetic
- Use `variant="background"` to match the modal's cream background
- Set `showShadow={false}` for a flatter look inside the modal
```typescript
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Ingredients</Text>
  
  {/* Add Search Bar */}
  <GrocerySearchBar
    items={groceryItems || []}
    onSelectItem={handleSelectGroceryItem}
    onQuickAddItem={handleQuickAddGroceryItem}
    placeholder="Search ingredients to add..."
    variant="background"
    showShadow={false}
    containerStyle={styles.ingredientSearchContainer}
  />
  
  {/* Existing ingredient rows */}
  {recipe.ingredients.map((ing) => (
    // ... existing code
  ))}
  
  {/* Existing "Add Ingredient" button */}
</View>
```


**Add new styles:**

```typescript
ingredientSearchContainer: {
  marginBottom: spacing.md,
},
```

### 3. Update RecipesScreen to Pass Grocery Items

**File:** [`src/screens/RecipesScreen.tsx`](src/screens/RecipesScreen.tsx)

- Import or define the grocery items database
- Pass `groceryItems` prop to `AddRecipeModal`
```typescript
<AddRecipeModal
  visible={showAddModal}
  onClose={() => setShowAddModal(false)}
  onSave={handleAddRecipe}
  groceryItems={mockGroceriesDB} // Pass the grocery database
/>
```


### 4. Consider Creating Shared Grocery Database (Optional but Recommended)

**New File:** `src/data/groceryDatabase.ts`

Extract the `mockGroceriesDB` from `ShoppingListsScreen.tsx` into a shared file that can be imported by both the shopping screen and recipes screen. This promotes code reuse and maintains a single source of truth.

## Visual Flow

```
┌─────────────────────────────────────┐
│     Add Recipe Modal                │
├─────────────────────────────────────┤
│ Recipe Title: [____________]        │
│                                     │
│ Category: [Breakfast][Lunch]...     │
│                                     │
│ Prep Time: [____________]           │  ← Full width now
│                                     │
│ Description: [____________]         │
│                                     │
│ ═══════════════════════════════════ │
│ Ingredients                         │
│ ┌─────────────────────────────────┐ │
│ │ 🔍 Search ingredients to add... │ │  ← NEW: Search bar
│ │   ┌─────────────────────────┐   │ │
│ │   │ Tomatoes    [Vegetables]│ + │ │  ← Dropdown results
│ │   │ Cherry Tomatoes [Veg]   │ + │ │
│ │   └─────────────────────────┘   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [2] [cups] [Flour]           [🗑]  │  ← Existing rows
│ [3] [cloves] [Garlic]        [🗑]  │
│ [__] [__] [Tomatoes]         [🗑]  │  ← NEW: Added from search
│                                     │
│ [+ Add Ingredient]                  │
│                                     │
│ Steps                               │
│ ...                                 │
└─────────────────────────────────────┘
```

## Testing Checklist

- [ ] Servings field is completely removed from the modal
- [ ] Prep Time field is now full-width
- [ ] Search bar appears in ingredients section
- [ ] Searching for ingredients shows dropdown results
- [ ] Clicking '+' on a search result adds a new ingredient row with the name filled
- [ ] Quantity and unit fields are empty when added from search
- [ ] Search query stays intact after adding an ingredient (for rapid addition)
- [ ] Manual "Add Ingredient" button still works
- [ ] Can still manually type ingredients without using search
- [ ] Remove button works on all ingredient rows
- [ ] Modal validation still works correctly
- [ ] Saved recipes don't include servings data