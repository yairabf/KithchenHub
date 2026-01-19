# Recipes Feature

## Overview

The Recipes feature allows users to browse, search, filter, and create recipes. It displays recipes in a card grid with category filtering and provides a comprehensive recipe creation form with ingredients and step-by-step instructions.

## Screenshots

### Main Recipes View
![Recipes Main](../screenshots/recipes/recipes-main.png)

### Recipe Detail Screen
![Recipe Detail](../screenshots/recipes/recipes-detail.png)

### Add Recipe Modal
![Add Recipe Modal](../screenshots/recipes/recipes-add-modal.png)

## Screens

### RecipesScreen

- **File**: `src/features/recipes/screens/RecipesScreen.tsx`
- **Purpose**: Recipe discovery and creation
- **Key functionality**:
  - Search bar for finding recipes by name
  - Category filter chips (All, Breakfast, Lunch, Dinner, Dessert, Snack)
  - Grid layout displaying recipe cards (2 columns)
  - Floating action button to add new recipes
  - Pastel colors for visual variety

#### Code Snippet - Filtering Logic

```typescript
const filteredRecipes = recipes.filter(recipe => {
  const matchesCategory = selectedCategory === 'All' || recipe.category === selectedCategory;
  const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
  return matchesCategory && matchesSearch;
});
```

#### Code Snippet - Card Width Calculation

```typescript
const { width } = Dimensions.get('window');
const cardWidth = ((width - spacing.lg * 3) / 2) * 0.85;
```

## Components

### RecipeCard

- **File**: `src/features/recipes/components/RecipeCard/`
- **Purpose**: Individual recipe display card
- **Props**:

```typescript
interface RecipeCardProps {
  recipe: Recipe;
  backgroundColor: string;
  onPress: () => void;
  width: number;
}

interface Recipe {
  id: string;
  name: string;
  cookTime: string;
  category: string;
  imageUrl?: string;
}
```

- **Features**:
  - Shows recipe name and cook time
  - Placeholder icon for recipe image
  - Configurable width and background color (pastel)
  - Touch handler for recipe selection

### RecipeSidebar

- **File**: `src/features/recipes/components/RecipeSidebar/`
- **Purpose**: Left sidebar displaying recipe information and ingredients
- **Features**:
  - Recipe category badges
  - Recipe title and description
  - Time and energy (calories) information
  - Ingredients list with quantities
  - "Add All" button to add all ingredients to shopping list
  - Individual add buttons for each ingredient

### IngredientCard

- **File**: `src/features/recipes/components/IngredientCard/`
- **Purpose**: Individual ingredient display with shopping list integration
- **Features**:
  - Ingredient image placeholder
  - Name and quantity display
  - Add to shopping list button
  - Color-coded background

### InstructionStep

- **File**: `src/features/recipes/components/InstructionStep/`
- **Purpose**: Individual recipe instruction step with completion tracking
- **Features**:
  - Step number indicator
  - Instruction text
  - "Mark as finished" toggle
  - Visual feedback for completed steps

### AddRecipeModal

- **File**: `src/features/recipes/components/AddRecipeModal/`
- **Purpose**: Comprehensive recipe creation form
- **Props**:

```typescript
interface AddRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (recipe: NewRecipeData) => void;
  categories?: string[];
  groceryItems?: GroceryItem[];
}

interface NewRecipeData {
  title: string;
  category: string;
  prepTime: string;
  description: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
}

interface Ingredient {
  id: string;
  quantity: string;
  unit: string;
  name: string;
}

interface Instruction {
  id: string;
  text: string;
}
```

- **Features**:
  - Recipe title input
  - Category selection with horizontal scroll
  - Prep time input
  - Description textarea
  - **Ingredients section**:
    - Integrated grocery search bar
    - Quantity, unit, and name inputs for each ingredient
    - Add/remove ingredients
    - Auto-populate from grocery database
  - **Instructions section**:
    - Numbered steps
    - Add/remove step functionality
    - Minimum 1 step required
  - Form validation (title and at least one ingredient required)

## Key Types

```typescript
interface Recipe {
  id: string;
  name: string;
  cookTime: string;
  category: string;
  imageUrl?: string;
}

// Categories available
const recipeCategories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack'];
```

## State Management

- **Local state**:
  - `searchQuery` - Search input text
  - `selectedCategory` - Active category filter
  - `showAddRecipeModal` - Modal visibility
  - `recipes` - Array of Recipe objects

## Key Dependencies

- `@expo/vector-icons` - Ionicons for icons
- `mockGroceriesDB` - For ingredient search in add modal
- `mockRecipes` - Initial recipe data
- `pastelColors` - Theme colors for card backgrounds
- `GrocerySearchBar` - Reused from shopping feature for ingredient search
- `CenteredModal` - Shared modal component
- `FloatingActionButton` - Shared FAB component

## UI Flow

1. User views recipe grid with all recipes
2. Can filter by category chips (All, Breakfast, Lunch, etc.)
3. Can search recipes by name
4. Clicking FAB opens Add Recipe modal
5. In modal, user fills out recipe details:
   - Title (required)
   - Category selection
   - Prep time
   - Description
   - Ingredients (search from database or add custom)
   - Step-by-step instructions
6. Save creates new recipe and adds to grid

## Styling Notes

- Uses `pastelColors` array for card backgrounds (cycles through)
- Grid uses flexWrap with space-between justification
- Cards have calculated width based on screen size
- Bottom padding (120px) for navigation clearance
