/**
 * Catalog Service
 * 
 * Service for fetching and caching public catalog data (grocery items).
 * Implements fallback strategy: API → Cache → Mock data
 * Works for both guest and signed-in users.
 * 
 * Features:
 * - Memoization to prevent redundant API calls
 * - Automatic cache validation and cleanup
 * - Graceful error handling with fallback strategy
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, NetworkError } from '../../services/api';
import { getPublicCatalogCacheKey } from '../storage/dataModeStorage';
import { buildCategoriesFromGroceries, buildFrequentlyAddedItems } from '../utils/catalogUtils';
import { mockGroceriesDB } from '../../data/groceryDatabase';
import type { GroceryItem } from '../../features/shopping/components/GrocerySearchBar';
import type { Category } from '../../mocks/shopping';

/**
 * DTO type for API response
 */
type GrocerySearchItemDto = {
  id: string;
  name: string;
  category: string;
  imageUrl?: string | null;
  defaultQuantity?: number | null;
};

/**
 * Storage keys for catalog cache
 */
const GROCERY_ITEMS_CACHE_KEY = getPublicCatalogCacheKey('grocery_catalog');

/**
 * Maps API DTO to GroceryItem format
 * 
 * @param item - API response item
 * @returns Mapped GroceryItem
 */
function mapGroceryItem(item: GrocerySearchItemDto): GroceryItem {
  return {
    id: item.id,
    name: item.name,
    image: item.imageUrl ?? '',
    category: item.category,
    defaultQuantity: item.defaultQuantity ?? 1,
  };
}

/**
 * Type guard to validate GroceryItem structure
 * 
 * @param item - Item to validate
 * @returns True if item is a valid GroceryItem
 */
function isValidGroceryItem(item: unknown): item is GroceryItem {
  if (typeof item !== 'object' || item === null) {
    return false;
  }

  const candidate = item as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.category === 'string' &&
    typeof candidate.image === 'string' &&
    typeof candidate.defaultQuantity === 'number'
  );
}

/**
 * Type guard to validate array of GroceryItems
 * 
 * @param items - Array to validate
 * @returns True if all items are valid GroceryItems
 */
function isValidGroceryItemsArray(items: unknown[]): items is GroceryItem[] {
  return items.every(isValidGroceryItem);
}

/**
 * Catalog Service
 * 
 * Provides methods to fetch catalog data with fallback strategy:
 * 1. Try API first
 * 2. Fallback to cache on network error
 * 3. Fallback to mock data if cache empty
 * 
 * Uses memoization to prevent redundant API calls when multiple methods
 * are called simultaneously.
 */
export class CatalogService {
  /**
   * In-flight promise for grocery items fetch
   * Prevents multiple simultaneous API calls
   */
  private groceryItemsPromise: Promise<GroceryItem[]> | null = null;
  /**
   * Fetches grocery items from API with fallback to cache and mock data.
   * 
   * Fallback strategy:
   * 1. Attempts API call to `/groceries/search?q=`
   * 2. On NetworkError, falls back to cached data from AsyncStorage
   * 3. If cache is empty or invalid, falls back to mockGroceriesDB
   * 4. On non-network errors (e.g., 500), throws the error
   * 
   * Successful API responses are automatically cached for offline use.
   * Uses memoization to prevent redundant API calls when called multiple times.
   * 
   * @returns Array of grocery items (never empty - always returns at least mock data on network error)
   * @throws {Error} For non-network API errors (e.g., 500, 401)
   * 
   * @example
   * ```typescript
   * const items = await catalogService.getGroceryItems();
   * // Always returns items, even if offline
   * ```
   */
  async getGroceryItems(): Promise<GroceryItem[]> {
    // Return in-flight promise if already fetching (memoization)
    if (this.groceryItemsPromise) {
      return this.groceryItemsPromise;
    }

    // Create new fetch promise
    this.groceryItemsPromise = this.fetchGroceryItemsWithFallback();

    try {
      const items = await this.groceryItemsPromise;
      return items;
    } finally {
      // Clear promise after completion
      this.groceryItemsPromise = null;
    }
  }

  /**
   * Internal method to fetch grocery items with fallback strategy
   * 
   * @returns Array of grocery items
   */
  private async fetchGroceryItemsWithFallback(): Promise<GroceryItem[]> {
    // Try API first
    try {
      const results = await api.get<GrocerySearchItemDto[]>('/groceries/search?q=');
      const items = results.map(mapGroceryItem);
      
      // Cache successful response
      await this.cacheGroceryItems(items);
      
      return items;
    } catch (error) {
      // Handle network errors - fallback to cache
      if (error instanceof NetworkError) {
        console.warn('Network unavailable: Falling back to cached catalog data.');
        const cached = await this.getCachedGroceryItems();
        
        if (cached.length > 0) {
          return cached;
        }
        
        // Cache empty - fallback to mock data
        console.warn('Cache empty: Using mock catalog data.');
        return mockGroceriesDB;
      }
      
      // Re-throw non-network errors
      throw error;
    }
  }

  /**
   * Gets categories built from grocery items
   * 
   * @returns Array of categories with metadata
   */
  async getCategories(): Promise<Category[]> {
    const groceryItems = await this.getGroceryItems();
    return buildCategoriesFromGroceries(groceryItems);
  }

  /**
   * Gets frequently added items (first 8 items)
   * 
   * @returns Array of frequently added items
   */
  async getFrequentlyAddedItems(): Promise<GroceryItem[]> {
    const groceryItems = await this.getGroceryItems();
    return buildFrequentlyAddedItems(groceryItems);
  }

  /**
   * Gets all catalog data (items, categories, frequently added)
   * 
   * @returns Object with all catalog data
   */
  async getCatalogData(): Promise<{
    groceryItems: GroceryItem[];
    categories: Category[];
    frequentlyAddedItems: GroceryItem[];
  }> {
    const groceryItems = await this.getGroceryItems();
    const categories = buildCategoriesFromGroceries(groceryItems);
    const frequentlyAddedItems = buildFrequentlyAddedItems(groceryItems);

    return {
      groceryItems,
      categories,
      frequentlyAddedItems,
    };
  }

  /**
   * Caches grocery items to AsyncStorage.
   * 
   * Note: Categories are not cached separately as they are derived from grocery items
   * and can be rebuilt quickly from cached items when needed.
   * 
   * @param items - Array of grocery items to cache
   */
  private async cacheGroceryItems(items: GroceryItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(GROCERY_ITEMS_CACHE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to cache grocery items:', error);
      // Don't throw - caching failure shouldn't break the app
    }
  }

  /**
   * Gets cached grocery items from AsyncStorage with validation.
   * 
   * Validates cached data structure and clears cache if corrupted.
   * 
   * @returns Array of cached grocery items, or empty array if cache is empty/invalid
   */
  private async getCachedGroceryItems(): Promise<GroceryItem[]> {
    try {
      const cached = await AsyncStorage.getItem(GROCERY_ITEMS_CACHE_KEY);
      if (!cached) {
        return [];
      }

      const parsed = JSON.parse(cached);
      if (!Array.isArray(parsed)) {
        console.error('Invalid cached grocery items format: expected array');
        await this.clearCache();
        return [];
      }

      // Validate item structure
      if (!isValidGroceryItemsArray(parsed)) {
        console.error('Cached grocery items have invalid structure');
        await this.clearCache();
        return [];
      }

      return parsed;
    } catch (error) {
      console.error('Failed to read cached grocery items:', error);
      // Clear corrupted cache on parse error
      await this.clearCache();
      return [];
    }
  }

  /**
   * Clears the catalog cache.
   * Useful for forcing a fresh fetch on next request or cleaning up corrupted data.
   * 
   * @returns Promise that resolves when cache is cleared
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(GROCERY_ITEMS_CACHE_KEY);
    } catch (error) {
      console.error('Failed to clear catalog cache:', error);
      // Don't throw - cache clearing failure shouldn't break the app
    }
  }
}

/**
 * Singleton instance of CatalogService for convenience.
 * 
 * For testing, you can create new instances using:
 * ```typescript
 * const testService = new CatalogService();
 * ```
 */
export const catalogService = new CatalogService();

/**
 * Factory function to create a new CatalogService instance.
 * Useful for testing and dependency injection.
 * 
 * @returns New CatalogService instance
 */
export function createCatalogService(): CatalogService {
  return new CatalogService();
}
