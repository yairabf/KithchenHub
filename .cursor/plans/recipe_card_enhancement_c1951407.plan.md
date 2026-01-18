---
name: Recipe Card Enhancement
overview: Extract recipe card into a reusable component, reduce card width by 15%, and add pastel color backgrounds similar to the chores list.
todos:
  - id: create-recipe-card
    content: Create RecipeCard component with pastel background support
    status: completed
  - id: update-recipes-screen
    content: Update RecipesScreen to use RecipeCard with reduced width and pastel colors
    status: completed
    dependencies:
      - create-recipe-card
  - id: create-index-export
    content: Create index.ts for recipes components
    status: completed
    dependencies:
      - create-recipe-card
---

# Recipe Card Enhancement Plan

## Overview

Improve the Recipes screen by creating a dedicated RecipeCard component, adjusting card dimensions, and adding colorful pastel backgrounds similar to the chores list styling.

## Changes

### 1. Create RecipeCard Component

**File**: `src/components/recipes/RecipeCard.tsx` (new file)

- Extract the recipe card UI from [`src/screens/RecipesScreen.tsx`](src/screens/RecipesScreen.tsx) (lines 101-114)
- Create a reusable component that accepts:
- `recipe` object (id, name, cookTime, category, imageUrl)
- `backgroundColor` prop for pastel colors
- `onPress` callback for tap interactions
- Include the recipe image placeholder, name, and cook time metadata
- Apply the provided background color to the card

### 2. Update RecipesScreen

**File**: [`src/screens/RecipesScreen.tsx`](src/screens/RecipesScreen.tsx)

- Import `pastelColors` from theme (already available in colors.ts)
- Import the new RecipeCard component
- Update the card width calculation: reduce from current `(width - spacing.lg * 3) / 2` to `(width - spacing.lg * 3) / 2 * 0.85` (15% smaller)
- Replace inline recipe card rendering with RecipeCard component
- Apply pastel colors using index-based rotation: `pastelColors[index % pastelColors.length]`
- Remove old recipe card styles from StyleSheet

### 3. Create Index Export

**File**: `src/components/recipes/index.ts` (new file)

- Export RecipeCard for clean imports

## Implementation Details

**Color Application**: Use the same pastel color array from [`src/theme/colors.ts`](src/theme/colors.ts) (lines 78-85) that's used in the chores screen. Each recipe card will get a different pastel background based on its index position.

**Card Width**: Current calculation is `(width - spacing.lg * 3) / 2`. New calculation will be `(width - spacing.lg * 3) / 2 * 0.85`, making cards 15% narrower while maintaining the two-column grid layout.

**Styling Consistency**: The RecipeCard will follow the same pattern as SwipeableChoreCard, with rounded corners, shadows, and pastel backgrounds for visual cohesion across the app.