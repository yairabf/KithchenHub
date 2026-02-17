/**
 * Category Migration Tests for ShoppingListsScreen
 * 
 * Tests the one-time category cache clearing migration that removes
 * deprecated categories (oils, teas, sweets) from AsyncStorage.
 */

import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { catalogService } from '../../../../common/services/catalogService';
import { SHOPPING_CATEGORIES } from '../../constants/categories';

// Mock dependencies
jest.mock('../../../../common/services/catalogService');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

const MIGRATION_KEY = '@kitchen_hub_category_migration_v1';

/**
 * Hook that simulates the category loading logic from ShoppingListsScreen
 */
function useCategoryMigration() {
  const [availableCategories, setAvailableCategories] = React.useState<string[]>([]);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    const loadCategoriesWithMigration = async () => {
      try {
        const migrationCompleted = await AsyncStorage.getItem(MIGRATION_KEY);

        if (!migrationCompleted) {
          await catalogService.clearCache();
          await AsyncStorage.setItem(MIGRATION_KEY, 'completed');
        }

        const cats = await catalogService.getShoppingCategories();

        if (cancelled) return;

        setAvailableCategories(cats);
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          setAvailableCategories(SHOPPING_CATEGORIES);
        }
      }
    };

    loadCategoriesWithMigration();

    return () => {
      cancelled = true;
    };
  }, []);

  return { availableCategories, error };
}

describe('ShoppingListsScreen - Category Migration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe.each([
    ['first launch (migration not completed)', null, true, 'should clear cache'],
    ['already migrated', 'completed', false, 'should not clear cache'],
  ])('cache clearing on %s', (scenario, storedValue, shouldClearCache, description) => {
    it(description, async () => {
      // Arrange
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(storedValue);
      (catalogService.getShoppingCategories as jest.Mock).mockResolvedValueOnce([
        'fruits',
        'vegetables',
        'dairy',
      ]);

      // Act
      const { result } = renderHook(() => useCategoryMigration());

      // Assert
      await waitFor(() => {
        expect(catalogService.clearCache).toHaveBeenCalledTimes(shouldClearCache ? 1 : 0);
      });

      if (shouldClearCache) {
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(MIGRATION_KEY, 'completed');
      }

      // Wait for categories to be loaded
      await waitFor(() => {
        expect(result.current.availableCategories).toEqual(['fruits', 'vegetables', 'dairy']);
      });
    });
  });

  it('should mark migration as completed after successful cache clear', async () => {
    // Arrange
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    (catalogService.getShoppingCategories as jest.Mock).mockResolvedValueOnce([
      'fruits',
      'vegetables',
    ]);

    // Act
    renderHook(() => useCategoryMigration());

    // Assert
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(MIGRATION_KEY, 'completed');
    });
  });

  it('should handle cache clear errors gracefully and fallback to static categories', async () => {
    // Arrange
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    (catalogService.clearCache as jest.Mock).mockRejectedValueOnce(
      new Error('Storage unavailable'),
    );

    // Act
    const { result } = renderHook(() => useCategoryMigration());

    // Assert
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.availableCategories).toEqual(SHOPPING_CATEGORIES);
    });
  });

  it('should handle getShoppingCategories errors and fallback to static categories', async () => {
    // Arrange
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('completed');
    (catalogService.getShoppingCategories as jest.Mock).mockRejectedValueOnce(
      new Error('Network error'),
    );

    // Act
    const { result } = renderHook(() => useCategoryMigration());

    // Assert
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.availableCategories).toEqual(SHOPPING_CATEGORIES);
    });
  });

  it('should not update state after component unmount', async () => {
    // Arrange
    (AsyncStorage.getItem as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(null), 100);
        }),
    );
    (catalogService.getShoppingCategories as jest.Mock).mockResolvedValueOnce(['fruits']);

    // Act
    const { result, unmount } = renderHook(() => useCategoryMigration());

    // Unmount immediately
    unmount();

    // Wait for async operations to complete
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Assert - state should remain empty (not updated after unmount)
    expect(result.current.availableCategories).toEqual([]);
  });

  describe('AsyncStorage operations', () => {
    it('should check migration key before clearing cache', async () => {
      // Arrange
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
      (catalogService.getShoppingCategories as jest.Mock).mockResolvedValueOnce(['fruits']);

      // Act
      renderHook(() => useCategoryMigration());

      // Assert
      await waitFor(() => {
        expect(AsyncStorage.getItem).toHaveBeenCalledWith(MIGRATION_KEY);
      });
    });

    it('should handle AsyncStorage.getItem errors gracefully', async () => {
      // Arrange
      (AsyncStorage.getItem as jest.Mock).mockRejectedValueOnce(
        new Error('AsyncStorage unavailable'),
      );

      // Act
      const { result } = renderHook(() => useCategoryMigration());

      // Assert
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.availableCategories).toEqual(SHOPPING_CATEGORIES);
      });
    });
  });

  describe('race condition handling', () => {
    it('should handle rapid re-renders without duplicate cache clears', async () => {
      // Arrange
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      (catalogService.getShoppingCategories as jest.Mock).mockResolvedValue(['fruits']);

      // Act - render multiple times rapidly
      const { rerender } = renderHook(() => useCategoryMigration());
      rerender();
      rerender();
      rerender();

      // Assert - should only clear cache once
      await waitFor(() => {
        expect(catalogService.clearCache).toHaveBeenCalledTimes(1);
      });
    });
  });
});
