import { catalogService } from '../common/services/catalogService';
import type { GroceryItem } from '../features/shopping/components/GrocerySearchBar';

/**
 * Local cache for grocery items to prevent repeated async calls.
 * Cached on first access and reused for subsequent function calls.
 */
let cachedItems: GroceryItem[] | null = null;

/**
 * Promise-based cache to prevent race conditions when multiple concurrent calls
 * are made before the first call completes.
 */
let cachedItemsPromise: Promise<GroceryItem[]> | null = null;

/**
 * Cache for ingredient name to image URL mappings
 * Prevents repeated database searches for the same ingredients
 */
const imageCache = new Map<string, string | undefined>();

/**
 * Gets grocery items, using local cache if available.
 * Uses promise-based caching to prevent race conditions when called concurrently.
 * This prevents repeated async calls when ingredientMapper functions
 * are called multiple times (e.g., in loops).
 * 
 * @returns Promise resolving to array of grocery items (never empty - falls back to empty array on error)
 */
async function getCachedGroceryItems(): Promise<GroceryItem[]> {
  // Return cached items if available
  if (cachedItems) {
    return cachedItems;
  }

  // Return existing promise if already loading (prevents race conditions)
  if (cachedItemsPromise) {
    return cachedItemsPromise;
  }

  // Create new promise and cache it
  cachedItemsPromise = catalogService
    .getGroceryItems()
    .then(items => {
      cachedItems = items;
      cachedItemsPromise = null; // Clear promise after completion
      return items;
    })
    .catch(error => {
      console.error('Failed to fetch grocery items from catalog service:', error);
      // Return empty array as fallback to prevent complete failure
      cachedItems = [];
      cachedItemsPromise = null; // Clear promise on error
      return cachedItems;
    });

  return cachedItemsPromise;
}

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
export function clearGroceryItemsCache(): void {
  cachedItems = null;
  cachedItemsPromise = null;
}

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
  cachedItems = null;
  cachedItemsPromise = null;
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

  // Get grocery items from catalog service (with local cache and error handling)
  const groceryItems = await getCachedGroceryItems();

  // Return undefined if no items available (error case)
  if (groceryItems.length === 0) {
    return undefined;
  }

  // Try exact match first
  const exactMatch = groceryItems.find(
    item => item.name.toLowerCase() === normalizedName
  );
  if (exactMatch) {
    const result = exactMatch.image;
    imageCache.set(normalizedName, result);
    return result;
  }

  // Try partial match (ingredient name contains grocery item name or vice versa)
  const partialMatch = groceryItems.find(item => {
    const itemName = item.name.toLowerCase();
    return normalizedName.includes(itemName) || itemName.includes(normalizedName);
  });

  const result = partialMatch?.image;
  imageCache.set(normalizedName, result);
  return result;
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

  // Ensure grocery items are loaded first (single async call with caching)
  await getCachedGroceryItems();

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

  // Get grocery items from catalog service (with local cache and error handling)
  const groceryItems = await getCachedGroceryItems();

  // Return undefined if no items available (error case)
  if (groceryItems.length === 0) {
    return undefined;
  }

  // Try exact match first
  const exactMatch = groceryItems.find(
    item => item.name.toLowerCase() === normalizedName
  );
  if (exactMatch) {
    return exactMatch;
  }

  // Try partial match
  return groceryItems.find(item => {
    const itemName = item.name.toLowerCase();
    return normalizedName.includes(itemName) || itemName.includes(normalizedName);
  });
}
