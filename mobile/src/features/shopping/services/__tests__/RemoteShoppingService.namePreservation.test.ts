/**
 * Tests for RemoteShoppingService name-preservation logic.
 *
 * The server always responds with English catalog names.  These tests assert
 * that updateItem() and toggleItem() keep the locally-translated name the
 * client already has in state instead of overwriting it with the English name.
 */

// ─── Mocks (must precede all imports) ────────────────────────────────────────

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid'),
}));

jest.mock('../../../../services/api', () => ({
  api: {
    get: jest.fn(),
    patch: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../../../common/repositories/cacheAwareRepository', () => ({
  addEntityToCache: jest.fn().mockResolvedValue(undefined),
  updateEntityInCache: jest.fn().mockResolvedValue(undefined),
  removeEntityFromCache: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../../common/services/catalogService', () => ({
  catalogService: {
    getGroceryItems: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../../../i18n', () => ({
  i18n: { language: 'he' },
}));

// ─── Imports ──────────────────────────────────────────────────────────────────

import { api } from '../../../../services/api';
import type { ShoppingItem } from '../../../../mocks/shopping';
import { RemoteShoppingService } from '../RemoteShoppingService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockedApi = api as jest.Mocked<typeof api>;

/** Builds a minimal ShoppingItem with the given name and id for test fixtures. */
function buildItem(overrides: Partial<ShoppingItem> = {}): ShoppingItem {
  return {
    id: 'item-1',
    localId: 'local-1',
    listId: 'list-1',
    name: 'Milk (Hebrew translated)',
    quantity: 1,
    isChecked: false,
    image: undefined,
    category: 'Dairy',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  } as unknown as ShoppingItem;
}

/**
 * Stubs the chain of API calls that getShoppingItems() makes internally:
 *  1. GET /shopping-lists        → returns [list summary]
 *  2. GET /shopping-lists/:id?lang=... → returns detail with translated items
 *
 * The detail endpoint receives a `lang` query param (e.g. `lang=he`) and is
 * expected to return the translated name — this is what the service stores as
 * `existing.name` before performing the update/toggle.
 */
function stubGetShoppingItems(existingItem: ShoppingItem): void {
  mockedApi.get.mockImplementation((url: string) => {
    if (url === '/shopping-lists') {
      return Promise.resolve([
        { id: existingItem.listId, name: 'My List', color: '#fff', icon: 'cart' },
      ]);
    }
    if (url.startsWith(`/shopping-lists/${existingItem.listId}`)) {
      return Promise.resolve({
        id: existingItem.listId,
        items: [
          {
            id: existingItem.id,
            // The server returns the translated name when lang != 'en'
            name: existingItem.name,
            quantity: existingItem.quantity,
            isChecked: existingItem.isChecked,
            category: existingItem.category,
          },
        ],
      });
    }
    return Promise.resolve(null);
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RemoteShoppingService — localized name preservation', () => {
  let service: RemoteShoppingService;

  beforeEach(() => {
    service = new RemoteShoppingService();
    jest.clearAllMocks();
  });

  describe('updateItem()', () => {
    describe.each([
      ['Hebrew translation', 'חלב'],
      ['Spanish translation', 'Leche'],
      ['French translation', 'Lait'],
    ])('when existing item has a %s name', (_label, localName) => {
      it('keeps the local name after a successful update', async () => {
        const existingItem = buildItem({ name: localName });
        stubGetShoppingItems(existingItem);

        mockedApi.patch.mockResolvedValue({
          updatedItem: {
            id: existingItem.id,
            name: 'Milk',       // server always returns English
            quantity: 2,
            isChecked: false,
          },
        });

        const result = await service.updateItem(existingItem.id, { quantity: 2 });

        expect(result.name).toBe(localName);
      });

      it('does not expose the server English name', async () => {
        const existingItem = buildItem({ name: localName });
        stubGetShoppingItems(existingItem);

        mockedApi.patch.mockResolvedValue({
          updatedItem: { id: existingItem.id, name: 'Milk', quantity: 1, isChecked: false },
        });

        const result = await service.updateItem(existingItem.id, { quantity: 1 });

        expect(result.name).not.toBe('Milk');
      });
    });
  });

  describe('toggleItem()', () => {
    describe.each([
      ['Hebrew translation', 'חלב'],
      ['Spanish translation', 'Leche'],
      ['French translation', 'Lait'],
    ])('when existing item has a %s name', (_label, localName) => {
      it('keeps the local name after toggling isChecked', async () => {
        const existingItem = buildItem({ name: localName, isChecked: false });
        stubGetShoppingItems(existingItem);

        mockedApi.patch.mockResolvedValue({
          updatedItem: {
            id: existingItem.id,
            name: 'Milk',       // server always returns English
            quantity: 1,
            isChecked: true,
          },
        });

        const result = await service.toggleItem(existingItem.id);

        expect(result.name).toBe(localName);
      });

      it('correctly flips isChecked regardless of name', async () => {
        const existingItem = buildItem({ name: localName, isChecked: false });
        stubGetShoppingItems(existingItem);

        mockedApi.patch.mockResolvedValue({
          updatedItem: {
            id: existingItem.id,
            name: 'Milk',
            quantity: 1,
            isChecked: true,
          },
        });

        const result = await service.toggleItem(existingItem.id);

        expect(result.isChecked).toBe(true);
      });
    });
  });
});
