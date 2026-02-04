import { GroceryItem } from './types';

/**
 * Determines the match type for an item name against a search query.
 * 
 * @param itemName - The item name to check
 * @param query - Normalized search query (lowercase, trimmed)
 * @returns 'exact' if name exactly matches query, 'starts-with' if name starts with query, 'partial' otherwise
 */
function getMatchType(itemName: string, query: string): 'exact' | 'starts-with' | 'partial' {
  const normalizedName = itemName.toLowerCase();
  if (normalizedName === query) return 'exact';
  if (normalizedName.startsWith(query)) return 'starts-with';
  return 'partial';
}

/**
 * Gets the sort priority for a grocery item based on match type and whether it's custom.
 * Lower priority numbers appear first in sorted results.
 * 
 * Priority order:
 * - 0: Exact match custom items
 * - 1: Exact match catalog items
 * - 2: Starts-with match custom items
 * - 3: Starts-with match catalog items
 * - 4: Partial match custom items
 * - 5: Partial match catalog items
 * 
 * @param item - The grocery item to prioritize
 * @param query - Normalized search query (lowercase, trimmed)
 * @returns Priority number (lower = higher priority)
 */
function getItemSortPriority(item: GroceryItem, query: string): number {
  const matchType = getMatchType(item.name, query);
  const isCustom = item.id.startsWith('custom-');
  
  // Base priority: exact (0-1), starts-with (2-3), partial (4-5)
  const basePriority = matchType === 'exact' ? 0 : matchType === 'starts-with' ? 2 : 4;
  // Custom items get lower priority number (appear first)
  return basePriority + (isCustom ? 0 : 1);
}

/**
 * Compares two grocery items for search result sorting.
 * 
 * Priority order:
 * 1. Exact name matches (custom items first, then catalog items)
 * 2. Names starting with query (custom items first, then catalog items)
 * 3. Other partial matches (custom items first, then catalog items)
 * 4. Alphabetical by name within same priority group
 * 
 * @param a - First item to compare
 * @param b - Second item to compare
 * @param query - Normalized search query (lowercase, trimmed)
 * @returns Negative if a should come before b, positive if after, 0 if equal
 */
export function compareGroceryItemsForSearch(
  a: GroceryItem,
  b: GroceryItem,
  query: string
): number {
  const priorityA = getItemSortPriority(a, query);
  const priorityB = getItemSortPriority(b, query);
  
  // If priorities differ, sort by priority
  if (priorityA !== priorityB) {
    return priorityA - priorityB;
  }
  
  // Same priority - sort alphabetically by name, then by ID for stability
  const nameComparison = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  if (nameComparison !== 0) {
    return nameComparison;
  }
  
  // Names are identical - sort by ID for stable ordering
  return a.id.localeCompare(b.id);
}
