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

// Mock catalog utils. Inline structural types only (mock factory cannot reference out-of-scope vars).
jest.mock('../../utils/catalogUtils', () => ({
  buildCategoriesFromGroceries: jest.fn(
    (items: Array<{ category?: string; image?: string }>) =>
      items.map((item: { category?: string; image?: string }) => ({
        id: item.category?.toLowerCase() ?? '',
        localId: `uuid-${item.category ?? ''}`,
        name: item.category ?? '',
        itemCount: 1,
        image: item.image,
        backgroundColor: '#fff',
      }))
  ),
  buildCategoriesFromNames: jest.fn((names: string[]) =>
    names.map(name => ({
      id: name.toLowerCase(),
      localId: `uuid-${name}`,
      name,
      itemCount: 0,
      image: '',
      backgroundColor: '#fff',
    }))
  ),
  buildFrequentlyAddedItems: jest.fn(
    (items: unknown[], limit = 8): unknown[] => items.slice(0, limit)
  ),
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

/** Custom items API shape (getGroceryItems calls /shopping-items/custom, not /groceries/search) */
function customItemDto(name: string, category: string) {
  return {
    id: `id-${name}`,
    householdId: 'h1',
    name,
    category,
    createdAt: new Date().toISOString(),
  };
}

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
    // Reset internal memoization for test isolation (CatalogService does not expose this).
    (service as unknown as { groceryItemsPromise: Promise<GroceryItem[]> | null }).groceryItemsPromise = null;
  });

  describe('getGroceryItems', () => {
    describe.each([
      [
        'API success (custom items)',
        () => {
          const mockResponse = [
            customItemDto('Apple', 'Fruits'),
            customItemDto('Banana', 'Fruits'),
          ];
          mockApiGet.mockResolvedValue(mockResponse);
          return undefined;
        },
        async () => {
          const items = await service.getGroceryItems();
          expect(items.length).toBeGreaterThanOrEqual(2);
          expect(items.some(i => i.name === 'Apple')).toBe(true);
          expect(mockApiGet).toHaveBeenCalledWith('/shopping-items/custom');
          expect(AsyncStorage.setItem).toHaveBeenCalled();
        },
      ],
      [
        'NetworkError with cached custom items',
        async () => {
          const cachedItems: GroceryItem[] = [
            { id: 'cached-1', name: 'Cached Apple', image: '', category: 'Fruits', defaultQuantity: 1 },
          ];
          mockApiGet.mockRejectedValue(new NetworkError('No internet'));
          (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(cachedItems));
          return cachedItems;
        },
        async (cachedItems?: GroceryItem[]) => {
          const items = await service.getGroceryItems();
          expect(items).toEqual(expect.arrayContaining(cachedItems ?? []));
          expect(items.length).toBeGreaterThanOrEqual((cachedItems ?? []).length);
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
          expect(items.length).toBeGreaterThanOrEqual(2);
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
          expect(items.length).toBeGreaterThanOrEqual(2);
        },
      ],
      [
        'API error (non-network)',
        async () => {
          mockApiGet.mockRejectedValue(new Error('Server error'));
          return undefined;
        },
        async () => {
          const items = await service.getGroceryItems();
          expect(items.length).toBeGreaterThanOrEqual(2);
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
      mockApiGet.mockResolvedValue([customItemDto('Apple', 'Fruits')]);

      await service.getGroceryItems();

      expect(AsyncStorage.setItem).toHaveBeenCalled();
      const setItemCalls = (AsyncStorage.setItem as jest.Mock).mock.calls;
      expect(setItemCalls.length).toBeGreaterThan(0);
    });

    it('should handle cache write failure gracefully', async () => {
      mockApiGet.mockResolvedValue([customItemDto('Apple', 'Fruits')]);
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage full'));

      const items = await service.getGroceryItems();

      expect(items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getCategories', () => {
    it('should build categories from grocery items', async () => {
      mockApiGet.mockResolvedValue([
        customItemDto('Apple', 'Fruits'),
        customItemDto('Carrot', 'Vegetables'),
      ]);

      const categories = await service.getCategories();

      expect(categories.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getGroceriesByCategory', () => {
    it('should return API category items when API request succeeds', async () => {
      mockApiGet.mockResolvedValue([
        { id: '1', name: 'Apple', imageUrl: 'apple.jpg', category: 'Fruits', defaultQuantity: 2 },
      ]);

      const items = await service.getGroceriesByCategory('Fruits');

      expect(mockApiGet).toHaveBeenCalledWith('/groceries/by-category?category=Fruits');
      expect(items).toEqual([
        {
          id: '1',
          name: 'Apple',
          image: 'apple.jpg',
          category: 'Fruits',
          defaultQuantity: 2,
        },
      ]);
    });

    it('should fallback to local catalog items when category API fails', async () => {
      mockApiGet.mockImplementation((url: string) => {
        if (url.startsWith('/groceries/by-category')) {
          return Promise.reject(new NetworkError('No internet'));
        }

        if (url === '/shopping-items/custom') {
          return Promise.resolve([
            customItemDto('My Apple', 'Fruits'),
            customItemDto('My Carrot', 'Vegetables'),
          ]);
        }

        return Promise.resolve([]);
      });

      const items = await service.getGroceriesByCategory('Fruits');

      expect(items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'My Apple', category: 'Fruits' }),
        ]),
      );
    });

    it('should fallback to mock category items when API and local category are unavailable', async () => {
      mockApiGet.mockImplementation((url: string) => {
        if (url.startsWith('/groceries/by-category')) {
          return Promise.reject(new Error('Server error'));
        }

        if (url === '/shopping-items/custom') {
          return Promise.resolve([]);
        }

        return Promise.resolve([]);
      });

      const items = await service.getGroceriesByCategory('Fruits');

      expect(items.length).toBeGreaterThan(0);
      expect(items.every(item => item.category?.toLowerCase().includes('fruits'))).toBe(true);
    });

    it('should return mock category items directly when mock data is enabled', async () => {
      mockConfigValue.mockData.enabled = true;

      const items = await service.getGroceriesByCategory('Fruits');

      expect(items.length).toBeGreaterThan(0);
      expect(items.every(item => item.category?.toLowerCase().includes('fruits'))).toBe(true);
      expect(mockApiGet).not.toHaveBeenCalled();
    });
  });

  describe('getFrequentlyAddedItems', () => {
    it('should return first 8 items', async () => {
      const mockResponse = Array.from({ length: 20 }, (_, i) =>
        customItemDto(`Item ${i}`, 'Test')
      );
      mockApiGet.mockResolvedValue(mockResponse);

      const items = await service.getFrequentlyAddedItems();

      expect(items).toHaveLength(8);
    });
  });

  describe('getCatalogData', () => {
    it('should return all catalog data', async () => {
      mockApiGet.mockImplementation((url: string) => {
        if (url === '/groceries/categories') return Promise.resolve(['Fruits']);
        return Promise.resolve([customItemDto('Apple', 'Fruits')]);
      });

      const data = await service.getCatalogData();

      expect(data).toHaveProperty('groceryItems');
      expect(data).toHaveProperty('categories');
      expect(data).toHaveProperty('frequentlyAddedItems');
      expect(data.groceryItems.length).toBeGreaterThanOrEqual(1);
    });

    it('should call API for categories and custom items', async () => {
      mockApiGet.mockImplementation((url: string) => {
        if (url === '/groceries/categories') return Promise.resolve(['Fruits']);
        return Promise.resolve([customItemDto('Apple', 'Fruits')]);
      });

      await service.getCatalogData();

      expect(mockApiGet).toHaveBeenCalledWith('/groceries/categories');
      expect(mockApiGet).toHaveBeenCalledWith('/shopping-items/custom');
    });

    it('should use memoization to prevent redundant API calls', async () => {
      mockApiGet.mockResolvedValue([customItemDto('Apple', 'Fruits')]);

      const [items1, items2, categories, frequentlyAdded] = await Promise.all([
        service.getGroceryItems(),
        service.getGroceryItems(),
        service.getCategories(),
        service.getFrequentlyAddedItems(),
      ]);

      expect(mockApiGet).toHaveBeenCalledTimes(1);
      expect(items1).toEqual(items2);
      expect(categories).toBeDefined();
      expect(frequentlyAdded).toBeDefined();
    });
  });

  describe('clearCache', () => {
    it('should clear grocery items cache', async () => {
      await service.clearCache();

      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(3);
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
        (items: GroceryItem[]) => {
          expect(items.length).toBeGreaterThanOrEqual(2);
        },
      ],
      [
        'not an array',
        JSON.stringify({ not: 'array' }),
        (items: GroceryItem[]) => {
          expect(items.length).toBeGreaterThanOrEqual(2);
        },
      ],
      [
        'array with invalid items',
        JSON.stringify([{ invalid: 'item' }]),
        (items: GroceryItem[]) => {
          expect(items.length).toBeGreaterThanOrEqual(2);
        },
      ],
      [
        'valid cached data',
        JSON.stringify([
          { id: '1', name: 'Cached Apple', image: '', category: 'Fruits', defaultQuantity: 1 },
        ]),
        (items: GroceryItem[]) => {
          expect(items).toEqual(expect.arrayContaining([
            expect.objectContaining({ name: 'Cached Apple', category: 'Fruits' }),
          ]));
          expect(items.length).toBeGreaterThanOrEqual(1);
        },
      ],
    ])('with %s', (description, cachedValue, assertion) => {
      it(`should handle ${description} correctly`, async () => {
        mockConfigValue.mockData.enabled = false;
        mockApiGet.mockRejectedValue(new NetworkError('No internet'));
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(cachedValue);

        const items = await service.getGroceryItems();

        assertion(items);
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
        [customItemDto('Apple', 'Fruits'), customItemDto('Salt', 'Spices')],
        (items: GroceryItem[]) => {
          const hasHousehold = items.some(i => i.category?.toLowerCase().includes('household'));
          expect(hasHousehold).toBe(true);
        },
      ],
      [
        'missing spices category',
        [customItemDto('Apple', 'Fruits'), customItemDto('Paper Towels', 'Household')],
        (items: GroceryItem[]) => {
          const hasSpices = items.some(i => i.category?.toLowerCase().includes('spices'));
          expect(hasSpices).toBe(true);
        },
      ],
      [
        'missing both household and spices categories',
        [customItemDto('Apple', 'Fruits')],
        (items: GroceryItem[]) => {
          const hasHousehold = items.some(i => i.category?.toLowerCase().includes('household'));
          const hasSpices = items.some(i => i.category?.toLowerCase().includes('spices'));
          expect(hasHousehold).toBe(true);
          expect(hasSpices).toBe(true);
        },
      ],
      [
        'both categories already present',
        [customItemDto('Paper Towels', 'Household'), customItemDto('Salt', 'Spices')],
        (items: GroceryItem[]) => {
          const householdItems = items.filter(i => i.category?.toLowerCase().includes('household'));
          const spicesItems = items.filter(i => i.category?.toLowerCase().includes('spices'));
          expect(householdItems.some(i => i.name === 'Paper Towels')).toBe(true);
          expect(spicesItems.some(i => i.name === 'Salt')).toBe(true);
        },
      ],
    ])('with %s', (description, apiResponse, assertion) => {
      it(`should supplement missing categories correctly`, async () => {
        mockApiGet.mockResolvedValue(apiResponse);

        const items = await service.getGroceryItems();

        assertion(items);
        expect(mockApiGet).toHaveBeenCalledWith('/shopping-items/custom');
      });
    });

    it('should not add duplicate items when supplementing', async () => {
      const apiResponse = [
        customItemDto('Paper Towels', 'Household'),
        customItemDto('Salt', 'Spices'),
      ];
      mockApiGet.mockResolvedValue(apiResponse);

      const items = await service.getGroceryItems();

      const itemNames = items.map(i => i.name.toLowerCase());
      const uniqueNames = new Set(itemNames);
      expect(itemNames.length).toBe(uniqueNames.size);
    });
  });
});
