import AsyncStorage from '@react-native-async-storage/async-storage';
import { guestStorage } from './guestStorage';
import { Recipe } from '../../mocks/recipes';
import { ShoppingList, ShoppingItem } from '../../mocks/shopping';

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
    describe.each([
      { scenario: 'empty storage', storageValue: null, expected: [] },
      { scenario: 'invalid JSON', storageValue: 'invalid json', expected: [] },
      { scenario: 'valid data', storageValue: JSON.stringify([{ id: '1', localId: 'uuid-1', name: 'Test Recipe' }]), expected: [{ id: '1', localId: 'uuid-1', name: 'Test Recipe' }] },
      { scenario: 'non-array data', storageValue: JSON.stringify({ not: 'an array' }), expected: [] },
      { scenario: 'array with invalid items', storageValue: JSON.stringify([{ id: '1' }, { localId: 'uuid-2' }, null]), expected: [] },
    ])('when $scenario', ({ storageValue, expected }) => {
      it('should return correct data', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storageValue);

        const result = await guestStorage.getRecipes();

        expect(AsyncStorage.getItem).toHaveBeenCalledWith('@kitchen_hub_guest_recipes');
        if (storageValue === null) {
          expect(result).toEqual(expected);
        } else if (storageValue === 'invalid json' || storageValue?.includes('not') || storageValue?.includes('null')) {
          expect(result).toEqual([]);
        } else {
          expect(result).toEqual(expected);
        }
      });
    });
  });

  describe('saveRecipes', () => {
    it('should save recipes to AsyncStorage', async () => {
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
        '@kitchen_hub_guest_recipes',
        JSON.stringify(recipes)
      );
    });

    it('should throw error if storage operation fails', async () => {
      const recipes: Recipe[] = [];
      const error = new Error('Storage error');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(error);

      await expect(guestStorage.saveRecipes(recipes)).rejects.toThrow('Storage error');
    });
  });

  describe('getShoppingLists', () => {
    describe.each([
      { scenario: 'empty storage', storageValue: null, expected: [] },
      { scenario: 'invalid JSON', storageValue: 'invalid json', expected: [] },
      { scenario: 'valid data', storageValue: JSON.stringify([{ id: '1', localId: 'uuid-1', name: 'Test List', itemCount: 0, icon: 'cart-outline', color: '#000' }]), expected: [{ id: '1', localId: 'uuid-1', name: 'Test List', itemCount: 0, icon: 'cart-outline', color: '#000' }] },
    ])('when $scenario', ({ storageValue, expected }) => {
      it('should return correct data', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storageValue);

        const result = await guestStorage.getShoppingLists();

        expect(AsyncStorage.getItem).toHaveBeenCalledWith('@kitchen_hub_guest_shopping_lists');
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
    it('should save shopping lists to AsyncStorage', async () => {
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
        '@kitchen_hub_guest_shopping_lists',
        JSON.stringify(lists)
      );
    });

    it('should throw error if storage operation fails', async () => {
      const lists: ShoppingList[] = [];
      const error = new Error('Storage error');
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(error);

      await expect(guestStorage.saveShoppingLists(lists)).rejects.toThrow('Storage error');
    });
  });

  describe('getShoppingItems', () => {
    describe.each([
      { scenario: 'empty storage', storageValue: null, expected: [] },
      { scenario: 'invalid JSON', storageValue: 'invalid json', expected: [] },
      { scenario: 'valid data', storageValue: JSON.stringify([{ id: '1', localId: 'uuid-1', name: 'Test Item', quantity: 1, category: 'Test', listId: '1', isChecked: false, image: '' }]), expected: [{ id: '1', localId: 'uuid-1', name: 'Test Item', quantity: 1, category: 'Test', listId: '1', isChecked: false, image: '' }] },
    ])('when $scenario', ({ storageValue, expected }) => {
      it('should return correct data', async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storageValue);

        const result = await guestStorage.getShoppingItems();

        expect(AsyncStorage.getItem).toHaveBeenCalledWith('@kitchen_hub_guest_shopping_items');
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
    it('should save shopping items to AsyncStorage', async () => {
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
        '@kitchen_hub_guest_shopping_items',
        JSON.stringify(items)
      );
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

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@kitchen_hub_guest_recipes');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@kitchen_hub_guest_shopping_lists');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@kitchen_hub_guest_shopping_items');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@kitchen_hub_guest_chores');
      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(4);
    });

    it('should throw error if storage operation fails', async () => {
      const error = new Error('Storage error');
      (AsyncStorage.removeItem as jest.Mock).mockRejectedValue(error);

      await expect(guestStorage.clearAll()).rejects.toThrow('Storage error');
    });
  });

  describe('round-trip persistence', () => {
    it('should save and retrieve recipes correctly', async () => {
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
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@kitchen_hub_guest_recipes',
        JSON.stringify(recipes)
      );

      // Retrieve
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(recipes));
      const retrieved = await guestStorage.getRecipes();
      expect(retrieved).toEqual(recipes);
    });

    it('should save and retrieve shopping lists correctly', async () => {
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
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@kitchen_hub_guest_shopping_lists',
        JSON.stringify(lists)
      );

      // Retrieve
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(lists));
      const retrieved = await guestStorage.getShoppingLists();
      expect(retrieved).toEqual(lists);
    });

    it('should save and retrieve shopping items correctly', async () => {
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
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@kitchen_hub_guest_shopping_items',
        JSON.stringify(items)
      );

      // Retrieve
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(items));
      const retrieved = await guestStorage.getShoppingItems();
      expect(retrieved).toEqual(items);
    });
  });
});
