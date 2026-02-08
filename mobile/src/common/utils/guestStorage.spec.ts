import AsyncStorage from '@react-native-async-storage/async-storage';
import { guestStorage } from './guestStorage';
import { Recipe } from '../../mocks/recipes';
import { ShoppingList, ShoppingItem } from '../../mocks/shopping';
import { Chore } from '../../mocks/chores';
import { getGuestStorageKey, ENTITY_TYPES } from '../storage/dataModeStorage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('guestStorage', () => {
  /**
   * Determines the expected result based on storage value and expected data.
   * Extracts complex conditional logic into a helper function for better readability.
   * Centralizes common test logic to reduce duplication across entity types.
   * 
   * @template T - Entity type (Recipe, ShoppingList, ShoppingItem, Chore)
   * @param storageValue - The raw storage value (string or null)
   * @param expected - The expected result for valid data
   * @returns The expected result array based on storage value validity
   */
  function getExpectedResultForStorageValue<T>(storageValue: string | null, expected: T[]): T[] {
    if (storageValue === null || storageValue.trim() === '') {
      return expected;
    }
    if (storageValue === 'invalid json') {
      return [];
    }
    
    // Parse and validate structure explicitly to avoid fragile string matching
    try {
      const parsed = JSON.parse(storageValue);
      // Check if it's a non-array object that's not a valid envelope
      if (typeof parsed === 'object' && !Array.isArray(parsed)) {
        // Valid envelope must have version, updatedAt, and data fields
        const hasVersion = 'version' in parsed;
        const hasUpdatedAt = 'updatedAt' in parsed;
        const hasData = 'data' in parsed;
        
        // If it's missing required envelope fields, it's invalid
        if (!hasVersion || !hasUpdatedAt || !hasData) {
          return [];
        }
      }
    } catch {
      // Invalid JSON already handled above (returns empty array for 'invalid json')
      // For other parse errors, fall through to return expected
    }
    
    return expected;
  }

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
        storageValue: JSON.stringify({ version: 1, updatedAt: '2026-01-25T12:00:00.000Z', data: [{ id: '1', localId: 'uuid-1', title: 'Test Recipe' }] }),
        expected: [{ id: '1', localId: 'uuid-1', title: 'Test Recipe' }]
      },
      { 
        scenario: 'legacy array format', 
        storageValue: JSON.stringify([{ id: '1', localId: 'uuid-1', title: 'Test Recipe' }]),
        expected: [{ id: '1', localId: 'uuid-1', title: 'Test Recipe' }]
      },
      { scenario: 'non-array data', storageValue: JSON.stringify({ not: 'an array' }), expected: [] },
      { scenario: 'array with invalid items', storageValue: JSON.stringify([{ id: '1' }, { localId: 'uuid-2' }, null]), expected: [] },
    ])('when $scenario', ({ storageValue, expected }) => {
      it('should return correct data', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storageValue);

        const result = await guestStorage.getRecipes();

        expect(AsyncStorage.getItem).toHaveBeenCalledWith(recipesKey);
        expect(result).toEqual(getExpectedResultForStorageValue(storageValue, expected));
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
          title: 'Test Recipe',
          cookTime: 30,
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
        title: 'Test Recipe',
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
        expect(result).toEqual(getExpectedResultForStorageValue(storageValue, expected));
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
        expect(result).toEqual(getExpectedResultForStorageValue(storageValue, expected));
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
          title: 'Test Recipe',
          cookTime: 30,
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
        title: 'Test Recipe',
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

  describe('getChores', () => {
    const choresKey = getGuestStorageKey(ENTITY_TYPES.chores);

    describe.each([
      { scenario: 'empty storage', storageValue: null, expected: [] },
      { scenario: 'invalid JSON', storageValue: 'invalid json', expected: [] },
      { 
        scenario: 'valid envelope format', 
        storageValue: JSON.stringify({ version: 1, updatedAt: '2026-01-25T12:00:00.000Z', data: [{ id: '1', localId: 'uuid-1', name: 'Test Chore', completed: false, dueDate: 'Today', section: 'today' }] }), 
        expected: [{ id: '1', localId: 'uuid-1', name: 'Test Chore', completed: false, dueDate: 'Today', section: 'today' }] 
      },
      { 
        scenario: 'legacy array format', 
        storageValue: JSON.stringify([{ id: '1', localId: 'uuid-1', name: 'Test Chore', completed: false, dueDate: 'Today', section: 'today' }]), 
        expected: [{ id: '1', localId: 'uuid-1', name: 'Test Chore', completed: false, dueDate: 'Today', section: 'today' }] 
      },
      { scenario: 'non-array data', storageValue: JSON.stringify({ not: 'an array' }), expected: [] },
      { scenario: 'array with invalid items', storageValue: JSON.stringify([{ id: '1' }, { localId: 'uuid-2' }, null]), expected: [] },
    ])('when $scenario', ({ storageValue, expected }) => {
      it('should return correct data', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storageValue);

        const result = await guestStorage.getChores();

        expect(AsyncStorage.getItem).toHaveBeenCalledWith(choresKey);
        expect(result).toEqual(getExpectedResultForStorageValue(storageValue, expected));
      });
    });
  });

  describe('saveChores', () => {
    const choresKey = getGuestStorageKey(ENTITY_TYPES.chores);

    it('should save chores to AsyncStorage as envelope', async () => {
      const chores: Chore[] = [
        {
          id: '1',
          localId: 'uuid-1',
          name: 'Test Chore',
          completed: false,
          dueDate: 'Today',
          section: 'today',
        },
      ];

      await guestStorage.saveChores(chores);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        choresKey,
        expect.stringContaining('"version":1')
      );
      
      const writtenData = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(writtenData.version).toBe(1);
      expect(writtenData.updatedAt).toBeDefined();
      expect(writtenData.data).toHaveLength(1);
      expect(writtenData.data[0]).toMatchObject({
        id: '1',
        localId: 'uuid-1',
        name: 'Test Chore',
      });
    });

    it('should throw error if storage operation fails', async () => {
      const chores: Chore[] = [];
      const error = new Error('Storage error');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(error);

      await expect(guestStorage.saveChores(chores)).rejects.toThrow('Storage error');
    });
  });

  describe('round-trip persistence', () => {
    it('should save and retrieve chores correctly with envelope format', async () => {
      const chores: Chore[] = [
        {
          id: '1',
          localId: 'uuid-1',
          name: 'Test Chore',
          completed: false,
          dueDate: 'Today',
          section: 'today',
        },
      ];

      // Save
      await guestStorage.saveChores(chores);
      const writtenEnvelope = JSON.parse((AsyncStorage.setItem as jest.Mock).mock.calls[0][1]);
      expect(writtenEnvelope.version).toBe(1);
      expect(writtenEnvelope.data).toHaveLength(1);

      // Retrieve
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(writtenEnvelope));
      const retrieved = await guestStorage.getChores();
      expect(retrieved).toHaveLength(1);
      expect(retrieved[0]).toMatchObject({
        id: '1',
        localId: 'uuid-1',
        name: 'Test Chore',
      });
    });
  });
});
