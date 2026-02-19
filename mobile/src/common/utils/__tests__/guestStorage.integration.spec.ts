import AsyncStorage from '@react-native-async-storage/async-storage';
import { guestStorage } from '../guestStorage';
import { Recipe } from '../../../mocks/recipes';
import { ShoppingList, ShoppingItem } from '../../../mocks/shopping';
import { Chore } from '../../../mocks/chores';
import { getGuestStorageKey, ENTITY_TYPES } from '../../storage/dataModeStorage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('guestStorage integration tests', () => {
  /**
   * Test data constants for corruption recovery tests.
   * Centralizes test data to improve maintainability and readability.
   */
  const CORRUPTED_ENVELOPE_JSON = '{"version":1,"updatedAt":"2026-01-25T12:00:00.000Z","data":[invalid json here}';
  const MALFORMED_ENVELOPE_OBJECT = { version: 1 }; // missing updatedAt and data
  const INVALID_DATA_TYPE_OBJECT = { not: 'an envelope', or: 'an array' };

  /**
   * Creates test entities for all entity types.
   * Centralizes entity creation to reduce duplication and improve maintainability.
   * 
   * @returns Object containing test entities for recipes, shopping lists, items, and chores
   */
  function createTestEntities() {
    return {
      recipe: {
        id: 'recipe-1',
        localId: 'recipe-uuid-1',
        title: 'Test Recipe',
        prepTime: 30,
        category: 'Dinner',
        ingredients: [],
        instructions: [],
      } as Recipe,
      shoppingList: {
        id: 'list-1',
        localId: 'list-uuid-1',
        name: 'Test List',
        itemCount: 0,
        icon: 'cart-outline',
        color: '#000',
      } as ShoppingList,
      shoppingItem: {
        id: 'item-1',
        localId: 'item-uuid-1',
        name: 'Test Item',
        quantity: 1,
        category: 'Other',
        listId: 'list-1',
        isChecked: false,
        image: '',
      } as ShoppingItem,
      chore: {
        id: 'chore-1',
        localId: 'chore-uuid-1',
        name: 'Test Chore',
        completed: false,
        dueDate: 'Today',
        section: 'today',
      } as Chore,
    };
  }

  /**
   * Type guard to assert that a value is defined.
   * Improves type safety by replacing non-null assertions with explicit checks.
   * 
   * @param value - Value to check
   * @param message - Error message if value is undefined
   * @throws Error if value is undefined
   */
  function assertDefined<T>(value: T | undefined, message: string): asserts value is T {
    if (value === undefined) {
      throw new Error(message);
    }
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Cross-entity independence', () => {
    it('should persist all entity types independently', async () => {
      const { recipe, shoppingList, shoppingItem, chore } = createTestEntities();

      // Save all entity types
      await guestStorage.saveRecipes([recipe]);
      await guestStorage.saveShoppingLists([shoppingList]);
      await guestStorage.saveShoppingItems([shoppingItem]);
      await guestStorage.saveChores([chore]);

      // Verify all storage operations were called with correct keys
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        getGuestStorageKey(ENTITY_TYPES.recipes),
        expect.stringContaining('"version":1')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        getGuestStorageKey(ENTITY_TYPES.shoppingLists),
        expect.stringContaining('"version":1')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        getGuestStorageKey(ENTITY_TYPES.shoppingItems),
        expect.stringContaining('"version":1')
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        getGuestStorageKey(ENTITY_TYPES.chores),
        expect.stringContaining('"version":1')
      );

      // Verify no cross-contamination by checking keys are separate
      const recipeCall = (AsyncStorage.setItem as jest.Mock).mock.calls.find(
        (call) => call[0] === getGuestStorageKey(ENTITY_TYPES.recipes)
      );
      const listCall = (AsyncStorage.setItem as jest.Mock).mock.calls.find(
        (call) => call[0] === getGuestStorageKey(ENTITY_TYPES.shoppingLists)
      );
      const itemCall = (AsyncStorage.setItem as jest.Mock).mock.calls.find(
        (call) => call[0] === getGuestStorageKey(ENTITY_TYPES.shoppingItems)
      );
      const choreCall = (AsyncStorage.setItem as jest.Mock).mock.calls.find(
        (call) => call[0] === getGuestStorageKey(ENTITY_TYPES.chores)
      );

      // Verify all calls were made and extract envelopes with type safety
      assertDefined(recipeCall, 'recipeCall should be defined');
      assertDefined(listCall, 'listCall should be defined');
      assertDefined(itemCall, 'itemCall should be defined');
      assertDefined(choreCall, 'choreCall should be defined');

      // Verify each envelope contains only its own data
      const recipeEnvelope = JSON.parse(recipeCall[1]);
      expect(recipeEnvelope.data).toHaveLength(1);
      expect(recipeEnvelope.data[0].title).toBe('Test Recipe');

      const listEnvelope = JSON.parse(listCall[1]);
      expect(listEnvelope.data).toHaveLength(1);
      expect(listEnvelope.data[0].name).toBe('Test List');

      const itemEnvelope = JSON.parse(itemCall[1]);
      expect(itemEnvelope.data).toHaveLength(1);
      expect(itemEnvelope.data[0].name).toBe('Test Item');

      const choreEnvelope = JSON.parse(choreCall[1]);
      expect(choreEnvelope.data).toHaveLength(1);
      expect(choreEnvelope.data[0].name).toBe('Test Chore');
    });
  });

  describe('Storage corruption recovery', () => {
    describe.each([
      ['recipes', ENTITY_TYPES.recipes, () => guestStorage.getRecipes()],
      ['shoppingLists', ENTITY_TYPES.shoppingLists, () => guestStorage.getShoppingLists()],
      ['shoppingItems', ENTITY_TYPES.shoppingItems, () => guestStorage.getShoppingItems()],
      ['chores', ENTITY_TYPES.chores, () => guestStorage.getChores()],
    ])('for %s', (entityName, entityType, getMethod) => {
      it('should return empty array when storage contains corrupted JSON', async () => {
        // Simulate corrupted JSON in storage
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(CORRUPTED_ENVELOPE_JSON);

        // Should return empty array, not crash
        const result = await getMethod();

        expect(result).toEqual([]);
        expect(AsyncStorage.getItem).toHaveBeenCalledWith(getGuestStorageKey(entityType));
      });

      it('should recover from malformed envelope gracefully', async () => {
        // Simulate malformed envelope (missing required fields)
        const malformedData = JSON.stringify(MALFORMED_ENVELOPE_OBJECT);
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(malformedData);

        // Should return empty array, not crash
        const result = await getMethod();

        expect(result).toEqual([]);
      });

      it('should recover from wrong data type gracefully', async () => {
        // Simulate wrong data type (not envelope, not array)
        const wrongData = JSON.stringify(INVALID_DATA_TYPE_OBJECT);
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(wrongData);

        // Should return empty array, not crash
        const result = await getMethod();

        expect(result).toEqual([]);
      });
    });
  });

  describe('clearAll', () => {
    it('should clear all entity types', async () => {
      const { recipe, shoppingList, shoppingItem, chore } = createTestEntities();

      // Save all entity types
      await guestStorage.saveRecipes([recipe]);
      await guestStorage.saveShoppingLists([shoppingList]);
      await guestStorage.saveShoppingItems([shoppingItem]);
      await guestStorage.saveChores([chore]);

      // Clear all
      await guestStorage.clearAll();

      // Verify all keys are removed
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(getGuestStorageKey(ENTITY_TYPES.recipes));
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(getGuestStorageKey(ENTITY_TYPES.shoppingLists));
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(getGuestStorageKey(ENTITY_TYPES.shoppingItems));
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(getGuestStorageKey(ENTITY_TYPES.chores));
      expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(4);

      // Verify subsequent reads return empty arrays
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      const recipes = await guestStorage.getRecipes();
      const lists = await guestStorage.getShoppingLists();
      const items = await guestStorage.getShoppingItems();
      const chores = await guestStorage.getChores();

      expect(recipes).toEqual([]);
      expect(lists).toEqual([]);
      expect(items).toEqual([]);
      expect(chores).toEqual([]);
    });
  });
});
