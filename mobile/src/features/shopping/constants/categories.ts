/**
 * Shopping Categories Constants
 * 
 * Defines the available shopping categories for custom items.
 * Categories match backend API response format and i18n keys.
 */

/**
 * Default fallback category for custom items
 */
export const DEFAULT_CATEGORY = 'Other';

/**
 * Shopping category IDs matching backend API and i18n keys.
 * These correspond to categories in the i18n locale files.
 */
export const SHOPPING_CATEGORIES = [
  'fruits',
  'vegetables',
  'dairy',
  'meat',
  'seafood',
  'bakery',
  'grains',
  'snacks',
  'nuts',
  DEFAULT_CATEGORY.toLowerCase(), // 'other'
] as const;

/**
 * Type for shopping category IDs
 */
export type ShoppingCategory = typeof SHOPPING_CATEGORIES[number];

/**
 * Type guard to check if a string is a valid shopping category
 * 
 * @param category - String to validate
 * @returns True if category is valid
 */
export function isValidShoppingCategory(category: string): category is ShoppingCategory {
  return (SHOPPING_CATEGORIES as readonly string[]).includes(category);
}

/**
 * Normalizes a category string to a valid shopping category
 * Converts to lowercase and returns default if invalid
 * 
 * @param category - Category string to normalize
 * @returns Valid shopping category
 */
export function normalizeShoppingCategory(category: string | null | undefined): ShoppingCategory {
  if (!category) {
    return DEFAULT_CATEGORY.toLowerCase() as ShoppingCategory;
  }
  
  const normalized = category.toLowerCase();
  return isValidShoppingCategory(normalized) 
    ? normalized 
    : (DEFAULT_CATEGORY.toLowerCase() as ShoppingCategory);
}
