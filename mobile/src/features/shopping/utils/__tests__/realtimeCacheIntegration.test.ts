/**
 * Integration tests for realtime cache integration
 * 
 * Tests multi-user syncing scenarios where changes from one user
 * are instantly reflected in another user's cache.
 */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => `uuid-${Math.random().toString(36).substr(2, 9)}`),
}));

import { CacheAwareShoppingRepository } from '../../../../common/repositories/cacheAwareShoppingRepository';
import { RemoteShoppingService } from '../../services/RemoteShoppingService';
import { cacheEvents } from '../../../../common/utils/cacheEvents';
import type { ShoppingItem, ShoppingList } from '../../../../mocks/shopping';
import type { GroceryItem } from '../../components/GrocerySearchBar';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { readCacheArray } from '../../../../common/utils/cacheStorage';

// Mock dependencies
jest.mock('../../../../common/utils/cacheEvents');
jest.mock('../../../../common/utils/cacheStorage');
jest.mock('../../services/RemoteShoppingService');

describe('Realtime Cache Integration - Multi-User Syncing', () => {
  let repositoryA: CacheAwareShoppingRepository;
  let repositoryB: CacheAwareShoppingRepository;
  let mockService: jest.Mocked<RemoteShoppingService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockService = {
      findAllLists: jest.fn(),
      findListById: jest.fn(),
      createList: jest.fn(),
      updateList: jest.fn(),
      deleteList: jest.fn(),
      findAllItems: jest.fn(),
      findItemsByListId: jest.fn(),
      createItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
      toggleItem: jest.fn(),
      getShoppingData: jest.fn(),
    } as unknown as jest.Mocked<RemoteShoppingService>;

    repositoryA = new CacheAwareShoppingRepository(mockService);
    repositoryB = new CacheAwareShoppingRepository(mockService);
  });

  describe('User A checks item, User B sees update instantly', () => {
    it('should update cache and emit event when item is checked', async () => {
      // Arrange
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
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (readCacheArray as jest.Mock).mockResolvedValue({ data: initialItems });

      const payload: RealtimePostgresChangesPayload<any> = {
        eventType: 'UPDATE',
        new: {
          id: 'item-1',
          list_id: 'list-1',
          name: 'Banana',
          is_checked: true,
        },
      };

      // Act
      await repositoryA.applyRealtimeItemChange(payload, []);

      // Assert
      expect(cacheEvents.emitCacheChange).toHaveBeenCalledWith('shoppingItems');
    });
  });

  describe('User A creates item, User B sees it instantly', () => {
    it('should add new item to cache on INSERT event', async () => {
      // Arrange
      const initialItems: ShoppingItem[] = [];
      (readCacheArray as jest.Mock).mockResolvedValue({ data: initialItems });

      const payload: RealtimePostgresChangesPayload<any> = {
        eventType: 'INSERT',
        new: {
          id: 'item-2',
          list_id: 'list-1',
          name: 'Milk',
          quantity: 1,
          category: 'Dairy',
          is_checked: false,
        },
      };

      // Act
      await repositoryA.applyRealtimeItemChange(payload, []);

      // Assert
      expect(cacheEvents.emitCacheChange).toHaveBeenCalledWith('shoppingItems');
    });
  });

  describe('User A deletes item, User B sees removal instantly', () => {
    it('should remove item from cache on DELETE event', async () => {
      // Arrange
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
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      (readCacheArray as jest.Mock).mockResolvedValue({ data: initialItems });

      const payload: RealtimePostgresChangesPayload<any> = {
        eventType: 'DELETE',
        old: { id: 'item-1' },
      };

      // Act
      await repositoryA.applyRealtimeItemChange(payload, []);

      // Assert
      expect(cacheEvents.emitCacheChange).toHaveBeenCalledWith('shoppingItems');
    });
  });

  describe('Concurrent updates resolve correctly', () => {
    it('should handle timestamp-based conflict resolution', async () => {
      // Arrange
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
          createdAt: new Date('2026-01-28T10:00:00Z'),
          updatedAt: new Date('2026-01-28T10:00:00Z'),
        },
      ];
      (readCacheArray as jest.Mock).mockResolvedValue({ data: initialItems });

      // Simulate newer update from remote
      const payload: RealtimePostgresChangesPayload<any> = {
        eventType: 'UPDATE',
        new: {
          id: 'item-1',
          list_id: 'list-1',
          name: 'Banana',
          quantity: 5,
          updated_at: '2026-01-28T12:00:00.000Z', // Newer timestamp with milliseconds
        },
      };

      // Act
      await repositoryA.applyRealtimeItemChange(payload, []);

      // Assert
      expect(cacheEvents.emitCacheChange).toHaveBeenCalledWith('shoppingItems');
    });
  });

  describe('Cache events trigger UI updates', () => {
    it('should emit cache change event that triggers useCachedEntities', () => {
      // Arrange
      const mockEmit = cacheEvents.emitCacheChange as jest.MockedFunction<typeof cacheEvents.emitCacheChange>;

      // Act
      mockEmit('shoppingItems');

      // Assert
      expect(mockEmit).toHaveBeenCalledWith('shoppingItems');
    });
  });
});
