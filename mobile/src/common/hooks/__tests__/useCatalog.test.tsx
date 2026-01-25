/**
 * useCatalog Hook Tests
 * 
 * Tests for the useCatalog React hook.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCatalog } from '../useCatalog';
import { catalogService } from '../../services/catalogService';
import type { GroceryItem } from '../../../features/shopping/components/GrocerySearchBar';
import type { Category } from '../../../mocks/shopping';

// Mock catalog service
jest.mock('../../services/catalogService', () => ({
  catalogService: {
    getCatalogData: jest.fn(),
  },
}));

const mockGetCatalogData = catalogService.getCatalogData as jest.MockedFunction<
  typeof catalogService.getCatalogData
>;

describe('useCatalog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initial load', () => {
    it('should load catalog data on mount', async () => {
      const mockData = {
        groceryItems: [
          { id: '1', name: 'Apple', image: '', category: 'Fruits', defaultQuantity: 1 },
        ] as GroceryItem[],
        categories: [{ id: '1', localId: 'uuid-1', name: 'Fruits', itemCount: 1, image: '', backgroundColor: '#fff' }] as Category[],
        frequentlyAddedItems: [
          { id: '1', name: 'Apple', image: '', category: 'Fruits', defaultQuantity: 1 },
        ] as GroceryItem[],
      };

      mockGetCatalogData.mockResolvedValue(mockData);

      const { result } = renderHook(() => useCatalog());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.groceryItems).toEqual(mockData.groceryItems);
      expect(result.current.categories).toEqual(mockData.categories);
      expect(result.current.frequentlyAddedItems).toEqual(mockData.frequentlyAddedItems);
      expect(result.current.error).toBeNull();
    });

    it('should handle loading state correctly', async () => {
      mockGetCatalogData.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                groceryItems: [],
                categories: [],
                frequentlyAddedItems: [],
              });
            }, 100);
          })
      );

      const { result } = renderHook(() => useCatalog());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    describe.each([
      [
        'network error',
        new Error('Network request failed'),
        'Network request failed',
      ],
      [
        'service error',
        new Error('Service unavailable'),
        'Service unavailable',
      ],
      [
        'unknown error',
        'String error',
        'Failed to load catalog data',
      ],
      [
        'null error',
        null,
        'Failed to load catalog data',
      ],
    ])('should handle %s', (description, error, expectedMessage) => {
      it(`should set error message to "${expectedMessage}" and empty data`, async () => {
        mockGetCatalogData.mockRejectedValue(error);

        const { result } = renderHook(() => useCatalog());

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe(expectedMessage);
        expect(result.current.groceryItems).toEqual([]);
        expect(result.current.categories).toEqual([]);
        expect(result.current.frequentlyAddedItems).toEqual([]);
      });
    });
  });

  describe('manual refresh', () => {
    it('should provide refresh function that reloads catalog data', async () => {
      const initialData = {
        groceryItems: [
          { id: '1', name: 'Apple', image: '', category: 'Fruits', defaultQuantity: 1 },
        ] as GroceryItem[],
        categories: [] as Category[],
        frequentlyAddedItems: [] as GroceryItem[],
      };

      const refreshedData = {
        groceryItems: [
          { id: '2', name: 'Banana', image: '', category: 'Fruits', defaultQuantity: 1 },
        ] as GroceryItem[],
        categories: [] as Category[],
        frequentlyAddedItems: [] as GroceryItem[],
      };

      mockGetCatalogData
        .mockResolvedValueOnce(initialData)
        .mockResolvedValueOnce(refreshedData);

      const { result } = renderHook(() => useCatalog());

      await waitFor(() => {
        expect(result.current.groceryItems).toEqual(initialData.groceryItems);
      });

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.groceryItems).toEqual(refreshedData.groceryItems);
      });

      expect(mockGetCatalogData).toHaveBeenCalledTimes(2);
    });

    it('should handle errors during manual refresh', async () => {
      const error = new Error('Refresh failed');
      mockGetCatalogData
        .mockResolvedValueOnce({
          groceryItems: [],
          categories: [],
          frequentlyAddedItems: [],
        })
        .mockRejectedValueOnce(error);

      const { result } = renderHook(() => useCatalog());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });
    });
  });

  describe('data updates', () => {
    it('should update all catalog data when service returns new data', async () => {
      const mockData = {
        groceryItems: [
          { id: '1', name: 'Apple', image: '', category: 'Fruits', defaultQuantity: 1 },
          { id: '2', name: 'Banana', image: '', category: 'Fruits', defaultQuantity: 1 },
        ] as GroceryItem[],
        categories: [
          { id: '1', localId: 'uuid-1', name: 'Fruits', itemCount: 2, image: '', backgroundColor: '#fff' },
        ] as Category[],
        frequentlyAddedItems: [
          { id: '1', name: 'Apple', image: '', category: 'Fruits', defaultQuantity: 1 },
        ] as GroceryItem[],
      };

      mockGetCatalogData.mockResolvedValue(mockData);

      const { result } = renderHook(() => useCatalog());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.groceryItems).toHaveLength(2);
      expect(result.current.categories).toHaveLength(1);
      expect(result.current.frequentlyAddedItems).toHaveLength(1);
    });
  });
});
