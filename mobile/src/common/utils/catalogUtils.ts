/**
 * Catalog Utilities
 * 
 * Shared utilities for catalog data transformation.
 * Used by catalog service and hooks to build categories and frequently added items.
 */

import { v5 as uuidv5 } from 'uuid';
import type { GroceryItem } from '../../features/shopping/components/GrocerySearchBar';
import type { Category } from '../../mocks/shopping';
import { pastelColors } from '../../theme';
import { isValidImageUrl } from './imageUtils';

// Fixed namespace UUID for generating deterministic category UUIDs
const CATEGORY_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * Normalizes deprecated category names to consolidated category names.
 * 
 * Maps legacy category names to their consolidated equivalents:
 * - "teas" → "beverages"
 * - "oils" → "condiments"
 * - "sweets" → "bakery"
 * - "supplies" → "household"
 * 
 * The normalization is case-insensitive and trims whitespace.
 * Categories not in the mapping are returned as-is (normalized to lowercase).
 * 
 * @param categoryName - Category name to normalize (case-insensitive)
 * @returns Normalized category name in lowercase, or mapped equivalent if deprecated
 * 
 * @example
 * normalizeCategoryName('Teas') // Returns 'beverages'
 * normalizeCategoryName('FRUITS') // Returns 'fruits'
 * normalizeCategoryName('  oils  ') // Returns 'condiments'
 */
function normalizeCategoryName(categoryName: string): string {
  const normalized = categoryName.toLowerCase().trim();

  // Map deprecated categories to consolidated ones
  const categoryMapping: Record<string, string> = {
    'teas': 'beverages',
    'oils': 'condiments',
    'sweets': 'bakery', // Default sweets to bakery (cakes, cookies, brownies)
    'supplies': 'household', // Supplies merged into household
  };

  return categoryMapping[normalized] || normalized;
}

/**
 * Builds category list from grocery items.
 * Generates deterministic localId based on category name for stable references.
 * Normalizes category names to lowercase to prevent duplicates.
 * Maps deprecated category names to consolidated categories.
 * 
 * @param items - Array of grocery items
 * @returns Array of categories with metadata (deduplicated)
 */
export function buildCategoriesFromGroceries(items: GroceryItem[]): Category[] {

  // Normalize category names to lowercase and map deprecated categories
  const categoryMap = items.reduce<Record<string, GroceryItem[]>>((acc, item) => {
    const originalCategory = (item.category || 'Other').toLowerCase();
    const normalizedCategory = normalizeCategoryName(originalCategory);
    const existing = acc[normalizedCategory] ?? [];
    return { ...acc, [normalizedCategory]: [...existing, item] };
  }, {});

  // Build categories array and deduplicate by ID
  const categoriesArray = Object.entries(categoryMap).map(([categoryNameLower, categoryItems], index) => {
    // Use normalized lowercase name for ID, but capitalize first letter for display
    const displayName = categoryNameLower.charAt(0).toUpperCase() + categoryNameLower.slice(1);
    const categoryId = categoryNameLower.replace(/\s+/g, '-');

    // Generate deterministic UUID based on normalized category name (stable across calls)
    const localId = uuidv5(categoryNameLower, CATEGORY_NAMESPACE);

    return {
      id: categoryId,
      localId,
      name: displayName,
      itemCount: categoryItems.length,
      image: '', // Empty - CategoriesGrid will use icon assets based on categoryId
      backgroundColor: pastelColors[index % pastelColors.length],
    };
  });

  // Deduplicate by category ID (in case of any edge cases)
  const seenIds = new Set<string>();
  const deduplicated = categoriesArray.filter(cat => {
    if (seenIds.has(cat.id)) {
      return false;
    }
    seenIds.add(cat.id);
    return true;
  });

  return deduplicated;
}

/**
 * Builds category list from category names (string[]).
 * Used when full catalog is not available (lite load).
 * 
 * @param names - Array of category names
 * @returns Array of categories with metadata
 */
export function buildCategoriesFromNames(names: string[]): Category[] {
  // Deduplicate and normalize input names first
  const uniqueNames = Array.from(new Set(names.map(n => normalizeCategoryName(n))));

  return uniqueNames.map((categoryNameLower, index) => {
    // Use normalized lowercase name for ID, but capitalize first letter for display
    const displayName = categoryNameLower.charAt(0).toUpperCase() + categoryNameLower.slice(1);
    const categoryId = categoryNameLower.replace(/\s+/g, '-');

    // Generate deterministic UUID based on normalized category name
    const localId = uuidv5(categoryNameLower, CATEGORY_NAMESPACE);

    return {
      id: categoryId,
      localId,
      name: displayName,
      itemCount: 0, // Count not available in lite mode
      image: '',
      backgroundColor: pastelColors[index % pastelColors.length],
    };
  });
}

/**
 * Default limit for frequently added items
 */
const DEFAULT_FREQUENTLY_ADDED_LIMIT = 8;

/**
 * Builds frequently added items list (first N items from catalog).
 * 
 * @param items - Array of grocery items
 * @param limit - Maximum number of items to return (default: 8)
 * @returns Array of frequently added items
 */
export function buildFrequentlyAddedItems(
  items: GroceryItem[],
  limit: number = DEFAULT_FREQUENTLY_ADDED_LIMIT
): GroceryItem[] {
  return items.slice(0, limit);
}
