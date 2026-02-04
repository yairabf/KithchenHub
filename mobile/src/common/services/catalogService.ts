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
import { mockGroceriesDB } from '../../mocks/shopping/groceryDatabase';
import { config } from '../../config';
import { SHOPPING_CATEGORIES, DEFAULT_CATEGORY } from '../../features/shopping/constants/categories';
import type { GroceryItem } from '../../features/shopping/components/GrocerySearchBar';
import type { Category } from '../../mocks/shopping';
import type { GrocerySearchItemDto } from '../types/catalog';

/**
 * Enum to track which data source was used for catalog items.
 * Used in logging to identify fallback path taken (API → Cache → Mock).
 * 
 * @example
 * ```typescript
 * console.log('Catalog source:', CatalogSource.API);
 * ```
 */
export enum CatalogSource {
  API = 'api',
  CACHE = 'cache',
  MOCK = 'mock',
}

/**
 * Storage keys for catalog cache
 */
const GROCERY_ITEMS_CACHE_KEY = getPublicCatalogCacheKey('grocery_catalog');
const CATEGORIES_CACHE_KEY = getPublicCatalogCacheKey('shopping_categories');
const CUSTOM_ITEMS_CACHE_KEY = getPublicCatalogCacheKey('custom_grocery_items');

/**
 * Required categories that must be present in catalog data.
 * If missing from API/cache, these will be supplemented from mock data.
 */
const REQUIRED_CATEGORIES = ['household', 'spices'] as const;

/**
 * CustomItem type from API response
 */
interface CustomItemDto {
  id: string;
  householdId: string;
  name: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

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
 * Maps CustomItem API response to GroceryItem format
 * 
 * @param customItem - CustomItem from API
 * @returns Mapped GroceryItem with custom- prefix for ID
 */
function mapCustomItemToGroceryItem(customItem: CustomItemDto): GroceryItem {
  return {
    id: `custom-${customItem.id}`,
    name: customItem.name,
    image: '', // Custom items don't have images
    category: customItem.category || DEFAULT_CATEGORY.toLowerCase(),
    defaultQuantity: 1,
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
 * 0. If mock data is enabled (config.mockData.enabled), return mock data directly
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
   * Internal logging helper that conditionally logs based on environment.
   * Only logs in development mode to avoid performance impact in production.
   * 
   * @param level - Log level ('log' or 'warn')
   * @param message - Log message
   * @param data - Optional data object to log
   */
  private logCatalogEvent(level: 'log' | 'warn', message: string, data?: object): void {
    // Only log in development mode (React Native's __DEV__ flag)
    // In production, logging is disabled to avoid performance overhead
    if (__DEV__) {
      console[level](`[CatalogService] ${message}`, data);
    }
  }

  /**
   * Caches custom items to AsyncStorage.
   * 
   * @param items - Array of custom grocery items to cache
   */
  private async cacheCustomItems(items: GroceryItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CUSTOM_ITEMS_CACHE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to cache custom items:', error);
      // Don't throw - caching failure shouldn't break the app
    }
  }

  /**
   * Gets cached custom items from AsyncStorage with validation.
   * 
   * Validates cached data structure and clears cache if corrupted.
   * 
   * @returns Array of cached custom items, or empty array if cache is empty/invalid
   */
  private async getCachedCustomItems(): Promise<GroceryItem[]> {
    try {
      const cached = await AsyncStorage.getItem(CUSTOM_ITEMS_CACHE_KEY);
      if (!cached) {
        return [];
      }

      const parsed = JSON.parse(cached);
      if (!Array.isArray(parsed)) {
        console.error('Invalid cached custom items format: expected array');
        await AsyncStorage.removeItem(CUSTOM_ITEMS_CACHE_KEY);
        return [];
      }

      // Validate item structure
      if (!isValidGroceryItemsArray(parsed)) {
        console.error('Cached custom items have invalid structure');
        await AsyncStorage.removeItem(CUSTOM_ITEMS_CACHE_KEY);
        return [];
      }

      return parsed;
    } catch (error) {
      console.error('Failed to read cached custom items:', error);
      // Clear corrupted cache on parse error
      await AsyncStorage.removeItem(CUSTOM_ITEMS_CACHE_KEY);
      return [];
    }
  }

  /**
   * Fetches custom items from API with fallback to cache.
   * 
   * This is a non-critical operation - if it fails, regular grocery items still work.
   * Only fetches for signed-in users (requires authentication).
   * 
   * @returns Array of custom items as GroceryItems, or empty array on error
   */
  private async getCustomItems(): Promise<GroceryItem[]> {
    // If mock data is enabled, skip API
    if (config?.mockData?.enabled) {
      return [];
    }

    try {
      const results = await api.get<CustomItemDto[] | undefined>('/shopping-items/custom');
      const list = Array.isArray(results) ? results : [];
      const customItems = list.map(mapCustomItemToGroceryItem);
      
      // Cache successful response
      await this.cacheCustomItems(customItems);
      
      this.logCatalogEvent('log', 'Fetched custom items from API', { itemCount: customItems.length });
      return customItems;
    } catch (error) {
      // Handle all errors gracefully - custom items are non-critical
      if (error instanceof NetworkError) {
        this.logCatalogEvent('warn', 'Network unavailable, falling back to cached custom items', { source: CatalogSource.CACHE });
        const cached = await this.getCachedCustomItems();
        
        if (cached.length > 0) {
          this.logCatalogEvent('log', 'Using cached custom items', { itemCount: cached.length, source: CatalogSource.CACHE });
          return cached;
        }
        
        // No cached custom items - return empty array (non-critical)
        return [];
      }
      
      // For auth errors (401/403), user might not be signed in - return empty array
      // For other errors, log but don't throw (non-critical)
      this.logCatalogEvent('warn', 'Failed to fetch custom items (non-critical)', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return [];
    }
  }

  /**
   * Checks if items array contains any items with the specified category.
   * 
   * @param items - Array of grocery items to check
   * @param categoryName - Category name to search for (case-insensitive)
   * @returns True if at least one item has the category
   */
  private hasCategoryItems(items: GroceryItem[], categoryName: string): boolean {
    const normalizedCategory = categoryName.toLowerCase();
    return items.some(item => 
      item.category?.toLowerCase().includes(normalizedCategory)
    );
  }

  /**
   * Filters items by category name (case-insensitive partial match).
   * 
   * @param items - Array of grocery items to filter
   * @param categoryName - Category name to filter by (case-insensitive)
   * @returns Array of items matching the category
   */
  private getCategoryItems(items: GroceryItem[], categoryName: string): GroceryItem[] {
    const normalizedCategory = categoryName.toLowerCase();
    return items.filter(item => 
      item.category?.toLowerCase().includes(normalizedCategory)
    );
  }

  /**
   * Supplements merged items with missing required category items from mock data.
   * Ensures all required categories are present even if API doesn't return them.
   * 
   * @param mergedItems - Current merged grocery items
   * @param categoryName - Category name to supplement if missing
   * @returns Updated array with supplemented items (if needed)
   */
  private supplementMissingCategoryItems(
    mergedItems: GroceryItem[],
    categoryName: string
  ): GroceryItem[] {
    if (this.hasCategoryItems(mergedItems, categoryName)) {
      return mergedItems;
    }
    
    const mockItems = this.getCategoryItems(mockGroceriesDB, categoryName);
    if (mockItems.length === 0) {
      return mergedItems;
    }
    
    const existingNames = new Set(mergedItems.map(i => i.name.toLowerCase()));
    const uniqueItems = mockItems.filter(
      item => !existingNames.has(item.name.toLowerCase())
    );
    
    if (uniqueItems.length > 0) {
      this.logCatalogEvent('log', `Supplemented with ${categoryName} items from mock data`, {
        added: uniqueItems.length,
        category: categoryName,
      });
      return [...mergedItems, ...uniqueItems];
    }
    
    return mergedItems;
  }

  /**
   * Internal method to fetch grocery items with fallback strategy
   * 
   * @returns Array of grocery items (merged with custom items if available)
   */
  private async fetchGroceryItemsWithFallback(): Promise<GroceryItem[]> {
    // If mock data is enabled, skip API and use mock data directly
    if (config?.mockData?.enabled) {
      this.logCatalogEvent('log', 'Mock data enabled, using mock catalog data', { 
        itemCount: mockGroceriesDB.length,
        source: CatalogSource.MOCK 
      });
      return mockGroceriesDB;
    }

    // Try API first for regular grocery items
    let catalogItems: GroceryItem[] = [];
    try {
      const results = await api.get<GrocerySearchItemDto[] | undefined>('/groceries/search?q=');
      const list = Array.isArray(results) ? results : [];
      catalogItems = list.map(mapGroceryItem);
      
      // Cache successful response
      await this.cacheGroceryItems(catalogItems);
      
      this.logCatalogEvent('log', 'Fetched from API', { 
        itemCount: catalogItems.length,
        source: CatalogSource.API 
      });
    } catch (error) {
      // Handle network errors - fallback to cache
      if (error instanceof NetworkError) {
        this.logCatalogEvent('warn', 'Network unavailable, falling back to cache', { source: CatalogSource.CACHE });
        const cached = await this.getCachedGroceryItems();
        
        if (cached.length > 0) {
          this.logCatalogEvent('log', 'Using cached catalog data', { 
            itemCount: cached.length,
            source: CatalogSource.CACHE 
          });
          catalogItems = cached;
        } else {
          // Cache empty - fallback to mock data
          this.logCatalogEvent('warn', 'Cache empty, using mock catalog data', { 
            itemCount: mockGroceriesDB.length,
            source: CatalogSource.MOCK 
          });
          catalogItems = mockGroceriesDB;
        }
      } else {
        // Re-throw non-network errors
        throw error;
      }
    }

    // Fetch custom items (non-critical - if fails, still return catalog items)
    const customItems = await this.getCustomItems();
    
    // Merge catalog items with custom items
    // Deduplicate by name: if a custom item has the same name as a catalog item, prefer catalog item
    let mergedItems = this.mergeGroceryItems(catalogItems, customItems);
    
    // Fallback: Supplement missing required categories from mock data
    // This ensures all required categories are always available even if API doesn't return them
    for (const categoryName of REQUIRED_CATEGORIES) {
      mergedItems = this.supplementMissingCategoryItems(mergedItems, categoryName);
    }
    
    return mergedItems;
  }

  /**
   * Merges catalog items with custom items, ensuring catalog items take precedence.
   * 
   * If a custom item has the same name (case-insensitive) as a catalog item,
   * the catalog item is kept and the custom item is excluded.
   * 
   * @param catalogItems - Regular grocery catalog items
   * @param customItems - Household custom items
   * @returns Merged array with catalog items first, then unique custom items
   */
  private mergeGroceryItems(catalogItems: GroceryItem[], customItems: GroceryItem[]): GroceryItem[] {
    // Create a set of catalog item names (case-insensitive) for quick lookup
    const catalogItemNames = new Set(
      catalogItems.map(item => item.name.toLowerCase())
    );
    
    // Filter out custom items that have the same name as catalog items
    const uniqueCustomItems = customItems.filter(
      customItem => !catalogItemNames.has(customItem.name.toLowerCase())
    );
    
    // Return catalog items first, then unique custom items
    return [...catalogItems, ...uniqueCustomItems];
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
   * Gets shopping category IDs from backend API with fallback to static categories.
   * 
   * Fallback strategy:
   * 1. Attempts API call to `/groceries/categories`
   * 2. On NetworkError, falls back to cached categories from AsyncStorage
   * 3. If cache is empty or invalid, falls back to static SHOPPING_CATEGORIES
   * 4. On non-network errors (e.g., 500), throws the error
   * 
   * Successful API responses are automatically cached for offline use.
   * 
   * @returns Array of category ID strings (never empty - always returns at least static categories)
   * @throws {Error} For non-network API errors (e.g., 500, 401)
   * 
   * @example
   * ```typescript
   * const categories = await catalogService.getShoppingCategories();
   * // Always returns categories, even if offline
   * ```
   */
  async getShoppingCategories(): Promise<string[]> {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/201a0481-4764-485f-8715-b7ec2ac6f4fc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'catalogService.ts:402',message:'getShoppingCategories called',data:{mockDataEnabled:config?.mockData?.enabled},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    // If mock data is enabled, use static categories
    if (config?.mockData?.enabled) {
      this.logCatalogEvent('log', 'Mock data enabled, using static categories', { 
        categoryCount: SHOPPING_CATEGORIES.length, 
        source: CatalogSource.MOCK 
      });
      return [...SHOPPING_CATEGORIES];
    }

    // Try API first
    try {
      const categories = await api.get<string[] | undefined>('/groceries/categories');
      const categoryList = Array.isArray(categories) ? categories : [];
      
      // Validate categories are strings and normalize to lowercase
      const validCategories = categoryList
        .filter((cat): cat is string => typeof cat === 'string' && cat.length > 0)
        .map(cat => cat.toLowerCase());
      
      // Deduplicate categories
      const uniqueCategories = Array.from(new Set(validCategories));
      
      // Ensure "other" category is always included
      const defaultCategoryLower = DEFAULT_CATEGORY.toLowerCase();
      const finalCategories = uniqueCategories.includes(defaultCategoryLower)
        ? uniqueCategories
        : [...uniqueCategories, defaultCategoryLower];
      
      // Ensure we have at least the default category
      if (finalCategories.length === 0) {
        this.logCatalogEvent('warn', 'API returned empty categories, using static fallback');
        return [...SHOPPING_CATEGORIES];
      }
      
      // Cache successful response
      await this.cacheCategories(finalCategories);
      
      this.logCatalogEvent('log', 'Fetched categories from API', { 
        categoryCount: finalCategories.length, 
        source: CatalogSource.API 
      });
      return finalCategories;
    } catch (error) {
      // Handle network errors - fallback to cache
      if (error instanceof NetworkError) {
        this.logCatalogEvent('warn', 'Network unavailable, falling back to cached categories', { 
          source: CatalogSource.CACHE 
        });
        const cached = await this.getCachedCategories();
        
        if (cached.length > 0) {
          this.logCatalogEvent('log', 'Using cached categories', { 
            categoryCount: cached.length, 
            source: CatalogSource.CACHE 
          });
          return cached;
        }
        
        // Cache empty - fallback to static categories
        this.logCatalogEvent('warn', 'Cache empty, using static categories', { 
          categoryCount: SHOPPING_CATEGORIES.length, 
          source: CatalogSource.MOCK 
        });
        return [...SHOPPING_CATEGORIES];
      }
      
      // Re-throw non-network errors
      throw error;
    }
  }

  /**
   * Caches categories to AsyncStorage.
   * 
   * @param categories - Array of category IDs to cache
   */
  private async cacheCategories(categories: string[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error('Failed to cache categories:', error);
      // Don't throw - caching failure shouldn't break the app
    }
  }

  /**
   * Gets cached categories from AsyncStorage with validation.
   * 
   * Validates cached data structure and clears cache if corrupted.
   * 
   * @returns Array of cached category IDs, or empty array if cache is empty/invalid
   */
  private async getCachedCategories(): Promise<string[]> {
    try {
      const cached = await AsyncStorage.getItem(CATEGORIES_CACHE_KEY);
      if (!cached) {
        return [];
      }

      const parsed = JSON.parse(cached);
      if (!Array.isArray(parsed)) {
        console.error('Invalid cached categories format: expected array');
        await AsyncStorage.removeItem(CATEGORIES_CACHE_KEY);
        return [];
      }

      // Validate all items are strings
      const validCategories = parsed.filter(
        (cat): cat is string => typeof cat === 'string' && cat.length > 0
      );

      if (validCategories.length === 0) {
        console.error('Cached categories have invalid structure');
        await AsyncStorage.removeItem(CATEGORIES_CACHE_KEY);
        return [];
      }

      return validCategories;
    } catch (error) {
      console.error('Failed to read cached categories:', error);
      // Clear corrupted cache on parse error
      await AsyncStorage.removeItem(CATEGORIES_CACHE_KEY);
      return [];
    }
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
      await AsyncStorage.removeItem(CATEGORIES_CACHE_KEY);
      await AsyncStorage.removeItem(CUSTOM_ITEMS_CACHE_KEY);
    } catch (error) {
      console.error('Failed to clear catalog cache:', error);
      // Don't throw - cache clearing failure shouldn't break the app
    }
  }

  /**
   * Clears only the custom items cache.
   * Useful when a custom item is created to force refresh.
   * 
   * @returns Promise that resolves when cache is cleared
   */
  async clearCustomItemsCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CUSTOM_ITEMS_CACHE_KEY);
    } catch (error) {
      console.error('Failed to clear custom items cache:', error);
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
