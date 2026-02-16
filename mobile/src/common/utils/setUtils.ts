/**
 * Utility functions for working with Sets in React state.
 * Provides pure, immutable operations for Set manipulation.
 */

/**
 * Toggles an item in a Set immutably.
 * 
 * If the item exists in the Set, it will be removed.
 * If the item doesn't exist, it will be added.
 * 
 * @template T - The type of items in the Set
 * @param set - The original Set (will not be mutated)
 * @param item - The item to toggle
 * @returns A new Set with the item toggled
 * 
 * @example
 * const categories = new Set(['fruits', 'vegetables']);
 * const updated = toggleSetItem(categories, 'fruits');
 * // Result: Set(['vegetables'])
 * 
 * @example
 * const categories = new Set(['fruits']);
 * const updated = toggleSetItem(categories, 'dairy');
 * // Result: Set(['fruits', 'dairy'])
 */
export function toggleSetItem<T>(set: Set<T>, item: T): Set<T> {
  const updated = new Set(set);
  updated.has(item) ? updated.delete(item) : updated.add(item);
  return updated;
}

/**
 * Adds an item to a Set immutably.
 * 
 * @template T - The type of items in the Set
 * @param set - The original Set (will not be mutated)
 * @param item - The item to add
 * @returns A new Set with the item added
 */
export function addToSet<T>(set: Set<T>, item: T): Set<T> {
  const updated = new Set(set);
  updated.add(item);
  return updated;
}

/**
 * Removes an item from a Set immutably.
 * 
 * @template T - The type of items in the Set
 * @param set - The original Set (will not be mutated)
 * @param item - The item to remove
 * @returns A new Set with the item removed
 */
export function removeFromSet<T>(set: Set<T>, item: T): Set<T> {
  const updated = new Set(set);
  updated.delete(item);
  return updated;
}
