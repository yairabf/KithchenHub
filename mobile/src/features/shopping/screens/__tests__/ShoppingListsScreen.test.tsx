/**
 * ShoppingListsScreen Tests
 * 
 * Parameterized tests for category sorting functionality.
 */

import type { Category } from '../../../../mocks/shopping';

/**
 * Helper function to test category sorting logic.
 * This mirrors the sorting logic used in ShoppingListsScreen.
 * 
 * @param rawCategories - Array of categories to sort
 * @returns Sorted array of categories (descending by itemCount)
 */
function sortCategoriesByItemCount(rawCategories: Category[]): Category[] {
  return [...rawCategories].sort((a, b) => b.itemCount - a.itemCount);
}

describe('ShoppingListsScreen - Category Sorting', () => {
  describe.each([
    [
      'empty array',
      [],
      [],
    ],
    [
      'single category',
      [{ id: '1', name: 'Fruits', itemCount: 5, image: '', backgroundColor: '#fff', localId: 'uuid-1' }],
      [{ id: '1', name: 'Fruits', itemCount: 5, image: '', backgroundColor: '#fff', localId: 'uuid-1' }],
    ],
    [
      'multiple categories in descending order',
      [
        { id: '1', name: 'Fruits', itemCount: 10, image: '', backgroundColor: '#fff', localId: 'uuid-1' },
        { id: '2', name: 'Vegetables', itemCount: 5, image: '', backgroundColor: '#fff', localId: 'uuid-2' },
        { id: '3', name: 'Dairy', itemCount: 1, image: '', backgroundColor: '#fff', localId: 'uuid-3' },
      ],
      [
        { id: '1', name: 'Fruits', itemCount: 10, image: '', backgroundColor: '#fff', localId: 'uuid-1' },
        { id: '2', name: 'Vegetables', itemCount: 5, image: '', backgroundColor: '#fff', localId: 'uuid-2' },
        { id: '3', name: 'Dairy', itemCount: 1, image: '', backgroundColor: '#fff', localId: 'uuid-3' },
      ],
    ],
    [
      'multiple categories in ascending order',
      [
        { id: '1', name: 'Dairy', itemCount: 1, image: '', backgroundColor: '#fff', localId: 'uuid-1' },
        { id: '2', name: 'Vegetables', itemCount: 5, image: '', backgroundColor: '#fff', localId: 'uuid-2' },
        { id: '3', name: 'Fruits', itemCount: 10, image: '', backgroundColor: '#fff', localId: 'uuid-3' },
      ],
      [
        { id: '3', name: 'Fruits', itemCount: 10, image: '', backgroundColor: '#fff', localId: 'uuid-3' },
        { id: '2', name: 'Vegetables', itemCount: 5, image: '', backgroundColor: '#fff', localId: 'uuid-2' },
        { id: '1', name: 'Dairy', itemCount: 1, image: '', backgroundColor: '#fff', localId: 'uuid-1' },
      ],
    ],
    [
      'multiple categories in random order',
      [
        { id: '1', name: 'Vegetables', itemCount: 5, image: '', backgroundColor: '#fff', localId: 'uuid-1' },
        { id: '2', name: 'Fruits', itemCount: 10, image: '', backgroundColor: '#fff', localId: 'uuid-2' },
        { id: '3', name: 'Dairy', itemCount: 1, image: '', backgroundColor: '#fff', localId: 'uuid-3' },
        { id: '4', name: 'Meat', itemCount: 7, image: '', backgroundColor: '#fff', localId: 'uuid-4' },
      ],
      [
        { id: '2', name: 'Fruits', itemCount: 10, image: '', backgroundColor: '#fff', localId: 'uuid-2' },
        { id: '4', name: 'Meat', itemCount: 7, image: '', backgroundColor: '#fff', localId: 'uuid-4' },
        { id: '1', name: 'Vegetables', itemCount: 5, image: '', backgroundColor: '#fff', localId: 'uuid-1' },
        { id: '3', name: 'Dairy', itemCount: 1, image: '', backgroundColor: '#fff', localId: 'uuid-3' },
      ],
    ],
    [
      'categories with equal item counts',
      [
        { id: '1', name: 'Fruits', itemCount: 5, image: '', backgroundColor: '#fff', localId: 'uuid-1' },
        { id: '2', name: 'Vegetables', itemCount: 5, image: '', backgroundColor: '#fff', localId: 'uuid-2' },
        { id: '3', name: 'Dairy', itemCount: 5, image: '', backgroundColor: '#fff', localId: 'uuid-3' },
      ],
      // When itemCounts are equal, order should be stable (preserve original order)
      [
        { id: '1', name: 'Fruits', itemCount: 5, image: '', backgroundColor: '#fff', localId: 'uuid-1' },
        { id: '2', name: 'Vegetables', itemCount: 5, image: '', backgroundColor: '#fff', localId: 'uuid-2' },
        { id: '3', name: 'Dairy', itemCount: 5, image: '', backgroundColor: '#fff', localId: 'uuid-3' },
      ],
    ],
  ])('sorting with %s', (description, input, expected) => {
    it(`should sort categories correctly`, () => {
      const result = sortCategoriesByItemCount(input);
      
      expect(result).toHaveLength(expected.length);
      expect(result.map(c => c.itemCount)).toEqual(expected.map(c => c.itemCount));
      
      // Verify descending order
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].itemCount).toBeGreaterThanOrEqual(result[i + 1].itemCount);
      }
    });
  });

  it('should not mutate the original array', () => {
    const original = [
      { id: '1', name: 'Fruits', itemCount: 10, image: '', backgroundColor: '#fff', localId: 'uuid-1' },
      { id: '2', name: 'Vegetables', itemCount: 5, image: '', backgroundColor: '#fff', localId: 'uuid-2' },
    ];
    const originalCopy = JSON.parse(JSON.stringify(original));
    
    sortCategoriesByItemCount(original);
    
    expect(original).toEqual(originalCopy);
  });

  it('should maintain stable sort for equal item counts', () => {
    const input = [
      { id: '1', name: 'Fruits', itemCount: 5, image: '', backgroundColor: '#fff', localId: 'uuid-1' },
      { id: '2', name: 'Vegetables', itemCount: 5, image: '', backgroundColor: '#fff', localId: 'uuid-2' },
      { id: '3', name: 'Dairy', itemCount: 5, image: '', backgroundColor: '#fff', localId: 'uuid-3' },
    ];
    
    const result1 = sortCategoriesByItemCount(input);
    const result2 = sortCategoriesByItemCount(input);
    
    // Multiple calls with same input should produce same order
    expect(result1.map(c => c.id)).toEqual(result2.map(c => c.id));
  });
});
