/**
 * Tests for realtime cache update methods in CacheAwareShoppingRepository
 * 
 * Tests the applyRealtimeListChange() and applyRealtimeItemChange() methods
 * that handle Supabase realtime events and update the cache accordingly.
 */

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => `uuid-${Math.random().toString(36).substr(2, 9)}`),
}));

import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { CacheAwareShoppingRepository } from '../cacheAwareShoppingRepository';
import { RemoteShoppingService } from '../../../features/shopping/services/RemoteShoppingService';
import type { ShoppingList, ShoppingItem } from '../../../mocks/shopping';
import type { GroceryItem } from '../../../features/shopping/components/GrocerySearchBar';
import { cacheEvents } from '../../../common/utils/cacheEvents';
import { readCachedEntitiesForUpdate, setCached } from '../cacheAwareRepository';
import { applyShoppingListChange, applyShoppingItemChange } from '../../../features/shopping/utils/shoppingRealtime';

// Mock dependencies
jest.mock('../cacheAwareRepository');
jest.mock('../../../features/shopping/utils/shoppingRealtime');
jest.mock('../../../common/utils/cacheEvents');

const mockReadCachedEntitiesForUpdate = readCachedEntitiesForUpdate as jest.MockedFunction<typeof readCachedEntitiesForUpdate>;
const mockSetCached = setCached as jest.MockedFunction<typeof setCached>;
const mockApplyShoppingListChange = applyShoppingListChange as jest.MockedFunction<typeof applyShoppingListChange>;
const mockApplyShoppingItemChange = applyShoppingItemChange as jest.MockedFunction<typeof applyShoppingItemChange>;
const mockEmitCacheChange = cacheEvents.emitCacheChange as jest.MockedFunction<typeof cacheEvents.emitCacheChange>;

describe('CacheAwareShoppingRepository - Realtime Methods', () => {
  let repository: CacheAwareShoppingRepository;
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

    repository = new CacheAwareShoppingRepository(mockService);
  });

  describe('applyRealtimeListChange', () => {
    const baseLists: ShoppingList[] = [
      {
        id: 'list-1',
        localId: 'list-1',
        name: 'Weekly',
        itemCount: 0,
        icon: 'cart-outline',
        color: '#10B981',
        isMain: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    type ShoppingListRealtimeRow = {
      id: string;
      name?: string | null;
      color?: string | null;
      household_id?: string | null;
    };

    describe.each([
      [
        'INSERT event',
        {
          eventType: 'INSERT' as const,
          new: { id: 'list-2', name: 'Party', color: '#F59E0B', household_id: 'household-1' },
        },
        ['list-1', 'list-2'],
      ],
      [
        'UPDATE event',
        {
          eventType: 'UPDATE' as const,
          new: { id: 'list-1', name: 'Updated Weekly', color: '#123456', household_id: 'household-1' },
        },
        ['list-1'],
      ],
      [
        'DELETE event',
        {
          eventType: 'DELETE' as const,
          old: { id: 'list-1' },
        },
        [],
      ],
    ])('handles %s', (_label, payload, expectedIds) => {
      it('should update cache and emit event', async () => {
        // Arrange
        const typedPayload = payload as RealtimePostgresChangesPayload<ShoppingListRealtimeRow>;
        mockReadCachedEntitiesForUpdate.mockResolvedValue(baseLists);
        
        const updatedLists: ShoppingList[] = expectedIds.length === 0 
          ? []
          : expectedIds.map(id => ({
              id,
              localId: id,
              name: id === 'list-1' ? 'Updated Weekly' : 'Party',
              itemCount: 0,
              icon: 'cart-outline' as const,
              color: id === 'list-1' ? '#123456' : '#F59E0B',
              isMain: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            }));
        
        mockApplyShoppingListChange.mockReturnValue(updatedLists);
        mockSetCached.mockResolvedValue(undefined);

        // Act
        await (repository as any).applyRealtimeListChange(typedPayload);

        // Assert
        expect(mockReadCachedEntitiesForUpdate).toHaveBeenCalledWith('shoppingLists');
        expect(mockApplyShoppingListChange).toHaveBeenCalledWith(baseLists, typedPayload);
        expect(mockSetCached).toHaveBeenCalledWith('shoppingLists', updatedLists, expect.any(Function));
        expect(mockEmitCacheChange).toHaveBeenCalledWith('shoppingLists');
      });
    });

    it('should handle errors gracefully without throwing', async () => {
      // Arrange
      const payload: RealtimePostgresChangesPayload<ShoppingListRealtimeRow> = {
        eventType: 'UPDATE',
        new: { id: 'list-1', name: 'Updated', household_id: 'household-1' },
      };
      mockReadCachedEntitiesForUpdate.mockRejectedValue(new Error('Cache read failed'));

      // Act & Assert
      await expect((repository as any).applyRealtimeListChange(payload)).resolves.not.toThrow();
      expect(mockEmitCacheChange).not.toHaveBeenCalled();
    });

    it('should handle null/undefined payload gracefully', async () => {
      // Arrange
      const payload = null as any;
      mockReadCachedEntitiesForUpdate.mockResolvedValue(baseLists);
      mockApplyShoppingListChange.mockReturnValue(baseLists);

      // Act & Assert
      await expect((repository as any).applyRealtimeListChange(payload)).resolves.not.toThrow();
    });
  });

  describe('applyRealtimeItemChange', () => {
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
        createdAt: new Date(),
        updatedAt: new Date(),
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

    type ShoppingItemRealtimeRow = {
      id: string;
      list_id?: string | null;
      name?: string | null;
      quantity?: number | null;
      category?: string | null;
      is_checked?: boolean | null;
    };

    describe.each([
      [
        'INSERT event',
        {
          eventType: 'INSERT' as const,
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
      ],
      [
        'UPDATE event',
        {
          eventType: 'UPDATE' as const,
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
      ],
      [
        'DELETE event',
        {
          eventType: 'DELETE' as const,
          old: { id: 'item-1' },
        },
        [],
      ],
    ])('handles %s', (_label, payload, expectedIds) => {
      it('should update cache and emit event', async () => {
        // Arrange
        const typedPayload = payload as RealtimePostgresChangesPayload<ShoppingItemRealtimeRow>;
        mockReadCachedEntitiesForUpdate.mockResolvedValue(baseItems);
        
        const updatedItems: ShoppingItem[] = expectedIds.length === 0
          ? []
          : expectedIds.map(id => ({
              id,
              localId: id,
              name: id === 'item-1' ? 'Banana' : 'Milk',
              image: id === 'item-1' ? 'banana.png' : 'milk.png',
              quantity: id === 'item-1' ? 5 : 1,
              category: id === 'item-1' ? 'Fruits' : 'Dairy',
              listId: 'list-1',
              isChecked: id === 'item-1',
              createdAt: new Date(),
              updatedAt: new Date(),
            }));
        
        mockApplyShoppingItemChange.mockReturnValue(updatedItems);
        mockSetCached.mockResolvedValue(undefined);

        // Act
        await (repository as any).applyRealtimeItemChange(typedPayload, groceryItems);

        // Assert
        expect(mockReadCachedEntitiesForUpdate).toHaveBeenCalledWith('shoppingItems');
        expect(mockApplyShoppingItemChange).toHaveBeenCalledWith(baseItems, typedPayload, groceryItems);
        expect(mockSetCached).toHaveBeenCalledWith('shoppingItems', updatedItems, expect.any(Function));
        expect(mockEmitCacheChange).toHaveBeenCalledWith('shoppingItems');
      });
    });

    it('should handle errors gracefully without throwing', async () => {
      // Arrange
      const payload: RealtimePostgresChangesPayload<ShoppingItemRealtimeRow> = {
        eventType: 'UPDATE',
        new: { id: 'item-1', list_id: 'list-1', name: 'Updated', is_checked: true },
      };
      mockReadCachedEntitiesForUpdate.mockRejectedValue(new Error('Cache read failed'));

      // Act & Assert
      await expect((repository as any).applyRealtimeItemChange(payload, groceryItems)).resolves.not.toThrow();
      expect(mockEmitCacheChange).not.toHaveBeenCalled();
    });

    it('should handle null/undefined payload gracefully', async () => {
      // Arrange
      const payload = null as any;
      mockReadCachedEntitiesForUpdate.mockResolvedValue(baseItems);
      mockApplyShoppingItemChange.mockReturnValue(baseItems);

      // Act & Assert
      await expect((repository as any).applyRealtimeItemChange(payload, groceryItems)).resolves.not.toThrow();
    });
  });
});
