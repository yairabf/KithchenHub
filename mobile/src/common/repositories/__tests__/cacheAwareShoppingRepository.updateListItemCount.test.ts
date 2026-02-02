/**
 * Tests for CacheAwareShoppingRepository.updateListItemCount()
 * 
 * Validates that list item counts are correctly updated when items are added/removed.
 */

import { CacheAwareShoppingRepository } from '../cacheAwareShoppingRepository';
import type { ShoppingItem, ShoppingList } from '../../../mocks/shopping';
import { readCachedEntitiesForUpdate, updateEntityInCache } from '../cacheAwareRepository';
import { cacheEvents } from '../../../utils/cacheEvents';
import { getIsOnline } from '../../../utils/networkStatus';

// Mock dependencies
jest.mock('../cacheAwareRepository', () => ({
  readCachedEntitiesForUpdate: jest.fn(),
  updateEntityInCache: jest.fn(),
  addEntityToCache: jest.fn(),
  getCached: jest.fn(),
}));

jest.mock('../../../utils/cacheEvents', () => ({
  cacheEvents: {
    emitCacheChange: jest.fn(),
  },
}));

jest.mock('../../../utils/networkStatus', () => ({
  getIsOnline: jest.fn(),
}));

jest.mock('../../services/api', () => ({
  api: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('CacheAwareShoppingRepository.updateListItemCount', () => {
  let repository: CacheAwareShoppingRepository;
  let mockService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockService = {
      getShoppingLists: jest.fn(),
      getShoppingItems: jest.fn(),
      createList: jest.fn(),
      updateList: jest.fn(),
      deleteList: jest.fn(),
      createItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
      toggleItem: jest.fn(),
    };
    repository = new CacheAwareShoppingRepository(mockService);
  });

  describe('when list exists', () => {
    const mockList: ShoppingList = {
      id: 'list-1',
      localId: 'list-1-local',
      name: 'Test List',
      itemCount: 2,
      icon: 'cart-outline',
      color: '#10B981',
    };

    it.each([
      [
        'should update count when items increase',
        [
          { id: 'item-1', listId: 'list-1', deletedAt: undefined },
          { id: 'item-2', listId: 'list-1', deletedAt: undefined },
          { id: 'item-3', listId: 'list-1', deletedAt: undefined },
        ],
        3,
        true, // should call updateList
      ],
      [
        'should update count when items decrease',
        [
          { id: 'item-1', listId: 'list-1', deletedAt: undefined },
        ],
        1,
        true, // should call updateList
      ],
      [
        'should not update when count unchanged',
        [
          { id: 'item-1', listId: 'list-1', deletedAt: undefined },
          { id: 'item-2', listId: 'list-1', deletedAt: undefined },
        ],
        2,
        false, // should NOT call updateList
      ],
      [
        'should exclude deleted items from count',
        [
          { id: 'item-1', listId: 'list-1', deletedAt: undefined },
          { id: 'item-2', listId: 'list-1', deletedAt: new Date() },
          { id: 'item-3', listId: 'list-1', deletedAt: undefined },
        ],
        2,
        true,
      ],
      [
        'should handle items with list.id reference',
        [
          { id: 'item-1', listId: 'list-1', deletedAt: undefined },
        ],
        1,
        true,
      ],
      [
        'should handle items with list.localId reference',
        [
          { id: 'item-1', listId: 'list-1-local', deletedAt: undefined },
        ],
        1,
        true,
      ],
    ])('%s', async (description, items, expectedCount, shouldCallUpdateList) => {
      (readCachedEntitiesForUpdate as jest.Mock)
        .mockResolvedValueOnce(items as ShoppingItem[])
        .mockResolvedValueOnce([mockList]);

      (getIsOnline as jest.Mock).mockReturnValue(true);
      mockService.updateList.mockResolvedValue({ ...mockList, itemCount: expectedCount });

      await (repository as any).updateListItemCount('list-1');

      if (shouldCallUpdateList) {
        expect(mockService.updateList).toHaveBeenCalledWith('list-1', { itemCount: expectedCount });
        expect(updateEntityInCache).toHaveBeenCalled();
        expect(cacheEvents.emitCacheChange).toHaveBeenCalledWith('shoppingLists');
      } else {
        expect(mockService.updateList).not.toHaveBeenCalled();
      }
    });
  });

  describe('when list not found', () => {
    it('should skip update and log warning', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      (readCachedEntitiesForUpdate as jest.Mock)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await (repository as any).updateListItemCount('non-existent-list');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('List non-existent-list not found')
      );
      expect(mockService.updateList).not.toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('offline behavior', () => {
    it('should update cache optimistically when offline', async () => {
      const mockList: ShoppingList = {
        id: 'list-1',
        localId: 'list-1-local',
        name: 'Test List',
        itemCount: 1,
        icon: 'cart-outline',
        color: '#10B981',
      };

      (readCachedEntitiesForUpdate as jest.Mock)
        .mockResolvedValueOnce([
          { id: 'item-1', listId: 'list-1', deletedAt: undefined },
          { id: 'item-2', listId: 'list-1', deletedAt: undefined },
        ])
        .mockResolvedValueOnce([mockList]);

      (getIsOnline as jest.Mock).mockReturnValue(false);

      await (repository as any).updateListItemCount('list-1');

      expect(mockService.updateList).not.toHaveBeenCalled();
      expect(updateEntityInCache).toHaveBeenCalledWith(
        'shoppingLists',
        expect.objectContaining({ itemCount: 2 }),
        expect.any(Function),
        expect.any(Function)
      );
      expect(cacheEvents.emitCacheChange).toHaveBeenCalledWith('shoppingLists');
    });
  });

  describe('error handling', () => {
    it('should handle API update failure gracefully', async () => {
      const mockList: ShoppingList = {
        id: 'list-1',
        localId: 'list-1-local',
        name: 'Test List',
        itemCount: 1,
        icon: 'cart-outline',
        color: '#10B981',
      };

      (readCachedEntitiesForUpdate as jest.Mock)
        .mockResolvedValueOnce([
          { id: 'item-1', listId: 'list-1', deletedAt: undefined },
          { id: 'item-2', listId: 'list-1', deletedAt: undefined },
        ])
        .mockResolvedValueOnce([mockList]);

      (getIsOnline as jest.Mock).mockReturnValue(true);
      mockService.updateList.mockRejectedValue(new Error('API Error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await (repository as any).updateListItemCount('list-1');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update list item count via API'),
        expect.any(Error)
      );
      // Should still update cache optimistically
      expect(updateEntityInCache).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('should not throw on cache read errors', async () => {
      (readCachedEntitiesForUpdate as jest.Mock).mockRejectedValue(new Error('Cache error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect((repository as any).updateListItemCount('list-1')).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update list item count'),
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });
});
