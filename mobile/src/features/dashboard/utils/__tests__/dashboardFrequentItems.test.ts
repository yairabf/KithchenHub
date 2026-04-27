import type { ShoppingItem } from '../../../../mocks/shopping';
import { buildDashboardFrequentItems } from '../dashboardFrequentItems';

describe('buildDashboardFrequentItems', () => {
  it('returns items ranked from the current shopping data instead of generic catalog data', () => {
    const items = [
      {
        id: '1',
        localId: 'local-1',
        catalogItemId: 'milk',
        name: 'Milk',
        image: 'milk.png',
        quantity: 2,
        category: 'dairy',
        listId: 'main',
        isChecked: false,
      },
      {
        id: '2',
        localId: 'local-2',
        catalogItemId: 'eggs',
        name: 'Eggs',
        image: 'eggs.png',
        quantity: 6,
        category: 'dairy',
        listId: 'main',
        isChecked: false,
      },
      {
        id: '3',
        localId: 'local-3',
        catalogItemId: 'milk',
        name: 'Milk',
        image: '',
        quantity: 1,
        category: 'dairy',
        listId: 'weekly',
        isChecked: true,
      },
    ] satisfies ShoppingItem[];

    const result = buildDashboardFrequentItems(items, 8);

    expect(result.map((item) => item.name)).toEqual(['Eggs', 'Milk']);
    expect(result[1]).toMatchObject({
      id: 'milk',
      image: 'milk.png',
    });
  });

  it('returns an empty array when there is no shopping activity yet', () => {
    expect(buildDashboardFrequentItems([], 8)).toEqual([]);
  });

  it('respects the requested limit', () => {
    const items = [
      {
        id: '1',
        localId: 'local-1',
        name: 'Milk',
        image: 'milk.png',
        quantity: 1,
        category: 'dairy',
        listId: 'main',
        isChecked: false,
      },
      {
        id: '2',
        localId: 'local-2',
        name: 'Bread',
        image: 'bread.png',
        quantity: 1,
        category: 'bakery',
        listId: 'main',
        isChecked: false,
      },
    ] satisfies ShoppingItem[];

    const result = buildDashboardFrequentItems(items, 1);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Milk');
  });
});
