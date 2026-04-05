import type { RealtimePostgresChangesPayload } from './shoppingRealtime';
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
  catalog_item_id?: string | null;
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

describe('applyShoppingItemChange – localized name preservation', () => {
  it.each([
    ['Hebrew', 'תפוח אדום'],
    ['Spanish', 'Manzana'],
    ['French', 'Pomme'],
  ])(
    'prefers the existing in-memory %s name over the English DB row name on UPDATE',
    (_lang, localizedName) => {
      const itemWithLocalizedName: ShoppingItem = {
        ...baseItems[0],
        name: localizedName,
      };

      const payload: RealtimePostgresChangesPayload<ShoppingItemRow> = {
        eventType: 'UPDATE',
        new: {
          id: 'item-1',
          list_id: 'list-1',
          name: 'Banana',   // English canonical name from DB
          quantity: 3,
          category: 'Fruits',
          is_checked: false,
        },
        old: null,
      };

      const result = applyShoppingItemChange(
        [itemWithLocalizedName],
        payload,
        groceryItems,
      );

      expect(result[0].name).toBe(localizedName);
    },
  );

  it('uses the DB row name when no existing in-memory item exists (INSERT)', () => {
    const payload: RealtimePostgresChangesPayload<ShoppingItemRow> = {
      eventType: 'INSERT',
      new: {
        id: 'item-new',
        list_id: 'list-1',
        name: 'Banana',
        quantity: 1,
        category: 'Fruits',
        is_checked: false,
      },
      old: null,
    };

    const result = applyShoppingItemChange([], payload, groceryItems);

    expect(result[0].name).toBe('Banana');
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

describe('applyShoppingItemChange – catalogItemId deduplication', () => {
  // An optimistic item that was created with a Hebrew name and a client-side
  // temporary ID (simulates the item sitting in state before the API responds).
  // createShoppingItem always generates id !== localId (id = 'item-{timestamp}',
  // localId = randomUUID()), so a realistic optimistic item has different values.
  const hebrewOptimisticItem: ShoppingItem = {
    id: 'item-1234567890',   // client-generated temp id (item-{Date.now()} pattern)
    localId: 'uuid-abc-def', // client-generated stable localId (randomUUID pattern)
    name: 'תפוחים',           // Hebrew for "apples"
    catalogItemId: 'cat-apple',
    image: 'apple.png',
    quantity: 1,
    category: 'Fruits',
    listId: 'list-1',
    isChecked: false,
  };

  describe.each([
    [
      'Hebrew name vs English DB name – match by catalogItemId',
      'תפוחים',       // existing localized name
      'Red Apple',    // English name stored in DB
      'cat-apple',    // catalog_item_id in DB row matches optimistic item
    ],
    [
      'Spanish name vs English DB name – match by catalogItemId',
      'Manzana',
      'Red Apple',
      'cat-apple',
    ],
  ])(
    '%s',
    (_label, localizedName, dbName, catalogItemId) => {
      const optimisticItem: ShoppingItem = {
        ...hebrewOptimisticItem,
        name: localizedName,
        catalogItemId,
      };

      const realtimeInsertPayload: RealtimePostgresChangesPayload<ShoppingItemRow> = {
        eventType: 'INSERT',
        new: {
          id: 'server-uuid-apple',
          list_id: 'list-1',
          catalog_item_id: catalogItemId,
          name: dbName,
          quantity: 1,
          category: 'Fruits',
          is_checked: false,
        },
        old: null,
      };

      it('replaces the optimistic item – no duplicate created', () => {
        const result = applyShoppingItemChange(
          [optimisticItem],
          realtimeInsertPayload,
          groceryItems,
        );

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('server-uuid-apple');
      });

      it('preserves the localized name after the replace', () => {
        const result = applyShoppingItemChange(
          [optimisticItem],
          realtimeInsertPayload,
          groceryItems,
        );

        expect(result[0].name).toBe(localizedName);
      });

      it('carries the catalogItemId from the DB row onto the merged item', () => {
        const result = applyShoppingItemChange(
          [optimisticItem],
          realtimeInsertPayload,
          groceryItems,
        );

        expect(result[0].catalogItemId).toBe(catalogItemId);
      });
    },
  );

  it('does NOT replace a confirmed server item that shares a catalogItemId on a new INSERT', () => {
    // A server-confirmed item has localId === id (set via mapItemRowToItem without an existing entity)
    const confirmedItem: ShoppingItem = {
      id: 'server-confirmed-1',
      localId: 'server-confirmed-1', // localId === id → confirmed, not optimistic
      name: 'Red Apple',
      catalogItemId: 'cat-apple',
      image: 'apple.png',
      quantity: 1,
      category: 'Fruits',
      listId: 'list-1',
      isChecked: false,
    };

    const insertPayload: RealtimePostgresChangesPayload<ShoppingItemRow> = {
      eventType: 'INSERT',
      new: {
        id: 'server-uuid-apple-2',
        list_id: 'list-1',
        catalog_item_id: 'cat-apple',
        name: 'Red Apple',
        quantity: 1,
        category: 'Fruits',
        is_checked: false,
      },
      old: null,
    };

    // The realtime INSERT should be treated as a new item (different server id)
    // and must NOT silently replace the already-confirmed item.
    const result = applyShoppingItemChange([confirmedItem], insertPayload, groceryItems);

    expect(result).toHaveLength(2);
    expect(result.map((i) => i.id)).toContain('server-confirmed-1');
    expect(result.map((i) => i.id)).toContain('server-uuid-apple-2');
  });

  it('still adds a genuinely new item when catalogItemId does not match anything in state', () => {
    const unrelatedItem: ShoppingItem = {
      ...hebrewOptimisticItem,
      catalogItemId: 'cat-milk',
    };

    const realtimeInsertPayload: RealtimePostgresChangesPayload<ShoppingItemRow> = {
      eventType: 'INSERT',
      new: {
        id: 'server-uuid-apple',
        list_id: 'list-1',
        catalog_item_id: 'cat-apple',
        name: 'Red Apple',
        quantity: 1,
        category: 'Fruits',
        is_checked: false,
      },
      old: null,
    };

    const result = applyShoppingItemChange(
      [unrelatedItem],
      realtimeInsertPayload,
      groceryItems,
    );

    expect(result).toHaveLength(2);
    expect(result.map((i) => i.id)).toContain('server-uuid-apple');
  });
});
