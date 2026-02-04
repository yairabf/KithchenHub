import { compareGroceryItemsForSearch } from '../searchSortingUtils';
import { GroceryItem } from '../types';

const makeGroceryItem = (
  id: string,
  name: string,
  category: string = 'Fruits',
  image: string = '',
  defaultQuantity: number = 1
): GroceryItem => ({
  id,
  name,
  category,
  image,
  defaultQuantity,
});

describe('compareGroceryItemsForSearch', () => {
  describe.each([
    [
      'exact match custom item appears before catalog items',
      [
        makeGroceryItem('catalog-1', 'Apple', 'Fruits'),
        makeGroceryItem('custom-1', 'app', 'bakery'),
      ],
      'app',
      ['custom-1', 'catalog-1'], // Expected order (by ID)
    ],
    [
      'exact match custom item appears before exact match catalog item',
      [
        makeGroceryItem('custom-1', 'apple', 'Fruits'),
        makeGroceryItem('catalog-1', 'apple', 'Fruits'),
      ],
      'apple',
      ['custom-1', 'catalog-1'],
    ],
    [
      'exact match catalog items appear before starts-with matches',
      [
        makeGroceryItem('custom-2', 'apples', 'Fruits'),
        makeGroceryItem('catalog-1', 'app', 'Other'),
      ],
      'app',
      ['catalog-1', 'custom-2'],
    ],
    [
      'starts-with custom items appear before starts-with catalog items',
      [
        makeGroceryItem('catalog-1', 'Apple Juice', 'Beverages'),
        makeGroceryItem('custom-1', 'apples', 'Fruits'),
      ],
      'app',
      ['custom-1', 'catalog-1'],
    ],
    [
      'starts-with matches appear before partial matches',
      [
        makeGroceryItem('custom-2', 'pineapple', 'Fruits'),
        makeGroceryItem('custom-1', 'apples', 'Fruits'),
      ],
      'app',
      ['custom-1', 'custom-2'],
    ],
    [
      'custom items appear before catalog items for partial matches',
      [
        makeGroceryItem('catalog-1', 'Pineapple', 'Fruits'),
        makeGroceryItem('custom-1', 'app', 'bakery'),
      ],
      'app',
      ['custom-1', 'catalog-1'],
    ],
    [
      'alphabetical sorting within same priority group',
      [
        makeGroceryItem('custom-2', 'banana', 'Fruits'),
        makeGroceryItem('custom-1', 'apple', 'Fruits'),
      ],
      'a',
      ['custom-1', 'custom-2'], // apple before banana
    ],
    [
      'case-insensitive exact matching',
      [
        makeGroceryItem('custom-1', 'APP', 'bakery'),
        makeGroceryItem('catalog-1', 'Apple', 'Fruits'),
      ],
      'app',
      ['custom-1', 'catalog-1'],
    ],
    [
      'multiple exact matches prioritize custom items',
      [
        makeGroceryItem('catalog-2', 'app', 'Other'),
        makeGroceryItem('catalog-1', 'app', 'Other'),
        makeGroceryItem('custom-1', 'app', 'bakery'),
      ],
      'app',
      ['custom-1', 'catalog-1', 'catalog-2'], // custom first, then alphabetical
    ],
    [
      'mixed match types with custom items prioritized',
      [
        makeGroceryItem('catalog-3', 'grape', 'Fruits'), // partial match
        makeGroceryItem('custom-2', 'apple pie', 'bakery'), // starts-with
        makeGroceryItem('catalog-2', 'apple juice', 'Beverages'), // starts-with
        makeGroceryItem('custom-1', 'apple', 'Fruits'), // exact match
        makeGroceryItem('catalog-1', 'apple', 'Fruits'), // exact match
      ],
      'apple',
      ['custom-1', 'catalog-1', 'custom-2', 'catalog-2', 'catalog-3'],
    ],
  ])('%s', (description, items, query, expectedOrder) => {
    it(`should sort results correctly for query "${query}"`, () => {
      const sorted = [...items].sort((a, b) =>
        compareGroceryItemsForSearch(a, b, query.toLowerCase())
      );
      
      const sortedIds = sorted.map(item => item.id);
      expect(sortedIds).toEqual(expectedOrder);
    });
  });

  describe('edge cases', () => {
    it('handles empty query', () => {
      const items = [
        makeGroceryItem('custom-1', 'apple', 'Fruits'),
        makeGroceryItem('catalog-1', 'banana', 'Fruits'),
      ];
      
      const sorted = [...items].sort((a, b) =>
        compareGroceryItemsForSearch(a, b, '')
      );
      
      // Should sort alphabetically when query is empty
      expect(sorted[0].name.toLowerCase()).toBe('apple');
      expect(sorted[1].name.toLowerCase()).toBe('banana');
    });

    it('handles items with same name and priority', () => {
      const items = [
        makeGroceryItem('custom-2', 'apple', 'Fruits'),
        makeGroceryItem('custom-1', 'apple', 'Fruits'),
      ];
      
      const sorted = [...items].sort((a, b) =>
        compareGroceryItemsForSearch(a, b, 'apple')
      );
      
      // Should maintain stable order (alphabetical by name, then by ID if names match)
      // Since names are identical, order should be stable
      expect(sorted.length).toBe(2);
    });

    it('handles query with special characters', () => {
      const items = [
        makeGroceryItem('custom-1', 'café', 'Other'),
        makeGroceryItem('catalog-1', 'cafe', 'Other'),
      ];
      
      const sorted = [...items].sort((a, b) =>
        compareGroceryItemsForSearch(a, b, 'caf')
      );
      
      // Both should match starts-with, custom first
      expect(sorted[0].id).toBe('custom-1');
    });
  });
});
