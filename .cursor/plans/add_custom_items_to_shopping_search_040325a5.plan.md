---
name: Add Custom Items to Shopping Search
overview: Enable users to add custom grocery items that don't exist in the database through the GrocerySearchBar, similar to how custom chores work. When no search results match, show an "Add custom item" option that can be quick-added with the + button.
todos:
  - id: update-types
    content: Add onCreateCustomItem callback to GrocerySearchBarProps
    status: completed
  - id: enhance-search-logic
    content: Modify search results to show custom item option when no matches
    status: completed
  - id: add-custom-item-ui
    content: Create custom item row UI in dropdown with distinct styling
    status: completed
  - id: wire-up-shopping-screen
    content: Update ShoppingListsScreen to handle custom item creation
    status: completed
---

# Add Custom Item Support to Shopping Search Bar

## Overview

Enable the GrocerySearchBar to support adding custom items that don't exist in the database, matching the pattern used in the ChoresQuickActionModal. When a user searches for an item that has no matches, they'll see an option to add it as a custom item with smart defaults.

## Implementation Steps

### 1. Update GrocerySearchBar Types

**File:** [`src/components/common/GrocerySearchBar/types.ts`](src/components/common/GrocerySearchBar/types.ts)

Add a new optional callback prop to handle custom item creation:

- `onCreateCustomItem?: (itemName: string) => void` - Called when user wants to add a custom item that doesn't exist in the database

### 2. Enhance GrocerySearchBar Component Logic

**File:** [`src/components/common/GrocerySearchBar/GrocerySearchBar.tsx`](src/components/common/GrocerySearchBar/GrocerySearchBar.tsx)

Modify the search results logic to:

- Detect when search query has no matches (searchResults.length === 0 but searchQuery.trim().length > 0)
- Show dropdown even when no database results exist, if there's a search query
- Display a special "Add custom item" row at the top of the dropdown with:
  - A placeholder icon (e.g., generic grocery bag or plus icon)
  - The search query text as the item name
  - "Custom Item" as the category
  - The quick-add + button that calls `onCreateCustomItem` or `onQuickAddItem` with a synthetic GroceryItem

### 3. Update ShoppingListsScreen to Handle Custom Items

**File:** [`src/screens/shopping/ShoppingListsScreen.tsx`](src/screens/shopping/ShoppingListsScreen.tsx)

Modify the GrocerySearchBar usage to:

- Pass a handler for custom item creation
- Generate a unique ID for custom items (e.g., `custom-${Date.now()}`)
- Use smart defaults:
  - **Category:** "Other" or "Custom"
  - **Image:** A placeholder image URL or a generic icon
  - **Default Quantity:** 1
- The existing `handleQuickAddItem` should work seamlessly with custom items since it already accepts GroceryItem objects

### 4. Visual Design for Custom Item Row

The custom item row in the dropdown should be visually distinct:

- Use a dashed border or different background color to indicate it's a custom item
- Show an icon like `add-circle-outline` or a generic grocery bag
- Display text like "Add '{searchQuery}'" to make it clear what will be created
- Include the same + button as regular items for consistency

## Technical Details

### Custom Item Structure

```typescript
const customItem: GroceryItem = {
  id: `custom-${Date.now()}`,
  name: searchQuery.trim(),
  image: 'https://via.placeholder.com/100?text=Custom', // or a default icon
  category: 'Other',
  defaultQuantity: 1
}
```

### Dropdown Display Logic

- If `searchResults.length > 0`: Show database results
- If `searchResults.length === 0` AND `searchQuery.trim().length > 0`: Show "Add custom item" option
- If `searchQuery.trim().length === 0`: Hide dropdown

### User Flow

1. User types "organic quinoa" (not in database)
2. Dropdown shows: "Add 'organic quinoa'" with + button
3. User clicks + button
4. Item is added to the shopping list with quantity 1
5. Subsequent + clicks increment the quantity (existing behavior)
6. Search query remains so user can continue adding items

## Files to Modify

1. [`src/components/common/GrocerySearchBar/types.ts`](src/components/common/GrocerySearchBar/types.ts) - Add onCreateCustomItem prop
2. [`src/components/common/GrocerySearchBar/GrocerySearchBar.tsx`](src/components/common/GrocerySearchBar/GrocerySearchBar.tsx) - Implement custom item UI and logic
3. [`src/screens/shopping/ShoppingListsScreen.tsx`](src/screens/shopping/ShoppingListsScreen.tsx) - Wire up custom item handling

## Testing Checklist

- Search for non-existent item shows "Add custom" option
- Clicking + on custom item adds it to the list
- Multiple clicks on + increment quantity correctly
- Custom items display properly in the shopping list
- Search dropdown stays open after adding custom item
- Custom items can be deleted like regular items