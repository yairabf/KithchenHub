/**
 * Catalog Utils Tests
 * 
 * Parameterized tests for catalog utility functions.
 */

import { buildCategoriesFromGroceries, buildFrequentlyAddedItems } from '../catalogUtils';
import type { GroceryItem } from '../../../features/shopping/components/GrocerySearchBar';
import type { Category } from '../../../mocks/shopping';

describe('buildCategoriesFromGroceries', () => {
  describe.each([
    [
      'empty array',
      [],
      [],
    ],
    [
      'single item',
      [{ id: '1', name: 'Apple', image: '', category: 'Fruits', defaultQuantity: 1 }],
      [{ name: 'Fruits', itemCount: 1 }],
    ],
    [
      'multiple items same category',
      [
        { id: '1', name: 'Apple', image: '', category: 'Fruits', defaultQuantity: 1 },
        { id: '2', name: 'Banana', image: '', category: 'Fruits', defaultQuantity: 1 },
      ],
      [{ name: 'Fruits', itemCount: 2 }],
    ],
    [
      'multiple categories',
      [
        { id: '1', name: 'Apple', image: '', category: 'Fruits', defaultQuantity: 1 },
        { id: '2', name: 'Carrot', image: '', category: 'Vegetables', defaultQuantity: 1 },
      ],
      [{ name: 'Fruits', itemCount: 1 }, { name: 'Vegetables', itemCount: 1 }],
    ],
    [
      'items with missing category',
      [
        { id: '1', name: 'Apple', image: '', category: 'Fruits', defaultQuantity: 1 },
        { id: '2', name: 'Unknown', image: '', category: '', defaultQuantity: 1 },
      ],
      [{ name: 'Fruits', itemCount: 1 }, { name: 'Other', itemCount: 1 }],
    ],
    [
      'items with null category',
      [
        { id: '1', name: 'Apple', image: '', category: 'Fruits', defaultQuantity: 1 },
        { id: '2', name: 'Unknown', image: '', category: null as any, defaultQuantity: 1 },
      ],
      [{ name: 'Fruits', itemCount: 1 }, { name: 'Other', itemCount: 1 }],
    ],
  ])('with %s', (description, items, expectedCategories) => {
    it(`should build categories correctly`, () => {
      const categories = buildCategoriesFromGroceries(items as GroceryItem[]);

      expect(categories).toHaveLength(expectedCategories.length);
      
      expectedCategories.forEach((expected, index) => {
        expect(categories[index].name).toBe(expected.name);
        expect(categories[index].itemCount).toBe(expected.itemCount);
        expect(categories[index]).toHaveProperty('id');
        expect(categories[index]).toHaveProperty('localId');
        expect(categories[index]).toHaveProperty('image');
        expect(categories[index]).toHaveProperty('backgroundColor');
      });
    });
  });

  it('should generate deterministic localId for same category name', () => {
    const items: GroceryItem[] = [
      { id: '1', name: 'Apple', image: '', category: 'Fruits', defaultQuantity: 1 },
    ];

    const categories1 = buildCategoriesFromGroceries(items);
    const categories2 = buildCategoriesFromGroceries(items);

    expect(categories1[0].localId).toBe(categories2[0].localId);
  });

  it('should use first item image as category fallback image', () => {
    const items: GroceryItem[] = [
      { id: '1', name: 'Apple', image: 'apple.jpg', category: 'Fruits', defaultQuantity: 1 },
      { id: '2', name: 'Banana', image: '', category: 'Fruits', defaultQuantity: 1 },
    ];

    const categories = buildCategoriesFromGroceries(items);

    expect(categories[0].image).toBe('apple.jpg');
  });

  it('should use empty string if no items have images', () => {
    const items: GroceryItem[] = [
      { id: '1', name: 'Apple', image: '', category: 'Fruits', defaultQuantity: 1 },
    ];

    const categories = buildCategoriesFromGroceries(items);

    expect(categories[0].image).toBe('');
  });
});

describe('buildFrequentlyAddedItems', () => {
  describe.each([
    [
      'empty array',
      [],
      8,
      0,
    ],
    [
      'fewer items than limit',
      [
        { id: '1', name: 'Apple', image: '', category: 'Fruits', defaultQuantity: 1 },
        { id: '2', name: 'Banana', image: '', category: 'Fruits', defaultQuantity: 1 },
      ],
      8,
      2,
    ],
    [
      'exactly limit items',
      Array.from({ length: 8 }, (_, i) => ({
        id: `${i}`,
        name: `Item ${i}`,
        image: '',
        category: 'Test',
        defaultQuantity: 1,
      })),
      8,
      8,
    ],
    [
      'more items than limit',
      Array.from({ length: 20 }, (_, i) => ({
        id: `${i}`,
        name: `Item ${i}`,
        image: '',
        category: 'Test',
        defaultQuantity: 1,
      })),
      8,
      8,
    ],
    [
      'custom limit',
      Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        name: `Item ${i}`,
        image: '',
        category: 'Test',
        defaultQuantity: 1,
      })),
      5,
      5,
    ],
  ])('with %s', (description, items, limit, expectedCount) => {
    it(`should return ${expectedCount} items`, () => {
      const result = buildFrequentlyAddedItems(items as GroceryItem[], limit);

      expect(result).toHaveLength(expectedCount);
      expect(result).toEqual(items.slice(0, limit));
    });
  });

  it('should use default limit of 8 when limit not provided', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: `${i}`,
      name: `Item ${i}`,
      image: '',
      category: 'Test',
      defaultQuantity: 1,
    }));

    const result = buildFrequentlyAddedItems(items as GroceryItem[]);

    expect(result).toHaveLength(8);
  });

  it('should preserve item order', () => {
    const items: GroceryItem[] = [
      { id: '1', name: 'Apple', image: '', category: 'Fruits', defaultQuantity: 1 },
      { id: '2', name: 'Banana', image: '', category: 'Fruits', defaultQuantity: 1 },
      { id: '3', name: 'Carrot', image: '', category: 'Vegetables', defaultQuantity: 1 },
    ];

    const result = buildFrequentlyAddedItems(items, 2);

    expect(result[0].id).toBe('1');
    expect(result[1].id).toBe('2');
  });
});
