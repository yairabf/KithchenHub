import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { GroceryItem } from '../components/GrocerySearchBar';
import type { ShoppingItem, ShoppingList } from '../../../mocks/shopping';
import {
  applyShoppingItemChange,
  applyShoppingListChange,
  buildListIdFilter,
  updateShoppingListItemCounts,
} from './shoppingRealtime';

type ShoppingListRow = {
  id: string;
  name: string;
  color?: string | null;
  household_id?: string | null;
};

type ShoppingItemRow = {
  id: string;
  list_id: string;
  name: string;
  quantity?: number | null;
  category?: string | null;
  is_checked?: boolean | null;
};

const baseLists: ShoppingList[] = [
  {
    id: 'list-1',
    localId: 'list-1',
    name: 'Weekly',
    itemCount: 1,
    icon: 'cart-outline',
    color: '#10B981',
  },
];

const baseItems: ShoppingItem[] = [
  {
    id: 'item-1',
    localId: 'item-1',
    name: 'Banana',
    image: 'banana.png',
    quantity: 2,
    category: 'Fruits',
    listId: 'list-1',
    isChecked: false,
  },
];

const groceryItems: GroceryItem[] = [
  {
    id: 'g-1',
    name: 'Milk',
    image: 'milk.png',
    category: 'Dairy',
    defaultQuantity: 1,
  },
];

describe('applyShoppingListChange', () => {
  describe.each([
    [
      'INSERT',
      {
        eventType: 'INSERT',
        new: { id: 'list-2', name: 'Party', color: '#F59E0B' },
      },
      ['list-1', 'list-2'],
      'Party',
    ],
    [
      'UPDATE',
      {
        eventType: 'UPDATE',
        new: { id: 'list-1', name: 'Updated Weekly', color: '#123456' },
      },
      ['list-1'],
      'Updated Weekly',
    ],
    [
      'DELETE',
      {
        eventType: 'DELETE',
        old: { id: 'list-1' },
      },
      [],
      '',
    ],
  ])('handles %s events', (_label, payload, expectedIds, expectedName) => {
    const result = applyShoppingListChange(
      baseLists,
      payload as RealtimePostgresChangesPayload<ShoppingListRow>,
    );

    expect(result.map((list) => list.id)).toEqual(expectedIds);

    if (expectedName) {
      // For INSERT, the new list is added at the end, so check the last item
      // For UPDATE, check the first item (the updated one)
      const listToCheck = payload.eventType === 'INSERT' 
        ? result[result.length - 1]
        : result[0];
      expect(listToCheck?.name).toBe(expectedName);
    }
  });
});

describe('applyShoppingItemChange', () => {
  describe.each([
    [
      'INSERT',
      {
        eventType: 'INSERT',
        new: {
          id: 'item-2',
          list_id: 'list-1',
          name: 'Milk',
          quantity: 1,
          category: 'Dairy',
          is_checked: false,
        },
      },
      ['item-1', 'item-2'],
      'milk.png',
    ],
    [
      'UPDATE',
      {
        eventType: 'UPDATE',
        new: {
          id: 'item-1',
          list_id: 'list-1',
          name: 'Banana',
          quantity: 5,
          category: 'Fruits',
          is_checked: true,
        },
      },
      ['item-1'],
      'banana.png',
    ],
    [
      'DELETE',
      {
        eventType: 'DELETE',
        old: { id: 'item-1' },
      },
      [],
      '',
    ],
  ])('handles %s events', (_label, payload, expectedIds, expectedImage) => {
    const result = applyShoppingItemChange(
      baseItems,
      payload as RealtimePostgresChangesPayload<ShoppingItemRow>,
      groceryItems,
    );

    expect(result.map((item) => item.id)).toEqual(expectedIds);

    if (expectedImage) {
      // For INSERT, the new item is added at the end, so check the last item
      // For UPDATE, check the first item (the updated one)
      const itemToCheck = payload.eventType === 'INSERT' 
        ? result[result.length - 1]
        : result[0];
      expect(itemToCheck?.image).toBe(expectedImage);
    }
  });
});

describe('updateShoppingListItemCounts', () => {
  it('updates item counts based on items', () => {
    const lists: ShoppingList[] = [
      { ...baseLists[0], itemCount: 0 },
      {
        id: 'list-2',
        localId: 'list-2',
        name: 'Party',
        itemCount: 0,
        icon: 'cart-outline' as ShoppingList['icon'],
        color: '#F59E0B',
      },
    ];
    const items = [
      ...baseItems,
      {
        id: 'item-2',
        localId: 'item-2',
        name: 'Milk',
        image: 'milk.png',
        quantity: 1,
        category: 'Dairy',
        listId: 'list-2',
        isChecked: false,
      },
    ];

    const result = updateShoppingListItemCounts(lists, items);

    expect(result.find((list) => list.id === 'list-1')?.itemCount).toBe(1);
    expect(result.find((list) => list.id === 'list-2')?.itemCount).toBe(1);
  });
});

describe('buildListIdFilter', () => {
  describe.each([
    ['no list ids', [], null],
    ['single id', ['list-1'], 'list_id=in.(list-1)'],
    ['multiple ids', ['list-2', 'list-1'], 'list_id=in.(list-1,list-2)'],
  ])('when %s', (_label, listIds, expected) => {
    expect(buildListIdFilter(listIds)).toBe(expected);
  });
});
