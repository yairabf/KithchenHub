/**
 * useCatalog Hook
 * 
 * React hook for fetching and managing catalog data (grocery items, categories, frequently added items).
 * Implements fallback strategy: API → Cache → Mock data
 * Works for both guest and signed-in users.
 */

import { useState, useEffect, useCallback } from 'react';
import { catalogService } from '../services/catalogService';
import type { GroceryItem } from '../../features/shopping/components/GrocerySearchBar';
import type { Category } from '../../mocks/shopping';

/**
 * Hook return type
 */
export interface UseCatalogReturn {
  /** Array of grocery items from catalog */
  groceryItems: GroceryItem[];
  /** Array of categories built from grocery items */
  categories: Category[];
  /** Array of frequently added items (first 8) */
  frequentlyAddedItems: GroceryItem[];
  /** Whether catalog data is currently being loaded */
  isLoading: boolean;
  /** Error if catalog fetch failed */
  error: Error | null;
  /** Manual refresh function to re-fetch catalog data */
  refresh: () => Promise<void>;
  /** Search groceries on demand (server-side) */
  searchGroceries: (query: string) => Promise<GroceryItem[]>;
  /** Fetch groceries by category on demand (server-side) */
  getGroceriesByCategory: (categoryName: string) => Promise<GroceryItem[]>;
}

/**
 * React hook for fetching and managing catalog data
 * 
 * @returns Object with catalog data, loading state, error, and refresh function
 * 
 * @example
 * ```typescript
 * const { groceryItems, categories, isLoading, error, refresh } = useCatalog();
 * 
 * // Use in component
 * <GrocerySearchBar items={groceryItems} />
 * <CategoriesGrid categories={categories} />
 * ```
 */
export function useCatalog(): UseCatalogReturn {
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [frequentlyAddedItems, setFrequentlyAddedItems] = useState<GroceryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Loads catalog data from service.
   * On error, keeps previous data if available to prevent UI flicker.
   */
  const loadCatalogData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await catalogService.getCatalogData();

      setGroceryItems(data.groceryItems);
      setCategories(data.categories);
      setFrequentlyAddedItems(data.frequentlyAddedItems);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load catalog data';
      const catalogError = err instanceof Error ? err : new Error(errorMessage);
      setError(catalogError);
      console.error('Failed to load catalog data:', catalogError);

      // Only clear data on first load (when arrays are empty)
      // Keep stale data on subsequent errors to prevent UI flicker
      setGroceryItems((prev) => {
        // If we have previous data, keep it; otherwise clear
        return prev.length > 0 ? prev : [];
      });
      setCategories((prev) => {
        return prev.length > 0 ? prev : [];
      });
      setFrequentlyAddedItems((prev) => {
        return prev.length > 0 ? prev : [];
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(async () => {
    await loadCatalogData();
  }, [loadCatalogData]);

  /**
   * Search groceries on demand
   */
  const searchGroceries = useCallback(async (query: string) => {
    return catalogService.searchGroceries(query);
  }, []);

  /**
   * Fetch groceries by category on demand
   */
  const getGroceriesByCategory = useCallback(async (categoryName: string) => {
    return catalogService.getGroceriesByCategory(categoryName);
  }, []);

  // Load catalog data on mount
  useEffect(() => {
    loadCatalogData();
  }, [loadCatalogData]);

  return {
    groceryItems,
    categories,
    frequentlyAddedItems,
    isLoading,
    error,
    refresh,
    searchGroceries,
    getGroceriesByCategory,
  };
}
