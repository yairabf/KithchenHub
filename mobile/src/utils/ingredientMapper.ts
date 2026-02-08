import { catalogService } from '../common/services/catalogService';
import type { GroceryItem } from '../features/shopping/components/GrocerySearchBar';

/**
 * Cache for ingredient name to image URL mappings
 * Prevents repeated database searches for the same ingredients
 */
const imageCache = new Map<string, string | undefined>();



/**
 * Clears the local grocery items cache.
 * Useful for forcing a fresh fetch on next call.
 * 
 * @example
 * ```typescript
 * clearIngredientImageCache();
 * clearGroceryItemsCache(); // Force fresh catalog fetch
 * ```
 */


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
 * Clears all caches (grocery items and ingredient images).
 * Useful for forcing a fresh fetch on next call.
 * 
 * @example
 * ```typescript
 * clearAllCaches(); // Force fresh catalog fetch and clear image cache
 * ```
 */
export function clearAllCaches(): void {
  imageCache.clear();
}

/**
 * Maps an ingredient name to a grocery database image URL.
 * 
 * **IMPORTANT:** This function is async and must be awaited.
 * Future consumers must use: `await getIngredientImage(name)`
 * 
 * Useful for automatically finding images for recipe ingredients.
 * Results are cached to improve performance for repeated lookups.
 * 
 * @param ingredientName - The name of the ingredient (e.g., "Chicken Breast", "Olive Oil")
 * @returns Promise resolving to the image URL from the grocery database, or undefined if not found
 * 
 * @example
 * ```typescript
 * const imageUrl = await getIngredientImage("Chicken Breast");
 * // Returns: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100'
 * ```
 */
export async function getIngredientImage(ingredientName: string): Promise<string | undefined> {
  // Input validation
  if (!ingredientName || typeof ingredientName !== 'string') {
    return undefined;
  }

  // Normalize ingredient name for better matching
  const normalizedName = ingredientName.toLowerCase().trim();

  // Return undefined for empty strings after normalization
  if (!normalizedName) {
    return undefined;
  }

  // Check cache first
  if (imageCache.has(normalizedName)) {
    return imageCache.get(normalizedName);
  }

  // Perform on-demand search
  try {
    const searchResults = await catalogService.searchGroceries(normalizedName);

    if (searchResults.length === 0) {
      imageCache.set(normalizedName, undefined);
      return undefined;
    }

    // Try exact match first
    const exactMatch = searchResults.find(
      item => item.name.toLowerCase() === normalizedName
    );

    if (exactMatch) {
      const result = exactMatch.image;
      imageCache.set(normalizedName, result);
      return result;
    }

    // Fallback to first result (search relevance)
    const result = searchResults[0].image;
    imageCache.set(normalizedName, result);
    return result;
  } catch (error) {
    console.error(`Failed to find image for ingredient: ${normalizedName}`, error);
    return undefined;
  }
}

/**
 * Maps multiple ingredient names to their grocery database images.
 * 
 * **IMPORTANT:** This function is async and must be awaited.
 * Future consumers must use: `await getIngredientsImages(names)`
 * 
 * Processes items in parallel for better performance after ensuring
 * grocery items are loaded (single async call with caching).
 * 
 * @param ingredientNames - Array of ingredient names
 * @returns Promise resolving to object mapping ingredient names to image URLs
 * 
 * @example
 * ```typescript
 * const images = await getIngredientsImages(["Chicken Breast", "Olive Oil", "Garlic"]);
 * // Returns: { "Chicken Breast": "https://...", "Olive Oil": "https://...", ... }
 * ```
 */
export async function getIngredientsImages(
  ingredientNames: string[]
): Promise<Record<string, string | undefined>> {
  // Input validation
  if (!Array.isArray(ingredientNames) || ingredientNames.length === 0) {
    return {};
  }



  // Process in parallel since cache is populated
  const results = await Promise.all(
    ingredientNames.map(name => getIngredientImage(name))
  );

  // Build result object
  return ingredientNames.reduce((acc, name, index) => {
    acc[name] = results[index];
    return acc;
  }, {} as Record<string, string | undefined>);
}

/**
 * Finds the closest matching grocery item for an ingredient.
 * Returns the full grocery item, not just the image.
 * 
 * **IMPORTANT:** This function is async and must be awaited.
 * Future consumers must use: `await findGroceryItem(name)`
 * 
 * @param ingredientName - The name of the ingredient
 * @returns Promise resolving to the matching grocery item, or undefined if not found
 * 
 * @example
 * ```typescript
 * const item = await findGroceryItem("Chicken Breast");
 * // Returns: { id: "...", name: "Chicken Breast", image: "...", ... }
 * ```
 */
export async function findGroceryItem(ingredientName: string): Promise<GroceryItem | undefined> {
  // Input validation
  if (!ingredientName || typeof ingredientName !== 'string') {
    return undefined;
  }

  // Normalize ingredient name for better matching
  const normalizedName = ingredientName.toLowerCase().trim();

  // Return undefined for empty strings after normalization
  if (!normalizedName) {
    return undefined;
  }

  // Perform on-demand search
  try {
    const searchResults = await catalogService.searchGroceries(normalizedName);

    if (searchResults.length === 0) {
      return undefined;
    }

    // Try exact match first
    const exactMatch = searchResults.find(
      item => item.name.toLowerCase() === normalizedName
    );
    if (exactMatch) {
      return exactMatch;
    }

    // Fallback to first result
    return searchResults[0];
  } catch (error) {
    console.error(`Failed to find grocery item: ${normalizedName}`, error);
    return undefined;
  }
}
