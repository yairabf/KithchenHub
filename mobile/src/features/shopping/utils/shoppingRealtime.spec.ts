import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { GroceryItem } from '../components/GrocerySearchBar';
import type { ShoppingItem, ShoppingList } from '../../../mocks/shopping';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  applyShoppingItemChange,
  applyShoppingListChange,
  buildListIdFilter,
  updateShoppingListItemCounts,
  updateCacheFromRealtimeListEvent,
  updateCacheFromRealtimeItemEvent,
} from './shoppingRealtime';
import { getSignedInCacheKey, ENTITY_TYPES } from '../../../common/storage/dataModeStorage';
import { toPersistedTimestamps } from '../../../common/types/entityMetadata';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

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

describe('updateCacheFromRealtimeListEvent', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('updates cache when list is inserted', async () => {
    // Seed initial cache
    const initialLists: ShoppingList[] = [
      {
        id: 'list-1',
        localId: 'list-1',
        name: 'Weekly',
        itemCount: 0,
        icon: 'cart-outline',
        color: '#10B981',
        createdAt: new Date('2026-01-25T10:00:00Z'),
        updatedAt: new Date('2026-01-25T10:00:00Z'),
      },
    ];
    const storageKey = getSignedInCacheKey(ENTITY_TYPES.shoppingLists);
    await AsyncStorage.setItem(
      storageKey,
      JSON.stringify(initialLists.map(toPersistedTimestamps))
    );

    // Simulate realtime INSERT event
    const payload: RealtimePostgresChangesPayload<ShoppingListRow> = {
      eventType: 'INSERT',
      new: {
        id: 'list-2',
        name: 'Party',
        color: '#F59E0B',
        household_id: 'household-1',
        created_at: '2026-01-25T11:00:00.000Z',
        updated_at: '2026-01-25T11:00:00.000Z',
      },
    } as RealtimePostgresChangesPayload<ShoppingListRow>;

    await updateCacheFromRealtimeListEvent(payload);

    // Verify cache was updated
    const cached = JSON.parse((await AsyncStorage.getItem(storageKey)) || '[]');
    expect(cached).toHaveLength(2);
    expect(cached.find((l: any) => l.id === 'list-2')?.name).toBe('Party');
  });

  it('updates cache when list is updated', async () => {
    // Seed initial cache
    const initialLists: ShoppingList[] = [
      {
        id: 'list-1',
        localId: 'list-1',
        name: 'Weekly',
        itemCount: 0,
        icon: 'cart-outline',
        color: '#10B981',
        createdAt: new Date('2026-01-25T10:00:00Z'),
        updatedAt: new Date('2026-01-25T10:00:00Z'),
      },
    ];
    const storageKey = getSignedInCacheKey(ENTITY_TYPES.shoppingLists);
    await AsyncStorage.setItem(
      storageKey,
      JSON.stringify(initialLists.map(toPersistedTimestamps))
    );

    // Simulate realtime UPDATE event
    const payload: RealtimePostgresChangesPayload<ShoppingListRow> = {
      eventType: 'UPDATE',
      new: {
        id: 'list-1',
        name: 'Updated Weekly',
        color: '#123456',
        household_id: 'household-1',
        created_at: '2026-01-25T10:00:00.000Z',
        updated_at: '2026-01-25T12:00:00.000Z',
      },
    } as RealtimePostgresChangesPayload<ShoppingListRow>;

    await updateCacheFromRealtimeListEvent(payload);

    // Verify cache was updated
    const cached = JSON.parse((await AsyncStorage.getItem(storageKey)) || '[]');
    expect(cached).toHaveLength(1);
    expect(cached[0].name).toBe('Updated Weekly');
  });

  it('updates cache when list is deleted', async () => {
    // Seed initial cache with multiple lists
    const initialLists: ShoppingList[] = [
      {
        id: 'list-1',
        localId: 'list-1',
        name: 'Weekly',
        itemCount: 0,
        icon: 'cart-outline',
        color: '#10B981',
        createdAt: new Date('2026-01-25T10:00:00Z'),
        updatedAt: new Date('2026-01-25T10:00:00Z'),
      },
      {
        id: 'list-2',
        localId: 'list-2',
        name: 'Party',
        itemCount: 0,
        icon: 'cart-outline',
        color: '#F59E0B',
        createdAt: new Date('2026-01-25T11:00:00Z'),
        updatedAt: new Date('2026-01-25T11:00:00Z'),
      },
    ];
    const storageKey = getSignedInCacheKey(ENTITY_TYPES.shoppingLists);
    await AsyncStorage.setItem(
      storageKey,
      JSON.stringify(initialLists.map(toPersistedTimestamps))
    );

    // Simulate realtime DELETE event
    const payload: RealtimePostgresChangesPayload<ShoppingListRow> = {
      eventType: 'DELETE',
      old: { id: 'list-1' },
    } as RealtimePostgresChangesPayload<ShoppingListRow>;

    await updateCacheFromRealtimeListEvent(payload);

    // Verify cache was updated (list-1 removed)
    const cached = JSON.parse((await AsyncStorage.getItem(storageKey)) || '[]');
    expect(cached).toHaveLength(1);
    expect(cached[0].id).toBe('list-2');
  });
});

describe('updateCacheFromRealtimeItemEvent', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('updates cache when item is inserted', async () => {
    // Seed initial cache
    const initialItems: ShoppingItem[] = [
      {
        id: 'item-1',
        localId: 'item-1',
        name: 'Banana',
        image: 'banana.png',
        quantity: 2,
        category: 'Fruits',
        listId: 'list-1',
        isChecked: false,
        createdAt: new Date('2026-01-25T10:00:00Z'),
        updatedAt: new Date('2026-01-25T10:00:00Z'),
      },
    ];
    const storageKey = getSignedInCacheKey(ENTITY_TYPES.shoppingItems);
    await AsyncStorage.setItem(
      storageKey,
      JSON.stringify(initialItems.map(toPersistedTimestamps))
    );

    // Simulate realtime INSERT event
    const payload: RealtimePostgresChangesPayload<ShoppingItemRow> = {
      eventType: 'INSERT',
      new: {
        id: 'item-2',
        list_id: 'list-1',
        name: 'Milk',
        quantity: 1,
        category: 'Dairy',
        is_checked: false,
        created_at: '2026-01-25T11:00:00.000Z',
        updated_at: '2026-01-25T11:00:00.000Z',
      },
    } as RealtimePostgresChangesPayload<ShoppingItemRow>;

    await updateCacheFromRealtimeItemEvent(payload, groceryItems);

    // Verify cache was updated
    const cached = JSON.parse((await AsyncStorage.getItem(storageKey)) || '[]');
    expect(cached).toHaveLength(2);
    const newItem = cached.find((i: any) => i.id === 'item-2');
    expect(newItem?.name).toBe('Milk');
    expect(newItem?.image).toBe('milk.png'); // Should match grocery item
  });

  it('updates cache when item is checked off (UPDATE)', async () => {
    // Seed initial cache
    const initialItems: ShoppingItem[] = [
      {
        id: 'item-1',
        localId: 'item-1',
        name: 'Banana',
        image: 'banana.png',
        quantity: 2,
        category: 'Fruits',
        listId: 'list-1',
        isChecked: false,
        createdAt: new Date('2026-01-25T10:00:00Z'),
        updatedAt: new Date('2026-01-25T10:00:00Z'),
      },
    ];
    const storageKey = getSignedInCacheKey(ENTITY_TYPES.shoppingItems);
    await AsyncStorage.setItem(
      storageKey,
      JSON.stringify(initialItems.map(toPersistedTimestamps))
    );

    // Simulate realtime UPDATE event (item checked off)
    const payload: RealtimePostgresChangesPayload<ShoppingItemRow> = {
      eventType: 'UPDATE',
      new: {
        id: 'item-1',
        list_id: 'list-1',
        name: 'Banana',
        quantity: 2,
        category: 'Fruits',
        is_checked: true, // Item checked off
        created_at: '2026-01-25T10:00:00.000Z',
        updated_at: '2026-01-25T12:00:00.000Z',
      },
    } as RealtimePostgresChangesPayload<ShoppingItemRow>;

    await updateCacheFromRealtimeItemEvent(payload, groceryItems);

    // Verify cache was updated
    const cached = JSON.parse((await AsyncStorage.getItem(storageKey)) || '[]');
    expect(cached).toHaveLength(1);
    expect(cached[0].isChecked).toBe(true);
  });

  it('updates cache when item is deleted', async () => {
    // Seed initial cache with multiple items
    const initialItems: ShoppingItem[] = [
      {
        id: 'item-1',
        localId: 'item-1',
        name: 'Banana',
        image: 'banana.png',
        quantity: 2,
        category: 'Fruits',
        listId: 'list-1',
        isChecked: false,
        createdAt: new Date('2026-01-25T10:00:00Z'),
        updatedAt: new Date('2026-01-25T10:00:00Z'),
      },
      {
        id: 'item-2',
        localId: 'item-2',
        name: 'Milk',
        image: 'milk.png',
        quantity: 1,
        category: 'Dairy',
        listId: 'list-1',
        isChecked: false,
        createdAt: new Date('2026-01-25T11:00:00Z'),
        updatedAt: new Date('2026-01-25T11:00:00Z'),
      },
    ];
    const storageKey = getSignedInCacheKey(ENTITY_TYPES.shoppingItems);
    await AsyncStorage.setItem(
      storageKey,
      JSON.stringify(initialItems.map(toPersistedTimestamps))
    );

    // Simulate realtime DELETE event
    const payload: RealtimePostgresChangesPayload<ShoppingItemRow> = {
      eventType: 'DELETE',
      old: { id: 'item-1' },
    } as RealtimePostgresChangesPayload<ShoppingItemRow>;

    await updateCacheFromRealtimeItemEvent(payload, groceryItems);

    // Verify cache was updated (item-1 removed)
    const cached = JSON.parse((await AsyncStorage.getItem(storageKey)) || '[]');
    expect(cached).toHaveLength(1);
    expect(cached[0].id).toBe('item-2');
  });
});
