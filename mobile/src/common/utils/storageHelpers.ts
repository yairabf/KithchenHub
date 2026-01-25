/**
 * Storage Helpers
 * 
 * Shared utilities for reading and normalizing persisted data from AsyncStorage.
 * Centralizes common operations to avoid code duplication.
 */

import { EntityTimestamps, fromPersistedTimestamps } from '../types/entityMetadata';

/**
 * Normalizes a persisted array from storage
 * 
 * Handles parsing JSON, validating array structure, and converting timestamps
 * from persisted format (ISO strings) to in-memory format (Date objects).
 * 
 * @template T - Entity type extending EntityTimestamps
 * @param value - Raw JSON string from storage, or null if not found
 * @param key - Storage key (for error messages)
 * @returns Array of normalized entities, or empty array if invalid/missing
 * 
 * @example
 * ```typescript
 * const raw = await AsyncStorage.getItem('@kitchen_hub_cache_recipes');
 * const recipes = normalizePersistedArray<Recipe>(raw, '@kitchen_hub_cache_recipes');
 * ```
 */
export function normalizePersistedArray<T extends EntityTimestamps>(
  value: string | null,
  key: string
): T[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      console.error(`Invalid cached data format in ${key}: expected array, got ${typeof parsed}`);
      return [];
    }

    const validItems = parsed.filter((item): item is Record<string, unknown> => {
      if (item === null || typeof item !== 'object') {
        return false;
      }
      // Validate required fields for EntityTimestamps
      if (typeof item.id !== 'string' || item.id.trim() === '') {
        console.warn(`Skipping entity in ${key}: missing or invalid id`);
        return false;
      }
      return true;
    });

    return validItems.map((item) => fromPersistedTimestamps(item) as T);
  } catch (error) {
    console.error(`Error parsing cached data from ${key}:`, error);
    return [];
  }
}
