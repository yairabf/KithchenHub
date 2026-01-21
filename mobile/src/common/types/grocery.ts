/**
 * Central type definitions for grocery-related items across the app.
 * This provides a consistent type hierarchy for shopping lists, recipes, and grocery database.
 */

/**
 * Base type for all grocery-related items
 */
export interface BaseGroceryItem {
  id: string;
  name: string;
  category: string;
}

/**
 * Database/catalog item (used in search results, grocery database)
 * Extends base with image and optional default quantity
 */
export interface GroceryItem extends BaseGroceryItem {
  image: string;
  defaultQuantity?: number;
}

/**
 * Shopping list item (numeric quantity)
 * Used in shopping lists with specific quantity and list association
 */
export interface ShoppingItem extends GroceryItem {
  quantity: number;
  listId: string;
}

/**
 * Recipe ingredient (string quantity with unit)
 * Used in recipes where quantity is expressed as a string (e.g., "2.5")
 * with a unit (e.g., "cups", "tsp", "g")
 */
export interface RecipeIngredient extends BaseGroceryItem {
  quantity: string; // "2", "0.5", "1.5"
  unit: string; // "cups", "tsp", "g", "pcs"
  image?: string; // Optional for ingredients
}
