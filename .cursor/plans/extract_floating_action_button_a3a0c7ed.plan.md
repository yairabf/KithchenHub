---
name: Extract Floating Action Button
overview: Create a reusable FloatingActionButton component to replace the duplicate "Add New" pill buttons across ChoresScreen, ShoppingListsScreen, and RecipesScreen.
todos:
  - id: create-component
    content: Create FloatingActionButton component with configurable props
    status: completed
  - id: update-chores
    content: Replace ChoresScreen button with FloatingActionButton
    status: completed
    dependencies:
      - create-component
  - id: update-recipes
    content: Add FloatingActionButton to RecipesScreen
    status: completed
    dependencies:
      - create-component
  - id: update-shopping
    content: Add FloatingActionButton to ShoppingListsScreen
    status: completed
    dependencies:
      - create-component
---

# Extract Floating Action Button Component

## Overview

Extract the "Add New Chore" pill button from [`ChoresScreen.tsx`](src/screens/ChoresScreen.tsx) into a reusable `FloatingActionButton` component that can be used across all screens (Chores, Shopping Lists, and Recipes).

## Current Implementation

The ChoresScreen currently has a custom pill button (lines 278-288) with:

- Positioned absolutely at bottom: 100px (above bottom nav)
- Centered horizontally using transform
- Icon + text layout
- Custom styling with shadows and colors

## Component Design

### FloatingActionButton Props

```typescript
interface FloatingActionButtonProps {
  label: string;              // Button text (e.g., "Add New Chore")
  onPress: () => void;        // Action handler
  iconName?: string;          // Ionicons name (default: "add")
  iconColor?: string;         // Icon color (default: colors.warning)
  bottomOffset?: number;      // Distance from bottom (default: 100)
}
```

### Styling Features

- Consistent positioning and centering logic
- Reusable shadow and elevation styles
- Responsive width (minWidth: 200)
- Uses theme colors from [`src/theme/colors.ts`](src/theme/colors.ts)
- Smooth press feedback (activeOpacity: 0.8)

## Implementation Steps

### 1. Create Component File

- Create [`src/components/common/FloatingActionButton.tsx`](src/components/common/FloatingActionButton.tsx)
- Extract styles from ChoresScreen (lines 487-519)
- Make positioning and colors configurable via props
- Use theme constants for consistency

### 2. Update ChoresScreen

- Import FloatingActionButton
- Replace lines 278-288 with component usage
- Remove styles: `addChorePill`, `addChoreIconContainer`, `addChoreText` (lines 487-519)
- Pass appropriate props (label: "Add New Chore", onPress: onOpenChoresModal)

### 3. Update RecipesScreen

- Import FloatingActionButton
- Replace the header add button (lines 66-68) with FloatingActionButton
- Add appropriate handler for adding recipes
- Use label: "Add New Recipe"

### 4. Update ShoppingListsScreen

- Import FloatingActionButton
- Add FloatingActionButton after the main ScrollView
- Use label: "Add New Item" or "Quick Add"
- Wire to appropriate handler (possibly open search or quick add modal)

## Files to Modify

1. **New file**: [`src/components/common/FloatingActionButton.tsx`](src/components/common/FloatingActionButton.tsx)
2. [`src/screens/ChoresScreen.tsx`](src/screens/ChoresScreen.tsx) - Replace existing button
3. [`src/screens/RecipesScreen.tsx`](src/screens/RecipesScreen.tsx) - Add floating button
4. [`src/screens/shopping/ShoppingListsScreen.tsx`](src/screens/shopping/ShoppingListsScreen.tsx) - Add floating button

## Benefits

- **DRY principle**: Single source of truth for floating action buttons
- **Consistency**: Same look and feel across all screens
- **Maintainability**: Update styling in one place
- **Flexibility**: Configurable props for different use cases
- **Accessibility**: Consistent touch target size and feedback