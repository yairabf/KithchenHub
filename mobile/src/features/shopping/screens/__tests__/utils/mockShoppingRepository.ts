/**
 * Shared factory for creating a mock CacheAwareShoppingRepository.
 *
 * Centralises the mock implementation so every test file gets a consistent
 * shape without duplicating the boilerplate inline.  Pass the per-test mock
 * fns (e.g. mockFindAllLists, mockDeleteItem) to override individual methods.
 */

import type { ICacheAwareShoppingRepository } from '../../../../../common/repositories/cacheAwareShoppingRepository';

interface MockShoppingRepositoryOptions {
  findAllLists?: jest.Mock;
  findAllItems?: jest.Mock;
  deleteItem?: jest.Mock;
  [key: string]: jest.Mock | undefined;
}

/**
 * Creates a fully-stubbed ICacheAwareShoppingRepository mock.
 *
 * @param overrides - Optional method overrides for methods under test.
 * @returns A mock repository instance.
 */
export function createMockShoppingRepository(
  overrides: MockShoppingRepositoryOptions = {},
): jest.Mocked<ICacheAwareShoppingRepository> {
  return {
    findAllLists: overrides.findAllLists ?? jest.fn().mockResolvedValue([]),
    findAllItems: overrides.findAllItems ?? jest.fn().mockResolvedValue([]),
    refreshLists: jest.fn().mockResolvedValue([]),
    refreshItems: jest.fn().mockResolvedValue([]),
    refreshAll: jest.fn().mockResolvedValue({ lists: [], items: [] }),
    getShoppingData: jest.fn().mockResolvedValue({ shoppingLists: [], shoppingItems: [] }),
    createList: jest.fn(),
    updateList: jest.fn(),
    deleteList: jest.fn(),
    createItem: jest.fn(),
    updateItem: jest.fn(),
    deleteItem: overrides.deleteItem ?? jest.fn(),
    toggleItem: jest.fn(),
    findListById: jest.fn().mockResolvedValue(null),
    findItemsByListId: jest.fn().mockResolvedValue([]),
    applyRealtimeListChange: jest.fn(),
    applyRealtimeItemChange: jest.fn(),
    invalidateListsCache: jest.fn(),
    invalidateItemsCache: jest.fn(),
    invalidateAllCache: jest.fn(),
  } as unknown as jest.Mocked<ICacheAwareShoppingRepository>;
}
