import { LocalShoppingService } from './LocalShoppingService';
import { guestStorage } from '../../../common/utils/guestStorage';
import { createShoppingItem } from '../utils/shoppingFactory';
import { markDeleted } from '../../../common/utils/timestamps';
import { isEntityActive } from '../../../common/types/entityMetadata';
import type { ShoppingItem } from '../../../mocks/shopping';

// Mock expo-crypto to return unique UUIDs
let uuidCounter = 0;
jest.mock('expo-crypto', () => {
  let counter = 0;
  return {
    randomUUID: jest.fn(() => `mock-uuid-${++counter}`),
  };
});

// Mock AsyncStorage (required by catalogService)
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock catalogService (LocalShoppingService now uses it)
jest.mock('../../../common/services/catalogService', () => ({
  catalogService: {
    getCatalogData: jest.fn().mockResolvedValue({
      groceryItems: [],
      categories: [],
      frequentlyAddedItems: [],
    }),
  },
}));

// Mock guestStorage
jest.mock('../../../common/utils/guestStorage', () => ({
  guestStorage: {
    getShoppingLists: jest.fn().mockResolvedValue([]),
    getShoppingItems: jest.fn().mockResolvedValue([]),
    saveShoppingLists: jest.fn().mockResolvedValue(undefined),
    saveShoppingItems: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock devMode and config
jest.mock('../../../common/utils/devMode', () => ({
  isDevMode: jest.fn(() => false), // Default to false, can be overridden in tests
}));

jest.mock('../../../config', () => ({
  config: {
    mockData: { enabled: false }, // Default to false, can be overridden in tests
  },
}));

// Mock grocery item for testing
const mockGroceryItem = {
  id: 'grocery-1',
  name: 'Test Item',
  image: 'test-image.jpg',
  category: 'Other',
  defaultQuantity: 1,
};

describe('LocalShoppingService', () => {
  let service: LocalShoppingService;

  beforeEach(() => {
    service = new LocalShoppingService();
    jest.clearAllMocks();
  });

  describe('getShoppingData', () => {
    it('should filter out deleted items', async () => {
      const activeItem = createShoppingItem(mockGroceryItem, 'list-1', 1);
      const deletedItem = markDeleted(createShoppingItem(mockGroceryItem, 'list-1', 1));

      (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([
        activeItem,
        deletedItem,
      ]);
      (guestStorage.getShoppingLists as jest.Mock).mockResolvedValue([]);

      const data = await service.getShoppingData();

      expect(data.shoppingItems).toHaveLength(1);
      expect(data.shoppingItems[0].localId).toBe(activeItem.localId);
      expect(data.shoppingItems.find((i) => i.localId === deletedItem.localId)).toBeUndefined();
    });

    it('should return empty arrays when all items are deleted', async () => {
      const deletedItem1 = markDeleted(createShoppingItem(mockGroceryItem, 'list-1', 1));
      const deletedItem2 = markDeleted(createShoppingItem(mockGroceryItem, 'list-1', 1));

      (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([
        deletedItem1,
        deletedItem2,
      ]);
      (guestStorage.getShoppingLists as jest.Mock).mockResolvedValue([]);

      const data = await service.getShoppingData();

      expect(data.shoppingItems).toHaveLength(0);
    });

    it('should filter out deleted lists', async () => {
      const activeList = {
        id: 'list-1',
        localId: 'list-1',
        name: 'Active List',
        itemCount: 0,
        icon: 'cart-outline' as const,
        color: '#10B981',
        createdAt: new Date(),
      };
      const deletedList = markDeleted({
        id: 'list-2',
        localId: 'list-2',
        name: 'Deleted List',
        itemCount: 0,
        icon: 'cart-outline' as const,
        color: '#10B981',
        createdAt: new Date(),
      });

      (guestStorage.getShoppingLists as jest.Mock).mockResolvedValue([
        activeList,
        deletedList,
      ]);
      (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([]);

      const data = await service.getShoppingData();

      expect(data.shoppingLists).toHaveLength(1);
      expect(data.shoppingLists[0].localId).toBe(activeList.localId);
      expect(data.shoppingLists.find((l) => l.localId === deletedList.localId)).toBeUndefined();
    });

    it('should handle seeding failure gracefully and return empty arrays', async () => {
      // Mock storage to return empty arrays (triggers seeding)
      (guestStorage.getShoppingLists as jest.Mock).mockResolvedValue([]);
      (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([]);
      
      // Mock saveShoppingLists to throw error (simulating seeding failure)
      (guestStorage.saveShoppingLists as jest.Mock).mockRejectedValue(new Error('Storage full'));
      
      // Enable dev mode and mock data to trigger seeding
      const { isDevMode } = require('../../../common/utils/devMode');
      const { config } = require('../../../config');
      (isDevMode as jest.Mock).mockReturnValue(true);
      config.mockData.enabled = true;

      const data = await service.getShoppingData();
      
      // Should return empty arrays, not throw
      expect(data.shoppingLists).toEqual([]);
      expect(data.shoppingItems).toEqual([]);
      
      // Verify catalog data is still returned
      expect(data.groceryItems).toBeDefined();
      expect(data.categories).toBeDefined();
      
      // Reset mocks
      (isDevMode as jest.Mock).mockReturnValue(false);
      config.mockData.enabled = false;
    });
  });

  describe('toggleItem', () => {
    it('should toggle item checked status and persist to storage', async () => {
      const item = createShoppingItem(mockGroceryItem, 'list-1', 1);
      const initialChecked = item.isChecked;

      (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([item]);

      const toggled = await service.toggleItem(item.localId);

      expect(toggled.isChecked).toBe(!initialChecked);
      expect(guestStorage.saveShoppingItems).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            localId: item.localId,
            isChecked: !initialChecked,
          }),
        ])
      );
    });

    describe.each([
      ['localId', (item: ShoppingItem) => item.localId],
      ['id', (item: ShoppingItem) => item.id],
    ])('with %s', (identifierType, getId) => {
      it('should toggle item checked status', async () => {
        const item = createShoppingItem(mockGroceryItem, 'list-1', 1);
        const initialChecked = item.isChecked;

        (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([item]);

        const toggled = await service.toggleItem(getId(item));

        expect(toggled.isChecked).toBe(!initialChecked);
        expect(guestStorage.saveShoppingItems).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              localId: item.localId,
              isChecked: !initialChecked,
            }),
          ])
        );
      });
    });

    it('should persist toggle across multiple calls', async () => {
      const item = createShoppingItem(mockGroceryItem, 'list-1', 1);
      const initialChecked = item.isChecked;

      (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([item]);

      // First toggle
      const firstToggle = await service.toggleItem(item.localId);
      expect(firstToggle.isChecked).toBe(!initialChecked);

      // Update mock to reflect first toggle
      (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([firstToggle]);

      // Second toggle (should revert)
      const secondToggle = await service.toggleItem(item.localId);
      expect(secondToggle.isChecked).toBe(initialChecked);
    });
  });

  describe('deleteItem', () => {
    it('should soft-delete item and persist to storage', async () => {
      const item = createShoppingItem(mockGroceryItem, 'list-1', 1);

      (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([item]);

      await service.deleteItem(item.localId);

      expect(guestStorage.saveShoppingItems).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            localId: item.localId,
            deletedAt: expect.any(Date),
          }),
        ])
      );
    });

    it('should not return deleted items in getShoppingData', async () => {
      const item = createShoppingItem(mockGroceryItem, 'list-1', 1);

      // Setup: item exists in storage
      (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([item]);

      // Delete the item
      await service.deleteItem(item.localId);

      // Verify deleted item is filtered out when fetching data
      const deletedItem = markDeleted(item);
      (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([deletedItem]);
      (guestStorage.getShoppingLists as jest.Mock).mockResolvedValue([]);
      const data = await service.getShoppingData();

      const foundItem = data.shoppingItems.find((i) => i.localId === item.localId);
      expect(foundItem).toBeUndefined();

      // But item still exists in storage (tombstone)
      const allItems = await guestStorage.getShoppingItems();
      const tombstone = allItems.find((i: ShoppingItem) => i.localId === item.localId);
      expect(tombstone).toBeDefined();
      expect(tombstone?.deletedAt).toBeDefined();
    });
  });

  describe('createItem', () => {
    it('should create item and persist to storage', async () => {
      (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([]);

      const newItem = await service.createItem({
        name: 'Test Item',
        listId: 'list-1',
        quantity: 2,
        category: 'Other',
      });

      expect(newItem.localId).toBeDefined();
      expect(newItem.name).toBe('Test Item');
      expect(newItem.quantity).toBe(2);
      expect(guestStorage.saveShoppingItems).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Test Item',
            listId: 'list-1',
            quantity: 2,
          }),
        ])
      );
    });

    it('should throw error if listId is missing', async () => {
      await expect(
        service.createItem({
          name: 'Test Item',
          quantity: 1,
        } as any)
      ).rejects.toThrow('Shopping item must have a listId');
    });
  });

  describe('updateItem', () => {
    describe.each([
      ['localId', (item: ShoppingItem) => item.localId],
      ['id', (item: ShoppingItem) => item.id],
    ])('with %s', (identifierType, getId) => {
      it('should update item and persist to storage', async () => {
        const item = createShoppingItem(mockGroceryItem, 'list-1', 1);

        (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([item]);

        const updated = await service.updateItem(getId(item), { quantity: 5 });

        expect(updated.quantity).toBe(5);
        expect(guestStorage.saveShoppingItems).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              localId: item.localId,
              quantity: 5,
            }),
          ])
        );
      });
    });
  });

  describe('Error handling', () => {
    describe.each([
      ['toggleItem', (service: LocalShoppingService, itemId: string) => service.toggleItem(itemId)],
      ['updateItem', (service: LocalShoppingService, itemId: string) => service.updateItem(itemId, { quantity: 2 })],
      ['deleteItem', (service: LocalShoppingService, itemId: string) => service.deleteItem(itemId)],
    ])('%s', (methodName, methodCall) => {
      describe.each([
        ['empty string', ''],
        ['non-existent ID', 'non-existent-id'],
      ])('with invalid itemId: %s', (description, invalidId) => {
        it('should throw error', async () => {
          (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([]);

          await expect(methodCall(service, invalidId)).rejects.toThrow();
        });
      });
    });

    it('createItem should throw error if listId is missing', async () => {
      await expect(
        service.createItem({
          name: 'Test Item',
          quantity: 1,
        } as any)
      ).rejects.toThrow('Shopping item must have a listId');
    });
  });

  describe('Persistence across service recreation', () => {
    it('should persist toggle state after service recreation', async () => {
      const item = createShoppingItem(mockGroceryItem, 'list-1', 1);

      // Create item with first service instance
      (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([]);
      const service1 = new LocalShoppingService();
      await service1.createItem(item);

      // Toggle item
      (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([item]);
      await service1.toggleItem(item.localId);

      // Simulate service recreation (new service instance)
      const toggledItem = { ...item, isChecked: true };
      (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([toggledItem]);
      (guestStorage.getShoppingLists as jest.Mock).mockResolvedValue([]);
      const service2 = new LocalShoppingService();
      const data = await service2.getShoppingData();

      const persistedItem = data.shoppingItems.find((i) => i.localId === item.localId);
      expect(persistedItem).toBeDefined();
      expect(persistedItem?.isChecked).toBe(true);
    });

    it('should persist delete state after service recreation', async () => {
      const item = createShoppingItem(mockGroceryItem, 'list-1', 1);

      // Create and delete item with first service instance
      (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([]);
      const service1 = new LocalShoppingService();
      await service1.createItem(item);

      (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([item]);
      await service1.deleteItem(item.localId);

      // Simulate service recreation
      const deletedItem = markDeleted(item);
      (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([deletedItem]);
      (guestStorage.getShoppingLists as jest.Mock).mockResolvedValue([]);
      const service2 = new LocalShoppingService();
      const data = await service2.getShoppingData();

      // Deleted item should not appear in active items
      const foundItem = data.shoppingItems.find((i) => i.localId === item.localId);
      expect(foundItem).toBeUndefined();
    });

    it('should persist create state after service recreation', async () => {
      // Create item with first service instance
      (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([]);
      const service1 = new LocalShoppingService();
      const newItem = await service1.createItem({
        name: 'Test Item',
        listId: 'list-1',
        quantity: 2,
        category: 'Other',
      });

      // Simulate service recreation
      (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([newItem]);
      (guestStorage.getShoppingLists as jest.Mock).mockResolvedValue([]);
      const service2 = new LocalShoppingService();
      const data = await service2.getShoppingData();

      const persistedItem = data.shoppingItems.find((i) => i.localId === newItem.localId);
      expect(persistedItem).toBeDefined();
      expect(persistedItem?.name).toBe('Test Item');
      expect(persistedItem?.quantity).toBe(2);
    });
  });
});
