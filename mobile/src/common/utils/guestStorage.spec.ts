import AsyncStorage from '@react-native-async-storage/async-storage';
import { guestStorage } from './guestStorage';
import { Recipe } from '../../mocks/recipes';
import { ShoppingList, ShoppingItem } from '../../mocks/shopping';
import { getGuestStorageKey, ENTITY_TYPES } from '../storage/dataModeStorage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('guestStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('getRecipes', () => {
    const recipesKey = getGuestStorageKey(ENTITY_TYPES.recipes);

    describe.each([
      { scenario: 'empty storage', storageValue: null, expected: [] },
      { scenario: 'invalid JSON', storageValue: 'invalid json', expected: [] },
      { 
        scenario: 'valid envelope format', 
        storageValue: JSON.stringify({ version: 1, updatedAt: '2026-01-25T12:00:00.000Z', data: [{ id: '1', localId: 'uuid-1', name: 'Test Recipe' }] }), 
        expected: [{ id: '1', localId: 'uuid-1', name: 'Test Recipe' }] 
      },
      { 
        scenario: 'legacy array format', 
        storageValue: JSON.stringify([{ id: '1', localId: 'uuid-1', name: 'Test Recipe' }]), 
        expected: [{ id: '1', localId: 'uuid-1', name: 'Test Recipe' }] 
      },
      { scenario: 'non-array data', storageValue: JSON.stringify({ not: 'an array' }), expected: [] },
      { scenario: 'array with invalid items', storageValue: JSON.stringify([{ id: '1' }, { localId: 'uuid-2' }, null]), expected: [] },
    ])('when $scenario', ({ storageValue, expected }) => {
      it('should return correct data', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storageValue);

        const result = await guestStorage.getRecipes();

        expect(AsyncStorage.getItem).toHaveBeenCalledWith(recipesKey);
        if (storageValue === null) {
          expect(result).toEqual(expected);
        } else if (storageValue === 'invalid json' || (storageValue?.includes('not') && !storageValue?.includes('version'))) {
          expect(result).toEqual([]);
        } else {
          expect(result).toEqual(expected);
        }
      });
    });
  });

  describe('saveRecipes', () => {
    const recipesKey = getGuestStorageKey(ENTITY_TYPES.recipes);

    it('should save recipes to AsyncStorage as envelope', async () => {
      const recipes: Recipe[] = [
        {
          id: '1',
          localId: 'uuid-1',
          name: 'Test Recipe',
          cookTime: '30 min',
          category: 'Dinner',
          ingredients: [],
          instructions: [],
        },
      ];

      await guestStorage.saveRecipes(recipes);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        recipesKey,
        expect.stringContaining('"version":1')
      );
      
      const writtenData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(writtenData.version).toBe(1);
      expect(writtenData.updatedAt).toBeDefined();
      expect(writtenData.data).toHaveLength(1);
      expect(writtenData.data[0]).toMatchObject({
        id: '1',
        localId: 'uuid-1',
        name: 'Test Recipe',
      });
    });

    it('should throw error if storage operation fails', async () => {
      const recipes: Recipe[] = [];
      const error = new Error('Storage error');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(error);

      await expect(guestStorage.saveRecipes(recipes)).rejects.toThrow('Storage error');
    });
  });

  describe('getShoppingLists', () => {
    const listsKey = getGuestStorageKey(ENTITY_TYPES.shoppingLists);

    describe.each([
      { scenario: 'empty storage', storageValue: null, expected: [] },
      { scenario: 'invalid JSON', storageValue: 'invalid json', expected: [] },
      { 
        scenario: 'valid envelope format', 
        storageValue: JSON.stringify({ version: 1, updatedAt: '2026-01-25T12:00:00.000Z', data: [{ id: '1', localId: 'uuid-1', name: 'Test List', itemCount: 0, icon: 'cart-outline', color: '#000' }] }), 
        expected: [{ id: '1', localId: 'uuid-1', name: 'Test List', itemCount: 0, icon: 'cart-outline', color: '#000' }] 
      },
      { 
        scenario: 'legacy array format', 
        storageValue: JSON.stringify([{ id: '1', localId: 'uuid-1', name: 'Test List', itemCount: 0, icon: 'cart-outline', color: '#000' }]), 
        expected: [{ id: '1', localId: 'uuid-1', name: 'Test List', itemCount: 0, icon: 'cart-outline', color: '#000' }] 
      },
    ])('when $scenario', ({ storageValue, expected }) => {
      it('should return correct data', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storageValue);

        const result = await guestStorage.getShoppingLists();

        expect(AsyncStorage.getItem).toHaveBeenCalledWith(listsKey);
        if (storageValue === null) {
          expect(result).toEqual(expected);
        } else if (storageValue === 'invalid json') {
          expect(result).toEqual([]);
        } else {
          expect(result).toEqual(expected);
        }
      });
    });
  });

  describe('saveShoppingLists', () => {
    const listsKey = getGuestStorageKey(ENTITY_TYPES.shoppingLists);

    it('should save shopping lists to AsyncStorage as envelope', async () => {
      const lists: ShoppingList[] = [
        {
          id: '1',
          localId: 'uuid-1',
          name: 'Test List',
          itemCount: 0,
          icon: 'cart-outline',
          color: '#000',
        },
      ];

      await guestStorage.saveShoppingLists(lists);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        listsKey,
        expect.stringContaining('"version":1')
      );
      
      const writtenData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(writtenData.version).toBe(1);
      expect(writtenData.data).toHaveLength(1);
    });

    it('should throw error if storage operation fails', async () => {
      const lists: ShoppingList[] = [];
      const error = new Error('Storage error');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(error);

      await expect(guestStorage.saveShoppingLists(lists)).rejects.toThrow('Storage error');
    });
  });

  describe('getShoppingItems', () => {
    const itemsKey = getGuestStorageKey(ENTITY_TYPES.shoppingItems);

    describe.each([
      { scenario: 'empty storage', storageValue: null, expected: [] },
      { scenario: 'invalid JSON', storageValue: 'invalid json', expected: [] },
      { 
        scenario: 'valid envelope format', 
        storageValue: JSON.stringify({ version: 1, updatedAt: '2026-01-25T12:00:00.000Z', data: [{ id: '1', localId: 'uuid-1', name: 'Test Item', quantity: 1, category: 'Test', listId: '1', isChecked: false, image: '' }] }), 
        expected: [{ id: '1', localId: 'uuid-1', name: 'Test Item', quantity: 1, category: 'Test', listId: '1', isChecked: false, image: '' }] 
      },
      { 
        scenario: 'legacy array format', 
        storageValue: JSON.stringify([{ id: '1', localId: 'uuid-1', name: 'Test Item', quantity: 1, category: 'Test', listId: '1', isChecked: false, image: '' }]), 
        expected: [{ id: '1', localId: 'uuid-1', name: 'Test Item', quantity: 1, category: 'Test', listId: '1', isChecked: false, image: '' }] 
      },
    ])('when $scenario', ({ storageValue, expected }) => {
      it('should return correct data', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storageValue);

        const result = await guestStorage.getShoppingItems();

        expect(AsyncStorage.getItem).toHaveBeenCalledWith(itemsKey);
        if (storageValue === null) {
          expect(result).toEqual(expected);
        } else if (storageValue === 'invalid json') {
          expect(result).toEqual([]);
        } else {
          expect(result).toEqual(expected);
        }
      });
    });
  });

  describe('saveShoppingItems', () => {
    const itemsKey = getGuestStorageKey(ENTITY_TYPES.shoppingItems);

    it('should save shopping items to AsyncStorage as envelope', async () => {
      const items: ShoppingItem[] = [
        {
          id: '1',
          localId: 'uuid-1',
          name: 'Test Item',
          quantity: 1,
          category: 'Test',
          listId: '1',
          isChecked: false,
          image: '',
        },
      ];

      await guestStorage.saveShoppingItems(items);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        itemsKey,
        expect.stringContaining('"version":1')
      );
      
      const writtenData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(writtenData.version).toBe(1);
      expect(writtenData.data).toHaveLength(1);
    });

    it('should throw error if storage operation fails', async () => {
      const items: ShoppingItem[] = [];
      const error = new Error('Storage error');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(error);

      await expect(guestStorage.saveShoppingItems(items)).rejects.toThrow('Storage error');
    });
  });

  describe('clearAll', () => {
    it('should clear all guest data from AsyncStorage', async () => {
      await guestStorage.clearAll();

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(getGuestStorageKey(ENTITY_TYPES.recipes));
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(getGuestStorageKey(ENTITY_TYPES.shoppingLists));
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(getGuestStorageKey(ENTITY_TYPES.shoppingItems));
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(getGuestStorageKey(ENTITY_TYPES.chores));
      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(4);
    });

    it('should throw error if storage operation fails', async () => {
      const error = new Error('Storage error');
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(error);

      await expect(guestStorage.clearAll()).rejects.toThrow('Storage error');
    });
  });

  describe('round-trip persistence', () => {
    it('should save and retrieve recipes correctly with envelope format', async () => {
      const recipes: Recipe[] = [
        {
          id: '1',
          localId: 'uuid-1',
          name: 'Test Recipe',
          cookTime: '30 min',
          category: 'Dinner',
          ingredients: [],
          instructions: [],
        },
      ];

      // Save
      await guestStorage.saveRecipes(recipes);
      const writtenEnvelope = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(writtenEnvelope.version).toBe(1);
      expect(writtenEnvelope.data).toHaveLength(1);

      // Retrieve
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(writtenEnvelope));
      const retrieved = await guestStorage.getRecipes();
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0]).toMatchObject({
        id: '1',
        localId: 'uuid-1',
        name: 'Test Recipe',
      });
    });

    it('should save and retrieve shopping lists correctly with envelope format', async () => {
      const lists: ShoppingList[] = [
        {
          id: '1',
          localId: 'uuid-1',
          name: 'Test List',
          itemCount: 0,
          icon: 'cart-outline',
          color: '#000',
        },
      ];

      // Save
      await guestStorage.saveShoppingLists(lists);
      const writtenEnvelope = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(writtenEnvelope.version).toBe(1);

      // Retrieve
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(writtenEnvelope));
      const retrieved = await guestStorage.getShoppingLists();
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0]).toMatchObject({
        id: '1',
        localId: 'uuid-1',
        name: 'Test List',
      });
    });

    it('should save and retrieve shopping items correctly with envelope format', async () => {
      const items: ShoppingItem[] = [
        {
          id: '1',
          localId: 'uuid-1',
          name: 'Test Item',
          quantity: 1,
          category: 'Test',
          listId: '1',
          isChecked: false,
          image: '',
        },
      ];

      // Save
      await guestStorage.saveShoppingItems(items);
      const writtenEnvelope = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(writtenEnvelope.version).toBe(1);

      // Retrieve
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(writtenEnvelope));
      const retrieved = await guestStorage.getShoppingItems();
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0]).toMatchObject({
        id: '1',
        localId: 'uuid-1',
        name: 'Test Item',
      });
    });
  });
});
