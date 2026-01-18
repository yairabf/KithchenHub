---
name: Standardize Add Item Modals
overview: Align all add item modals (groceries, chores, recipes) to use a consistent centered card design with uniform layout, sizing, styling, and animations.
todos:
  - id: create-centered-modal
    content: Create reusable CenteredModal component with standard layout
    status: completed
  - id: refactor-shopping-quick-action
    content: Refactor ShoppingQuickActionModal to use CenteredModal
    status: completed
    dependencies:
      - create-centered-modal
  - id: refactor-shopping-lists-screen
    content: Refactor ShoppingListsScreen quantity modal to use CenteredModal
    status: completed
    dependencies:
      - create-centered-modal
  - id: refactor-chores-modal
    content: Convert ChoresQuickActionModal from bottom sheet to CenteredModal
    status: completed
    dependencies:
      - create-centered-modal
  - id: update-exports
    content: Update modal exports in index.ts
    status: completed
    dependencies:
      - create-centered-modal
  - id: test-all-modals
    content: Verify all modals work correctly with consistent styling
    status: completed
    dependencies:
      - refactor-shopping-quick-action
      - refactor-shopping-lists-screen
      - refactor-chores-modal
---

# Standardize Add Item Modals

## Overview

Create a unified design system for all add item modals across the app (shopping/groceries, chores, and recipes). All modals will follow the centered card pattern currently used in the ShoppingQuickActionModal's quantity modal.

## Current State Analysis

### Existing Modals to Standardize:

1. **[src/components/modals/ShoppingQuickActionModal.tsx](src/components/modals/ShoppingQuickActionModal.tsx)** - Quantity modal (lines 370-441) - Already uses centered card design
2. **[src/screens/shopping/ShoppingListsScreen.tsx](src/screens/shopping/ShoppingListsScreen.tsx)** - Quantity modal (lines 642-718) - Uses centered card but different styling
3. **[src/components/modals/ChoresQuickActionModal.tsx](src/components/modals/ChoresQuickActionModal.tsx)** - Currently a bottom sheet, needs conversion to centered card

## Design Specifications

### Standard Modal Properties:

- **Position**: Centered on screen
- **Width**: 85% of screen width, max 400px
- **Background**: `colors.surface` with `borderRadius.xxl`
- **Padding**: `spacing.lg`
- **Backdrop**: `colors.backdrop` with fade animation
- **Animation**: Fade in/out with scale effect

### Standard Layout Structure:

1. **Header Section**:

- Title (18px, fontWeight 700)
- Close button (top-right, Ionicons "close", 24px)
- Flex row with space-between

2. **Content Section**:

- Item display (if applicable): image + name + category
- Input fields or controls
- Consistent spacing using `spacing.lg` between sections

3. **Action Buttons**:

- Two-button layout: Cancel (left) + Primary Action (right)
- Cancel: Border style with `colors.border`
- Primary: Filled with context color (shopping/chores/recipes)
- Both buttons: `borderRadius.lg`, `spacing.md` vertical padding

## Implementation Plan

### 1. Create Shared Modal Component

Create [`src/components/common/CenteredModal.tsx`](src/components/common/CenteredModal.tsx) - A reusable centered modal wrapper with:

- Backdrop with fade animation
- Centered content container with standard sizing
- Standard header with title and close button
- Children render area for custom content
- Standard action buttons section

### 2. Update ShoppingQuickActionModal

- Extract quantity modal to use new CenteredModal component
- Ensure styling matches standard specifications
- Keep existing functionality intact

### 3. Update ShoppingListsScreen Quantity Modal

- Replace current modalContent styling with CenteredModal component
- Align button styling with standard specifications
- Update animations to match fade/scale pattern

### 4. Update ChoresQuickActionModal

- Convert from bottom sheet to centered card using CenteredModal
- Restructure layout to match standard format
- Update animations from translateY to fade/scale
- Maintain existing chore add functionality

### 5. Prepare for Future Recipe Modal

- Ensure CenteredModal is flexible enough for recipe add forms
- Document usage patterns in component comments

## Files to Modify

1. [`src/components/common/CenteredModal.tsx`](src/components/common/CenteredModal.tsx) - CREATE
2. [`src/components/modals/ShoppingQuickActionModal.tsx`](src/components/modals/ShoppingQuickActionModal.tsx) - REFACTOR
3. [`src/screens/shopping/ShoppingListsScreen.tsx`](src/screens/shopping/ShoppingListsScreen.tsx) - REFACTOR
4. [`src/components/modals/ChoresQuickActionModal.tsx`](src/components/modals/ChoresQuickActionModal.tsx) - REFACTOR
5. [`src/components/modals/index.ts`](src/components/modals/index.ts) - UPDATE exports

## Success Criteria

- All add item modals use identical positioning (centered)
- All modals have consistent dimensions (85% width, max 400px)
- All modals use the same animation pattern (fade + scale)
- All modals follow the same layout structure (header, content, actions)
- All modals use consistent spacing and styling from theme
- No functionality is broken in the refactoring process