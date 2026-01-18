---
name: Chore Auto-completion Feature
overview: Add auto-completion functionality to the chore input field, similar to the grocery item search. When users type a chore name, they'll see suggestions from a predefined database of common household chores with icons.
todos:
  - id: create-chore-db
    content: Create ChoreTemplate interface and mockChoresDB with common chores
    status: completed
  - id: add-search-state
    content: Add search state variables and refs to ChoresQuickActionModal
    status: completed
  - id: implement-search-logic
    content: Add useEffect for debounced search filtering
    status: completed
  - id: build-dropdown-ui
    content: Create search dropdown UI component with results
    status: completed
  - id: handle-selection
    content: Implement handleSelectChoreTemplate function
    status: completed
  - id: update-add-logic
    content: Update handleAddChore to include selected icon
    status: completed
---

# Add Chore Auto-completion Feature

## Overview

Implement auto-completion for chores in the ChoresQuickActionModal, mirroring the grocery item search functionality. Users will see a dropdown of matching chores as they type, with icons for quick visual recognition.

## Implementation Steps

### 1. Create Chore Database

Create a predefined database of common household chores in [`src/components/modals/ChoresQuickActionModal.tsx`](src/components/modals/ChoresQuickActionModal.tsx), similar to `mockGroceriesDB` in the shopping components.

**Structure:**

```typescript
interface ChoreTemplate {
  id: string;
  name: string;
  icon: string; // emoji
  category: string; // e.g., "Kitchen", "Bathroom", "General"
}
```

**Include common chores like:**

- Kitchen: Wash dishes, Clean counters, Mop floor, Take out trash
- Bathroom: Clean toilet, Scrub shower, Wipe mirrors
- Bedroom: Make bed, Fold laundry, Vacuum
- Living areas: Vacuum, Dust furniture, Organize
- Outdoor: Water plants, Mow lawn, Sweep porch

### 2. Add Search State Management

In [`src/components/modals/ChoresQuickActionModal.tsx`](src/components/modals/ChoresQuickActionModal.tsx), add:

- `searchResults` state to store filtered chore templates
- `showSearchDropdown` state to control dropdown visibility
- `searchTimeoutRef` for debounced search (300ms delay)

### 3. Implement Search Logic

Add a `useEffect` hook that:

- Filters `mockChoresDB` based on `newChoreText` input
- Uses `startsWith` matching (case-insensitive) like the grocery search
- Debounces search by 300ms to avoid excessive filtering
- Shows dropdown only when results exist and query length > 0

### 4. Create Search Dropdown UI

Add a dropdown component below the input field that:

- Displays filtered chore templates with icon and name
- Positioned absolutely below the input (similar to grocery search)
- Scrollable if many results
- Each item is touchable and calls `handleSelectChoreTemplate`
- Includes a close/clear button when search is active

### 5. Handle Template Selection

When user selects a chore template:

- Pre-fill `newChoreText` with the chore name
- Store the selected icon for use when creating the chore
- Close the dropdown
- Keep focus on input for further editing if needed

### 6. Update Add Chore Logic

Modify `handleAddChore` to:

- Include the selected icon when creating a new chore
- Default to 📋 emoji if no icon selected (manual entry)

## Key Files to Modify

- [`src/components/modals/ChoresQuickActionModal.tsx`](src/components/modals/ChoresQuickActionModal.tsx) - Main implementation
- Leverage existing patterns from [`src/components/modals/ShoppingQuickActionModal.tsx`](src/components/modals/ShoppingQuickActionModal.tsx)

## Technical Notes

- Follow the exact same pattern as grocery auto-completion for consistency
- Use `keyboardShouldPersistTaps="handled"` on dropdown ScrollView
- Match styling to existing modal design (colors, spacing, borderRadius)
- Ensure dropdown appears above other modal content with proper z-index