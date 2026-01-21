import { mockGroceriesDB } from '../data/groceryDatabase';

/**
 * Cache for ingredient name to image URL mappings
 * Prevents repeated database searches for the same ingredients
 */
const imageCache = new Map<string, string | undefined>();

/**
 * Clears the ingredient image cache
 * Should be called when the grocery database is updated
 *
 * @example
 * clearIngredientImageCache();
 */
export function clearIngredientImageCache(): void {
  imageCache.clear();
}

/**
 * Maps an ingredient name to a grocery database image URL
 * Useful for automatically finding images for recipe ingredients
 * Results are cached to improve performance for repeated lookups
 *
 * @param ingredientName - The name of the ingredient (e.g., "Chicken Breast", "Olive Oil")
 * @returns The image URL from the grocery database, or undefined if not found
 *
 * @example
 * const imageUrl = getIngredientImage("Chicken Breast");
 * // Returns: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100'
 */
export function getIngredientImage(ingredientName: string): string | undefined {
  // Normalize ingredient name for better matching
  const normalizedName = ingredientName.toLowerCase().trim();

  // Check cache first
  if (imageCache.has(normalizedName)) {
    return imageCache.get(normalizedName);
  }

  // Try exact match first
  const exactMatch = mockGroceriesDB.find(
    item => item.name.toLowerCase() === normalizedName
  );
  if (exactMatch) {
    const result = exactMatch.image;
    imageCache.set(normalizedName, result);
    return result;
  }

  // Try partial match (ingredient name contains grocery item name or vice versa)
  const partialMatch = mockGroceriesDB.find(item => {
    const itemName = item.name.toLowerCase();
    return normalizedName.includes(itemName) || itemName.includes(normalizedName);
  });

  const result = partialMatch?.image;
  imageCache.set(normalizedName, result);
  return result;
}

/**
 * Maps multiple ingredient names to their grocery database images
 *
 * @param ingredientNames - Array of ingredient names
 * @returns Object mapping ingredient names to image URLs
 *
 * @example
 * const images = getIngredientsImages(["Chicken Breast", "Olive Oil", "Garlic"]);
 * // Returns: { "Chicken Breast": "https://...", "Olive Oil": "https://...", ... }
 */
export function getIngredientsImages(
  ingredientNames: string[]
): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};

  for (const name of ingredientNames) {
    result[name] = getIngredientImage(name);
  }

  return result;
}

/**
 * Finds the closest matching grocery item for an ingredient
 * Returns the full grocery item, not just the image
 *
 * @param ingredientName - The name of the ingredient
 * @returns The matching grocery item, or undefined if not found
 */
export function findGroceryItem(ingredientName: string) {
  const normalizedName = ingredientName.toLowerCase().trim();

  // Try exact match first
  const exactMatch = mockGroceriesDB.find(
    item => item.name.toLowerCase() === normalizedName
  );
  if (exactMatch) {
    return exactMatch;
  }

  // Try partial match
  return mockGroceriesDB.find(item => {
    const itemName = item.name.toLowerCase();
    return normalizedName.includes(itemName) || itemName.includes(normalizedName);
  });
}
