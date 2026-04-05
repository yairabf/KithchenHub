/**
 * Tests for shoppingFactory utilities.
 *
 * Covers: createShoppingItem, createShoppingList, preserveLocalizedName.
 */

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid'),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: {},
}));

import type { ShoppingItem } from '../../../mocks/shopping/shoppingItems';
import {
  createShoppingItem,
  createShoppingList,
  preserveLocalizedName,
} from './shoppingFactory';

type ShoppingItemInput = Parameters<typeof createShoppingItem>[0];

const baseItem = (): ShoppingItem =>
  ({
    id: 'item-1',
    localId: 'local-1',
    listId: 'list-1',
    name: 'Milk (English)',
    quantity: 1,
    isChecked: false,
    image: undefined,
    category: 'Dairy',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  } as unknown as ShoppingItem);

describe('preserveLocalizedName', () => {
  describe.each([
    ['Hebrew translation', 'חלב', 'חלב'],
    ['Spanish translation', 'Leche', 'Leche'],
    ['Same language (no-op)', 'Milk (English)', 'Milk (English)'],
    ['Empty string', '', ''],
    ['Name with spaces', '  Whole Milk  ', '  Whole Milk  '],
  ])('when localName is "%s"', (_label, localName, expectedName) => {
    it(`returns a new item with name = "${expectedName}"`, () => {
      const server = baseItem();
      const result = preserveLocalizedName(server, localName);
      expect(result.name).toBe(expectedName);
    });

    it('does not mutate the original item', () => {
      const server = baseItem();
      const originalName = server.name;
      preserveLocalizedName(server, localName);
      expect(server.name).toBe(originalName);
    });

    it('preserves all other fields unchanged', () => {
      const server = baseItem();
      const result = preserveLocalizedName(server, localName);
      expect(result.id).toBe(server.id);
      expect(result.localId).toBe(server.localId);
      expect(result.listId).toBe(server.listId);
      expect(result.quantity).toBe(server.quantity);
      expect(result.isChecked).toBe(server.isChecked);
      expect(result.category).toBe(server.category);
    });
  });
});

describe('createShoppingItem', () => {
  it('creates a shopping item with correct default values', () => {
    const groceryItem = { name: 'Apple', image: undefined, category: 'Fruit' };
    const result = createShoppingItem(groceryItem as any, 'list-1', 2);

    expect(result.name).toBe('Apple');
    expect(result.quantity).toBe(2);
    expect(result.listId).toBe('list-1');
    expect(result.isChecked).toBe(false);
    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
  });

  describe.each<[string, ShoppingItemInput, string | undefined]>([
    ['catalog item (non-custom id)', { id: 'cat-uuid-1', name: 'Apple', image: '', category: 'Fruits', defaultQuantity: 1 }, 'cat-uuid-1'],
    ['custom item (custom- prefix)', { id: 'custom-abc', name: 'My Item', image: '', category: 'Other', defaultQuantity: 1 }, undefined],
    ['item with no id field', { name: 'Apple', image: '', category: 'Fruits' }, undefined],
  ])(
    'catalogItemId propagation for %s',
    (_label, groceryItem, expectedCatalogItemId) => {
      it(`sets catalogItemId to ${expectedCatalogItemId ?? 'undefined'}`, () => {
        const result = createShoppingItem(groceryItem, 'list-1', 1);
        expect(result.catalogItemId).toBe(expectedCatalogItemId);
      });
    },
  );
});

describe('createShoppingList', () => {
  it('creates a shopping list with correct default values', () => {
    const result = createShoppingList('Groceries', 'cart' as any, '#FF6B35');

    expect(result.name).toBe('Groceries');
    expect(result.color).toBe('#FF6B35');
    expect(result.isMain).toBe(false);
    expect(result.itemCount).toBe(0);
    expect(result.createdAt).toBeDefined();
  });
});
