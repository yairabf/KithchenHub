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

// Fixed namespace UUID for generating deterministic category UUIDs
const CATEGORY_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

/**
 * Builds category list from grocery items.
 * Generates deterministic localId based on category name for stable references.
 * 
 * @param items - Array of grocery items
 * @returns Array of categories with metadata
 */
export function buildCategoriesFromGroceries(items: GroceryItem[]): Category[] {
  const categoryMap = items.reduce<Record<string, GroceryItem[]>>((acc, item) => {
    const key = item.category || 'Other';
    const existing = acc[key] ?? [];
    return { ...acc, [key]: [...existing, item] };
  }, {});

  return Object.entries(categoryMap).map(([categoryName, categoryItems], index) => {
    const fallbackImage = categoryItems.find(item => item.image)?.image ?? '';
    const categoryId = categoryName.toLowerCase().replace(/\s+/g, '-');
    
    // Generate deterministic UUID based on category name (stable across calls)
    const localId = uuidv5(categoryName, CATEGORY_NAMESPACE);
    
    return {
      id: categoryId,
      localId,
      name: categoryName,
      itemCount: categoryItems.length,
      image: fallbackImage,
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
