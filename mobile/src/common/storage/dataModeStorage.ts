/**
 * Data Mode Storage Utilities
 * 
 * This module provides storage key management and validation for the three data modes:
 * - Guest Mode: `@kitchen_hub_guest_*` keys
 * - Signed-In Mode: `@kitchen_hub_cache_*` keys
 * - Public Catalog Mode: `@kitchen_hub_catalog_*` keys
 * 
 * Storage key prefixes enforce separation and prevent cross-mode data access.
 */

import type { DataMode } from '../types/dataModes';

/**
 * Storage key prefixes for each data mode
 * These prefixes enforce separation and prevent cross-mode data access
 */
export const STORAGE_PREFIXES = {
  guest: '@kitchen_hub_guest_',
  signedIn: '@kitchen_hub_cache_',
  publicCatalog: '@kitchen_hub_catalog_',
} as const;

/**
 * Entity type names for storage keys
 */
export const ENTITY_TYPES = {
  shoppingLists: 'shopping_lists',
  shoppingItems: 'shopping_items',
  recipes: 'recipes',
  chores: 'chores',
  groceryCatalog: 'grocery_catalog',
  categories: 'categories',
} as const;

/**
 * Gets the storage key for a guest entity
 * 
 * @param entityType - The type of entity (e.g., 'shopping_lists')
 * @returns The full storage key with guest prefix
 */
export function getGuestStorageKey(entityType: string): string {
  return `${STORAGE_PREFIXES.guest}${entityType}`;
}

/**
 * Gets the storage key for a signed-in cache entity
 * 
 * @param entityType - The type of entity (e.g., 'shopping_lists')
 * @returns The full storage key with signed-in cache prefix
 */
export function getSignedInCacheKey(entityType: string): string {
  return `${STORAGE_PREFIXES.signedIn}${entityType}`;
}

/**
 * Gets the storage key for a public catalog cache entity
 * 
 * @param entityType - The type of entity (e.g., 'grocery_catalog')
 * @returns The full storage key with public catalog prefix
 */
export function getPublicCatalogCacheKey(entityType: string): string {
  return `${STORAGE_PREFIXES.publicCatalog}${entityType}`;
}

/**
 * Maps DataMode values to their corresponding storage prefixes
 * 
 * @param mode - The data mode to get the prefix for
 * @returns The storage prefix for the given mode
 * @throws Error if the mode is unknown
 */
function getStoragePrefixForMode(mode: DataMode): string {
  const prefixMap: Record<DataMode, string> = {
    'guest': STORAGE_PREFIXES.guest,
    'signed-in': STORAGE_PREFIXES.signedIn,
    'public-catalog': STORAGE_PREFIXES.publicCatalog,
  };
  
  const prefix = prefixMap[mode];
  if (!prefix) {
    throw new Error(`Unknown data mode: ${mode}`);
  }
  
  return prefix;
}

/**
 * Validates that a storage key matches the expected mode
 * Throws an error if the key doesn't match the expected prefix
 * 
 * @param key - The storage key to validate
 * @param expectedMode - The expected data mode
 * @throws Error if the key doesn't match the expected mode prefix
 */
export function validateStorageKey(
  key: string,
  expectedMode: DataMode
): void {
  const prefix = getStoragePrefixForMode(expectedMode);
  
  if (!key.startsWith(prefix)) {
    throw new Error(
      `Storage key ${key} does not match mode ${expectedMode}. Expected prefix: ${prefix}`
    );
  }
}

/**
 * Determines the data mode from a storage key
 * 
 * @param key - The storage key to analyze
 * @returns The data mode if the key matches a known prefix, null otherwise
 */
export function getModeFromStorageKey(key: string): DataMode | null {
  if (key.startsWith(STORAGE_PREFIXES.guest)) {
    return 'guest';
  }
  if (key.startsWith(STORAGE_PREFIXES.signedIn)) {
    return 'signed-in';
  }
  if (key.startsWith(STORAGE_PREFIXES.publicCatalog)) {
    return 'public-catalog';
  }
  return null;
}

/**
 * Extracts the entity type from a storage key
 * 
 * @param key - The storage key
 * @returns The entity type without the prefix, or null if the key doesn't match any prefix
 */
export function extractEntityTypeFromKey(key: string): string | null {
  const mode = getModeFromStorageKey(key);
  if (!mode) {
    return null;
  }
  
  try {
    const prefix = getStoragePrefixForMode(mode);
    return key.substring(prefix.length);
  } catch {
    return null;
  }
}

/**
 * Gets all storage keys for a specific mode
 * This is a helper for cleanup operations
 * 
 * @param mode - The data mode
 * @returns Array of all storage key prefixes for the mode
 */
export function getAllStorageKeysForMode(mode: DataMode): string[] {
  return Object.values(ENTITY_TYPES).map(entityType => {
    switch (mode) {
      case 'guest':
        return getGuestStorageKey(entityType);
      case 'signed-in':
        return getSignedInCacheKey(entityType);
      case 'public-catalog':
        return getPublicCatalogCacheKey(entityType);
      default:
        throw new Error(`Unknown data mode: ${mode}`);
    }
  });
}

/**
 * Validates that a storage key is valid for guest mode operations
 * 
 * @param key - The storage key to validate
 * @throws Error if the key is not a guest storage key
 */
export function validateGuestStorageKey(key: string): void {
  validateStorageKey(key, 'guest');
}

/**
 * Validates that a storage key is valid for signed-in cache operations
 * 
 * @param key - The storage key to validate
 * @throws Error if the key is not a signed-in cache key
 */
export function validateSignedInCacheKey(key: string): void {
  validateStorageKey(key, 'signed-in');
}

/**
 * Validates that a storage key is valid for public catalog cache operations
 * 
 * @param key - The storage key to validate
 * @throws Error if the key is not a public catalog cache key
 */
export function validatePublicCatalogCacheKey(key: string): void {
  validateStorageKey(key, 'public-catalog');
}
