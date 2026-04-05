/**
 * Tests for quickAddUtils.
 *
 * Covers: quickAddItem – create path, update path, localized name preservation.
 */

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid'),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: {},
}));

import type { GroceryItem } from '../components/GrocerySearchBar';
import type { ShoppingItem, ShoppingList } from '../../../mocks/shopping';
import { quickAddItem } from './quickAddUtils';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeGroceryItem = (overrides: Partial<GroceryItem> = {}): GroceryItem => ({
  id: 'catalog-1',
  name: 'Red Apple',
  image: 'apple.png',
  category: 'Fruits',
  defaultQuantity: 1,
  ...overrides,
});

const makeList = (overrides: Partial<ShoppingList> = {}): ShoppingList =>
  ({
    id: 'list-1',
    localId: 'list-1',
    name: 'Weekly',
    itemCount: 0,
    icon: 'cart-outline',
    color: '#10B981',
    ...overrides,
  }) as ShoppingList;

const makeServerItem = (overrides: Partial<ShoppingItem> = {}): ShoppingItem =>
  ({
    id: 'cuid-server-1',
    localId: 'cuid-server-1',
    name: 'Red Apple',      // server always returns English canonical name
    image: 'apple.png',
    quantity: 1,
    category: 'Fruits',
    listId: 'list-1',
    isChecked: false,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }) as ShoppingItem;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('quickAddItem – create new item', () => {
  it('adds a temp item optimistically then replaces it with the server item', async () => {
    const serverItem = makeServerItem();
    const createItem = jest.fn().mockResolvedValue(serverItem);
    const updateItem = jest.fn();
    const logError = jest.fn();

    let items: ShoppingItem[] = [];
    const setAllItems = jest.fn((updater) => {
      items = typeof updater === 'function' ? updater(items) : updater;
    });
    const executeWithOptimisticUpdate = jest.fn();

    await quickAddItem(makeGroceryItem(), makeList(), {
      allItems: items,
      setAllItems,
      createItem,
      updateItem,
      executeWithOptimisticUpdate,
      logError,
    });

    expect(createItem).toHaveBeenCalledTimes(1);
    // Final state should contain exactly the server-confirmed item
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('cuid-server-1');
  });

  it.each([
    ['Hebrew', 'תפוח אדום'],
    ['Spanish', 'Manzana Roja'],
    ['French', 'Pomme Rouge'],
    ['English (same as server)', 'Red Apple'],
  ])(
    'preserves the %s localized name from the temp item instead of the English server name',
    async (_lang, localizedName) => {
      const serverItem = makeServerItem({ name: 'Red Apple' }); // English from DB
      const createItem = jest.fn().mockResolvedValue(serverItem);

      let items: ShoppingItem[] = [];
      const setAllItems = jest.fn((updater) => {
        items = typeof updater === 'function' ? updater(items) : updater;
      });

      await quickAddItem(
        makeGroceryItem({ name: localizedName }),
        makeList(),
        {
          allItems: items,
          setAllItems,
          createItem,
          updateItem: jest.fn(),
          executeWithOptimisticUpdate: jest.fn(),
          logError: jest.fn(),
        },
      );

      expect(items[0].name).toBe(localizedName);
    },
  );

  it('removes the temp item on createItem failure', async () => {
    const createItem = jest.fn().mockRejectedValue(new Error('Network error'));
    const logError = jest.fn();

    let items: ShoppingItem[] = [];
    const setAllItems = jest.fn((updater) => {
      items = typeof updater === 'function' ? updater(items) : updater;
    });

    await quickAddItem(makeGroceryItem(), makeList(), {
      allItems: items,
      setAllItems,
      createItem,
      updateItem: jest.fn(),
      executeWithOptimisticUpdate: jest.fn(),
      logError,
    });

    expect(logError).toHaveBeenCalledWith(
      'Failed to create shopping item:',
      expect.any(Error),
    );
    expect(items).toHaveLength(0);
  });
});

describe('quickAddItem – increment existing item', () => {
  it('calls updateItem with incremented quantity when item already exists', async () => {
    const existingItem: ShoppingItem = makeServerItem({ quantity: 2 });
    const groceryItem = makeGroceryItem({ name: 'Red Apple' });

    const updateItem = jest.fn().mockResolvedValue({ ...existingItem, quantity: 3 });
    const executeWithOptimisticUpdate = jest.fn().mockImplementation(
      async (operation, optimistic) => {
        optimistic();
        return operation();
      },
    );

    let items: ShoppingItem[] = [existingItem];
    const setAllItems = jest.fn((updater) => {
      items = typeof updater === 'function' ? updater(items) : updater;
    });

    await quickAddItem(groceryItem, makeList(), {
      allItems: items,
      setAllItems,
      createItem: jest.fn(),
      updateItem,
      executeWithOptimisticUpdate,
      logError: jest.fn(),
    });

    expect(updateItem).toHaveBeenCalledWith('cuid-server-1', { quantity: 3 });
  });
});
