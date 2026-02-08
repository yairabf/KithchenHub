/**
 * Ingredient Mapper Tests
 * 
 * Parameterized tests for ingredient mapper utilities with catalog service integration.
 */

import {
  getIngredientImage,
  getIngredientsImages,
  findGroceryItem,
  clearIngredientImageCache,
  clearAllCaches,
} from '../ingredientMapper';
import { catalogService } from '../../common/services/catalogService';
import type { GroceryItem } from '../../features/shopping/components/GrocerySearchBar';

// Mock catalog service (ingredientMapper uses searchGroceries for on-demand lookup)
jest.mock('../../common/services/catalogService', () => ({
  catalogService: {
    getGroceryItems: jest.fn(),
    searchGroceries: jest.fn(),
  },
}));

const mockGetGroceryItems = catalogService.getGroceryItems as jest.MockedFunction<
  typeof catalogService.getGroceryItems
>;
const mockSearchGroceries = catalogService.searchGroceries as jest.MockedFunction<
  typeof catalogService.searchGroceries
>;

/** Find item by name (case-insensitive) for readable test setup. */
function findMockItemByName(items: GroceryItem[], name: string): GroceryItem | undefined {
  return items.find(i => i.name.toLowerCase() === name.toLowerCase());
}

describe('ingredientMapper', () => {
  /** Queries that should return no results (no-match tests). */
  const QUERIES_NO_MATCH = ['nonexistentitem', 'nonexistent'] as const;
  /** Query for partial-match test: "chicken" should return "Chicken" first, then "Chicken Breast". */
  const QUERY_PARTIAL_CHICKEN = 'chicken';

  const mockGroceryItems: GroceryItem[] = [
    {
      id: '1',
      name: 'Chicken Breast',
      image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100',
      category: 'Meat',
      defaultQuantity: 1,
    },
    {
      id: '2',
      name: 'Olive Oil',
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100',
      category: 'Oils',
      defaultQuantity: 1,
    },
    {
      id: '3',
      name: 'Garlic',
      image: 'https://images.unsplash.com/photo-1544502066-2c4c0e0e0e0e?w=100',
      category: 'Vegetables',
      defaultQuantity: 3,
    },
    {
      id: '4',
      name: 'Chicken',
      image: 'https://images.unsplash.com/photo-chicken?w=100',
      category: 'Meat',
      defaultQuantity: 1,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    clearAllCaches();
    mockGetGroceryItems.mockResolvedValue(mockGroceryItems);
    const chickenItem = findMockItemByName(mockGroceryItems, 'Chicken');
    const chickenBreastItem = findMockItemByName(mockGroceryItems, 'Chicken Breast');
    mockSearchGroceries.mockImplementation((query: string) => {
      if (QUERIES_NO_MATCH.includes(query as (typeof QUERIES_NO_MATCH)[number])) return Promise.resolve([]);
      if (query === QUERY_PARTIAL_CHICKEN && chickenItem && chickenBreastItem) {
        return Promise.resolve([chickenItem, chickenBreastItem]);
      }
      return Promise.resolve(mockGroceryItems);
    });
  });

  describe('getIngredientImage', () => {
    describe.each([
      ['exact match', 'Chicken Breast', 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100'],
      ['case insensitive match', 'chicken breast', 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100'],
      ['with whitespace', '  Chicken Breast  ', 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100'],
      ['partial match (ingredient contains item)', 'chicken', 'https://images.unsplash.com/photo-chicken?w=100'],
      ['partial match (item contains ingredient)', 'Chicken Breast Fillet', 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100'],
      ['no match', 'NonExistentItem', undefined],
      ['empty string', '', undefined],
      ['whitespace only', '   ', undefined],
    ])('with %s', (description, input, expected) => {
      it(`should return ${expected ? 'image URL' : 'undefined'}`, async () => {
        const result = await getIngredientImage(input);
        expect(result).toBe(expected);
      });
    });

    it('should use image cache for repeated calls', async () => {
      const firstCall = await getIngredientImage('Chicken Breast');
      const secondCall = await getIngredientImage('Chicken Breast');
      
      expect(firstCall).toBe(secondCall);
      expect(firstCall).toBe('https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100');
      // Should only call searchGroceries once per unique name due to local cache
      expect(mockSearchGroceries).toHaveBeenCalledTimes(1);
    });

    it('should handle catalog service errors gracefully', async () => {
      mockSearchGroceries.mockRejectedValueOnce(new Error('Service unavailable'));
      
      const result = await getIngredientImage('Chicken Breast');
      
      // Should return undefined on error, not throw
      expect(result).toBeUndefined();
    });

    it('should handle null/undefined input', async () => {
      const nullResult = await getIngredientImage(null as any);
      const undefinedResult = await getIngredientImage(undefined as any);
      
      expect(nullResult).toBeUndefined();
      expect(undefinedResult).toBeUndefined();
    });

    it('should handle concurrent calls without race conditions', async () => {
      // Simulate concurrent calls
      const promises = [
        getIngredientImage('Chicken Breast'),
        getIngredientImage('Olive Oil'),
        getIngredientImage('Garlic'),
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      expect(results[0]).toBe('https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100');
      expect(results[1]).toBe('https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100');
      expect(results[2]).toBe('https://images.unsplash.com/photo-1544502066-2c4c0e0e0e0e?w=100');
      // searchGroceries called per unique ingredient (3 names = 3 calls)
      expect(mockSearchGroceries).toHaveBeenCalledTimes(3);
    });
  });

  describe('getIngredientsImages', () => {
    it('should map multiple ingredient names to images', async () => {
      const result = await getIngredientsImages(['Chicken Breast', 'Olive Oil', 'Garlic']);
      
      expect(result).toEqual({
        'Chicken Breast': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100',
        'Olive Oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100',
        'Garlic': 'https://images.unsplash.com/photo-1544502066-2c4c0e0e0e0e?w=100',
      });
    });

    it('should handle empty array', async () => {
      const result = await getIngredientsImages([]);
      
      expect(result).toEqual({});
    });

    it('should handle mixed matches and non-matches', async () => {
      const result = await getIngredientsImages(['Chicken Breast', 'NonExistent', 'Olive Oil']);
      
      expect(result).toEqual({
        'Chicken Breast': 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100',
        'NonExistent': undefined,
        'Olive Oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=100',
      });
    });

    it('should process items in parallel for performance', async () => {
      const startTime = Date.now();
      await getIngredientsImages(['Chicken Breast', 'Olive Oil', 'Garlic']);
      const duration = Date.now() - startTime;
      
      // Should be fast due to parallel processing and caching
      // With cache, all calls should be nearly instant
      expect(duration).toBeLessThan(100);
    });

    it('should handle catalog service errors gracefully', async () => {
      mockSearchGroceries.mockRejectedValue(new Error('Service unavailable'));
      const result = await getIngredientsImages(['Chicken Breast', 'Olive Oil']);
      expect(result).toEqual({
        'Chicken Breast': undefined,
        'Olive Oil': undefined,
      });
    });
  });

  describe('findGroceryItem', () => {
    describe.each([
      ['exact match', 'Chicken Breast', mockGroceryItems[0]],
      ['case insensitive match', 'chicken breast', mockGroceryItems[0]],
      ['with whitespace', '  Chicken Breast  ', mockGroceryItems[0]],
      ['partial match', 'chicken', mockGroceryItems[3]], // Should match "Chicken" first
      ['no match', 'NonExistentItem', undefined],
      ['empty string', '', undefined],
      ['whitespace only', '   ', undefined],
    ])('with %s', (description, input, expected) => {
      it(`should return ${expected ? 'grocery item' : 'undefined'}`, async () => {
        const result = await findGroceryItem(input);
        expect(result).toEqual(expected);
      });
    });

    it('should return full grocery item, not just image', async () => {
      const result = await findGroceryItem('Chicken Breast');
      
      expect(result).toEqual({
        id: '1',
        name: 'Chicken Breast',
        image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100',
        category: 'Meat',
        defaultQuantity: 1,
      });
    });

    it('should handle catalog service errors gracefully', async () => {
      mockSearchGroceries.mockRejectedValueOnce(new Error('Service unavailable'));
      
      const result = await findGroceryItem('Chicken Breast');
      
      expect(result).toBeUndefined();
    });

    it('should handle null/undefined input', async () => {
      const nullResult = await findGroceryItem(null as any);
      const undefinedResult = await findGroceryItem(undefined as any);
      
      expect(nullResult).toBeUndefined();
      expect(undefinedResult).toBeUndefined();
    });
  });

  describe('cache management', () => {
    it('should clear ingredient image cache', async () => {
      await getIngredientImage('Chicken Breast');
      clearIngredientImageCache();
      await getIngredientImage('Chicken Breast');
      expect(mockSearchGroceries).toHaveBeenCalledTimes(2);
    });

    it('should clear all caches and refetch on next call', async () => {
      await getIngredientImage('Chicken Breast');
      clearAllCaches();
      await getIngredientImage('Olive Oil');
      expect(mockSearchGroceries).toHaveBeenCalledTimes(2);
    });
  });
});
