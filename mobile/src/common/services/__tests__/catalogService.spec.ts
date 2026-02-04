/**
 * Catalog Service Tests
 * 
 * Parameterized tests for catalog service with fallback strategy.
 */

import { api, NetworkError } from '../../../services/api';
import { mockGroceriesDB } from '../../../mocks/shopping/groceryDatabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GroceryItem } from '../../../features/shopping/components/GrocerySearchBar';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock API
jest.mock('../../../services/api', () => ({
  api: {
    get: jest.fn(),
  },
  NetworkError: class NetworkError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'NetworkError';
    }
  },
}));

// Mock catalog utils
jest.mock('../../utils/catalogUtils', () => ({
  buildCategoriesFromGroceries: jest.fn((items) => 
    items.map((item: any) => ({
      id: item.category.toLowerCase(),
      localId: `uuid-${item.category}`,
      name: item.category,
      itemCount: 1,
      image: item.image,
      backgroundColor: '#fff',
    }))
  ),
  buildFrequentlyAddedItems: jest.fn((items, limit = 8) => items.slice(0, limit)),
}));

// Mock config module - must be before CatalogService import
// Create a shared config object that can be mutated
const mockConfigValue = {
  mockData: {
    enabled: false,
  },
};

// Mock config with getter to ensure it's always current
jest.mock('../../../config', () => {
  return {
    get config() {
      return mockConfigValue;
    },
  };
});

const mockApiGet = api.get as jest.MockedFunction<typeof api.get>;

// Import CatalogService after mocks are set up
import { CatalogService } from '../catalogService';

describe('CatalogService', () => {
  let service: CatalogService;

  beforeEach(() => {
    service = new CatalogService();
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    // Reset mock data config to false by default
    mockConfigValue.mockData.enabled = false;
    // Clear any memoized promises in the service
    (service as any).groceryItemsPromise = null;
  });

  describe('getGroceryItems', () => {
    describe.each([
      [
        'API success',
        () => {
          const mockResponse = [
            { id: '1', name: 'Apple', category: 'Fruits', imageUrl: 'apple.jpg', defaultQuantity: 1 },
            { id: '2', name: 'Banana', category: 'Fruits', imageUrl: 'banana.jpg', defaultQuantity: 2 },
          ];
          mockApiGet.mockResolvedValue(mockResponse);
          return undefined;
        },
        async () => {
          const items = await service.getGroceryItems();
          expect(items).toHaveLength(2);
          expect(items[0].name).toBe('Apple');
          expect(mockApiGet).toHaveBeenCalledWith('/groceries/search?q=');
          expect(AsyncStorage.setItem).toHaveBeenCalled();
        },
      ],
      [
        'NetworkError with cached data',
        async () => {
          const cachedItems: GroceryItem[] = [
            { id: 'cached-1', name: 'Cached Apple', image: '', category: 'Fruits', defaultQuantity: 1 },
          ];
          mockApiGet.mockRejectedValue(new NetworkError('No internet'));
          (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedItems));
          return cachedItems; // Return for use in assertion
        },
        async (cachedItems?: GroceryItem[]) => {
          const items = await service.getGroceryItems();
          expect(items).toEqual(cachedItems);
          expect(mockApiGet).toHaveBeenCalled();
        },
      ],
      [
        'NetworkError with empty cache',
        async () => {
          mockApiGet.mockRejectedValue(new NetworkError('No internet'));
          (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
          return undefined;
        },
        async () => {
          const items = await service.getGroceryItems();
          expect(items).toEqual(mockGroceriesDB);
          expect(mockApiGet).toHaveBeenCalled();
        },
      ],
      [
        'NetworkError with invalid cache',
        async () => {
          mockApiGet.mockRejectedValue(new NetworkError('No internet'));
          (AsyncStorage.getItem as jest.Mock).mockResolvedValue('invalid json');
          return undefined;
        },
        async () => {
          const items = await service.getGroceryItems();
          expect(items).toEqual(mockGroceriesDB);
        },
      ],
      [
        'API error (non-network)',
        async () => {
          const apiError = new Error('Server error');
          mockApiGet.mockRejectedValue(apiError);
          return undefined;
        },
        async (_setupResult?: GroceryItem[]) => {
          await expect(service.getGroceryItems()).rejects.toThrow('Server error');
        },
      ],
    ])('when %s', (scenario, setup, assertion) => {
      it(`should handle ${scenario} correctly`, async () => {
        const setupResult = await setup();
        await assertion(setupResult);
      });
    });

    describe('with mock data enabled', () => {
      let mockService: CatalogService;

      beforeEach(() => {
        // Update the shared mock config object BEFORE creating service
        mockConfigValue.mockData.enabled = true;
        // Create a fresh service instance with mock data enabled
        mockService = new CatalogService();
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
        (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      });

      afterEach(() => {
        // Reset the mock config
        mockConfigValue.mockData.enabled = false;
      });

      it('should return mock data directly without calling API', async () => {
        // Verify config is set correctly
        expect(mockConfigValue.mockData.enabled).toBe(true);
        
        const items = await mockService.getGroceryItems();

        // Verify we got items and they match mock data
        expect(items).toBeDefined();
        expect(Array.isArray(items)).toBe(true);
        expect(items.length).toBe(mockGroceriesDB.length);
        // Verify first item matches mock data structure
        if (items.length > 0 && mockGroceriesDB.length > 0) {
          expect(items[0]).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
            category: expect.any(String),
          });
        }
        expect(mockApiGet).not.toHaveBeenCalled();
        expect(AsyncStorage.getItem).not.toHaveBeenCalled();
        expect(AsyncStorage.setItem).not.toHaveBeenCalled();
      });

      it('should return mock data even if API would succeed', async () => {
        const mockResponse = [
          { id: '1', name: 'API Apple', category: 'Fruits', imageUrl: 'api-apple.jpg', defaultQuantity: 1 },
        ];
        mockApiGet.mockResolvedValue(mockResponse);

        const items = await mockService.getGroceryItems();

        // Verify we got mock data, not API response
        expect(items).toBeDefined();
        expect(Array.isArray(items)).toBe(true);
        expect(items.length).toBe(mockGroceriesDB.length);
        expect(mockApiGet).not.toHaveBeenCalled();
      });

      it('should return mock data even if cache exists', async () => {
        const cachedItems: GroceryItem[] = [
          { id: 'cached-1', name: 'Cached Apple', image: 'cached.jpg', category: 'Fruits', defaultQuantity: 1 },
        ];
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedItems));

        const items = await mockService.getGroceryItems();

        // Verify we got mock data, not cached data
        expect(items).toBeDefined();
        expect(Array.isArray(items)).toBe(true);
        expect(items.length).toBe(mockGroceriesDB.length);
        expect(AsyncStorage.getItem).not.toHaveBeenCalled();
      });
    });

    it('should cache successful API response', async () => {
      const mockResponse = [
        { id: '1', name: 'Apple', category: 'Fruits', imageUrl: 'apple.jpg', defaultQuantity: 1 },
      ];
      mockApiGet.mockResolvedValue(mockResponse);

      await service.getGroceryItems();

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const setItemCalls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      expect(setItemCalls.length).toBeGreaterThan(0);
    });

    it('should handle cache write failure gracefully', async () => {
      const mockResponse = [
        { id: '1', name: 'Apple', category: 'Fruits', imageUrl: 'apple.jpg', defaultQuantity: 1 },
      ];
      mockApiGet.mockResolvedValue(mockResponse);
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage full'));

      const items = await service.getGroceryItems();

      // Should still return items even if cache write fails
      expect(items).toHaveLength(1);
    });
  });

  describe('getCategories', () => {
    it('should build categories from grocery items', async () => {
      const mockResponse = [
        { id: '1', name: 'Apple', category: 'Fruits', imageUrl: '', defaultQuantity: 1 },
        { id: '2', name: 'Carrot', category: 'Vegetables', imageUrl: '', defaultQuantity: 1 },
      ];
      mockApiGet.mockResolvedValue(mockResponse);

      const categories = await service.getCategories();

      expect(categories).toHaveLength(2);
    });
  });

  describe('getFrequentlyAddedItems', () => {
    it('should return first 8 items', async () => {
      const mockResponse = Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        name: `Item ${i}`,
        category: 'Test',
        imageUrl: '',
        defaultQuantity: 1,
      }));
      mockApiGet.mockResolvedValue(mockResponse);

      const items = await service.getFrequentlyAddedItems();

      expect(items).toHaveLength(8);
    });
  });

  describe('getCatalogData', () => {
    it('should return all catalog data', async () => {
      const mockResponse = [
        { id: '1', name: 'Apple', category: 'Fruits', imageUrl: '', defaultQuantity: 1 },
      ];
      mockApiGet.mockResolvedValue(mockResponse);

      const data = await service.getCatalogData();

      expect(data).toHaveProperty('groceryItems');
      expect(data).toHaveProperty('categories');
      expect(data).toHaveProperty('frequentlyAddedItems');
      expect(data.groceryItems).toHaveLength(1);
    });

    it('should only call API once for all data', async () => {
      const mockResponse = [
        { id: '1', name: 'Apple', category: 'Fruits', imageUrl: '', defaultQuantity: 1 },
      ];
      mockApiGet.mockResolvedValue(mockResponse);

      await service.getCatalogData();

      // Should only call API once, not three times
      expect(mockApiGet).toHaveBeenCalledTimes(1);
    });

    it('should use memoization to prevent redundant API calls', async () => {
      const mockResponse = [
        { id: '1', name: 'Apple', category: 'Fruits', imageUrl: '', defaultQuantity: 1 },
      ];
      mockApiGet.mockResolvedValue(mockResponse);

      // Call multiple methods simultaneously
      const [items1, items2, categories, frequentlyAdded] = await Promise.all([
        service.getGroceryItems(),
        service.getGroceryItems(),
        service.getCategories(),
        service.getFrequentlyAddedItems(),
      ]);

      // Should only call API once due to memoization
      expect(mockApiGet).toHaveBeenCalledTimes(1);
      expect(items1).toEqual(items2);
      expect(categories).toBeDefined();
      expect(frequentlyAdded).toBeDefined();
    });
  });

  describe('clearCache', () => {
    it('should clear grocery items cache', async () => {
      await service.clearCache();

      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(1);
    });

    it('should handle cache clear failure gracefully', async () => {
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(new Error('Storage error'));

      await expect(service.clearCache()).resolves.not.toThrow();
    });
  });

  describe('cached data validation', () => {
    beforeEach(() => {
      // Ensure mock data is disabled for these tests
      mockConfigValue.mockData.enabled = false;
    });

    describe.each([
      [
        'invalid JSON',
        'not json',
        mockGroceriesDB,
      ],
      [
        'not an array',
        JSON.stringify({ not: 'array' }),
        mockGroceriesDB,
      ],
      [
        'array with invalid items',
        JSON.stringify([{ invalid: 'item' }]),
        mockGroceriesDB,
      ],
      [
        'valid cached data',
        JSON.stringify([
          { id: '1', name: 'Cached Apple', image: '', category: 'Fruits', defaultQuantity: 1 },
        ]),
        [{ id: '1', name: 'Cached Apple', image: '', category: 'Fruits', defaultQuantity: 1 }],
      ],
    ])('with %s', (description, cachedValue, expectedResult) => {
      it(`should handle ${description} correctly`, async () => {
        // Ensure mock data is disabled for this test
        mockConfigValue.mockData.enabled = false;
        mockApiGet.mockRejectedValue(new NetworkError('No internet'));
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(cachedValue);

        const items = await service.getGroceryItems();

        expect(items).toEqual(expectedResult);
      });
    });
  });

  describe('category supplementation fallback', () => {
    beforeEach(() => {
      // Ensure mock data is disabled for these tests
      mockConfigValue.mockData.enabled = false;
    });

    describe.each([
      [
        'missing household category',
        [
          { id: '1', name: 'Apple', category: 'Fruits', imageUrl: '', defaultQuantity: 1 },
          { id: '2', name: 'Salt', category: 'Spices', imageUrl: '', defaultQuantity: 1 },
        ],
        (items: GroceryItem[]) => {
          const hasHousehold = items.some(i => i.category?.toLowerCase().includes('household'));
          expect(hasHousehold).toBe(true);
        },
      ],
      [
        'missing spices category',
        [
          { id: '1', name: 'Apple', category: 'Fruits', imageUrl: '', defaultQuantity: 1 },
          { id: '2', name: 'Paper Towels', category: 'Household', imageUrl: '', defaultQuantity: 1 },
        ],
        (items: GroceryItem[]) => {
          const hasSpices = items.some(i => i.category?.toLowerCase().includes('spices'));
          expect(hasSpices).toBe(true);
        },
      ],
      [
        'missing both household and spices categories',
        [
          { id: '1', name: 'Apple', category: 'Fruits', imageUrl: '', defaultQuantity: 1 },
        ],
        (items: GroceryItem[]) => {
          const hasHousehold = items.some(i => i.category?.toLowerCase().includes('household'));
          const hasSpices = items.some(i => i.category?.toLowerCase().includes('spices'));
          expect(hasHousehold).toBe(true);
          expect(hasSpices).toBe(true);
        },
      ],
      [
        'both categories already present',
        [
          { id: '1', name: 'Paper Towels', category: 'Household', imageUrl: '', defaultQuantity: 1 },
          { id: '2', name: 'Salt', category: 'Spices', imageUrl: '', defaultQuantity: 1 },
        ],
        (items: GroceryItem[]) => {
          // Should not duplicate items
          const householdItems = items.filter(i => i.category?.toLowerCase().includes('household'));
          const spicesItems = items.filter(i => i.category?.toLowerCase().includes('spices'));
          // Original items should still be present
          expect(householdItems.some(i => i.name === 'Paper Towels')).toBe(true);
          expect(spicesItems.some(i => i.name === 'Salt')).toBe(true);
        },
      ],
    ])('with %s', (description, apiResponse, assertion) => {
      it(`should supplement missing categories correctly`, async () => {
        mockApiGet.mockResolvedValue(apiResponse);
        
        const items = await service.getGroceryItems();
        
        assertion(items);
        expect(mockApiGet).toHaveBeenCalledWith('/groceries/search?q=');
      });
    });

    it('should not add duplicate items when supplementing', async () => {
      // API returns items that already exist in mock data
      const apiResponse = [
        { id: '1', name: 'Paper Towels', category: 'Household', imageUrl: '', defaultQuantity: 1 },
        { id: '2', name: 'Salt', category: 'Spices', imageUrl: '', defaultQuantity: 1 },
      ];
      mockApiGet.mockResolvedValue(apiResponse);
      
      const items = await service.getGroceryItems();
      
      // Count items by name (case-insensitive)
      const itemNames = items.map(i => i.name.toLowerCase());
      const uniqueNames = new Set(itemNames);
      
      // Should not have duplicates
      expect(itemNames.length).toBe(uniqueNames.size);
    });
  });
});
