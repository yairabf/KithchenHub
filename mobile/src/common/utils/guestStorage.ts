import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe } from '../../mocks/recipes';
import { ShoppingList, ShoppingItem } from '../../mocks/shopping';

const GUEST_RECIPES_KEY = '@kitchen_hub_guest_recipes';
const GUEST_SHOPPING_LISTS_KEY = '@kitchen_hub_guest_shopping_lists';
const GUEST_SHOPPING_ITEMS_KEY = '@kitchen_hub_guest_shopping_items';

/**
 * Validates that a recipe has required fields
 * @param recipe - The recipe object to validate
 * @returns True if the recipe is valid, false otherwise
 */
function validateRecipe(recipe: unknown): recipe is Recipe {
  return (
    recipe !== null &&
    typeof recipe === 'object' &&
    'localId' in recipe &&
    typeof (recipe as any).localId === 'string' &&
    (recipe as any).localId.length > 0 &&
    'name' in recipe &&
    typeof (recipe as any).name === 'string' &&
    (recipe as any).name.trim().length > 0
  );
}

/**
 * Validates that a shopping list has required fields
 * @param list - The shopping list object to validate
 * @returns True if the list is valid, false otherwise
 */
function validateShoppingList(list: unknown): list is ShoppingList {
  return (
    list !== null &&
    typeof list === 'object' &&
    'localId' in list &&
    typeof (list as any).localId === 'string' &&
    (list as any).localId.length > 0 &&
    'name' in list &&
    typeof (list as any).name === 'string' &&
    (list as any).name.trim().length > 0
  );
}

/**
 * Validates that a shopping item has required fields
 * @param item - The shopping item object to validate
 * @returns True if the item is valid, false otherwise
 */
function validateShoppingItem(item: unknown): item is ShoppingItem {
  return (
    item !== null &&
    typeof item === 'object' &&
    'localId' in item &&
    typeof (item as any).localId === 'string' &&
    (item as any).localId.length > 0 &&
    'name' in item &&
    typeof (item as any).name === 'string' &&
    (item as any).name.trim().length > 0 &&
    'listId' in item &&
    typeof (item as any).listId === 'string' &&
    (item as any).listId.length > 0
  );
}

/**
 * Guest storage utilities for persisting and retrieving guest user data.
 * 
 * All methods return empty arrays when no data exists (not mock data).
 * Handles parse errors gracefully by returning empty arrays.
 */
export const guestStorage = {
  /**
   * Retrieves all guest recipes from AsyncStorage.
   * @returns Array of Recipe objects, or empty array if none exist
   * @remarks Returns empty array on error to prevent app crashes.
   *          Errors are logged with storage key context for debugging.
   */
  async getRecipes(): Promise<Recipe[]> {
    try {
      const data = await AsyncStorage.getItem(GUEST_RECIPES_KEY);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      // Validate it's an array
      if (!Array.isArray(parsed)) {
        console.error(`Invalid recipe data format in ${GUEST_RECIPES_KEY}: expected array, got ${typeof parsed}`);
        return [];
      }
      // Validate each recipe has required fields
      return parsed.filter((r): r is Recipe => 
        r && typeof r === 'object' && r.localId && typeof r.localId === 'string' && r.name && typeof r.name === 'string'
      );
    } catch (error) {
      console.error(`Error reading guest recipes from ${GUEST_RECIPES_KEY}:`, error);
      return [];
    }
  },

  /**
   * Saves guest recipes to AsyncStorage.
   * @param recipes - Array of Recipe objects to save
   * @throws Error if storage operation fails or recipes are invalid
   */
  async saveRecipes(recipes: Recipe[]): Promise<void> {
    // Validate input
    if (!Array.isArray(recipes)) {
      throw new Error('Recipes must be an array');
    }
    
    const invalidRecipes = recipes.filter(r => !validateRecipe(r));
    if (invalidRecipes.length > 0) {
      throw new Error(`Invalid recipes detected: ${invalidRecipes.length} recipes missing required fields (localId, name)`);
    }
    
    try {
      await AsyncStorage.setItem(GUEST_RECIPES_KEY, JSON.stringify(recipes));
    } catch (error) {
      console.error(`Error saving guest recipes to ${GUEST_RECIPES_KEY}:`, error);
      throw error;
    }
  },

  /**
   * Retrieves all guest shopping lists from AsyncStorage.
   * @returns Array of ShoppingList objects, or empty array if none exist
   * @remarks Returns empty array on error to prevent app crashes.
   *          Errors are logged with storage key context for debugging.
   */
  async getShoppingLists(): Promise<ShoppingList[]> {
    try {
      const data = await AsyncStorage.getItem(GUEST_SHOPPING_LISTS_KEY);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      // Validate it's an array
      if (!Array.isArray(parsed)) {
        console.error(`Invalid shopping list data format in ${GUEST_SHOPPING_LISTS_KEY}: expected array, got ${typeof parsed}`);
        return [];
      }
      // Validate each list has required fields
      return parsed.filter((l): l is ShoppingList => 
        l && typeof l === 'object' && l.localId && typeof l.localId === 'string' && l.name && typeof l.name === 'string'
      );
    } catch (error) {
      console.error(`Error reading guest shopping lists from ${GUEST_SHOPPING_LISTS_KEY}:`, error);
      return [];
    }
  },

  /**
   * Saves guest shopping lists to AsyncStorage.
   * @param lists - Array of ShoppingList objects to save
   * @throws Error if storage operation fails
   */
  async saveShoppingLists(lists: ShoppingList[]): Promise<void> {
    try {
      await AsyncStorage.setItem(GUEST_SHOPPING_LISTS_KEY, JSON.stringify(lists));
    } catch (error) {
      console.error(`Error saving guest shopping lists to ${GUEST_SHOPPING_LISTS_KEY}:`, error);
      throw error;
    }
  },

  /**
   * Retrieves all guest shopping items from AsyncStorage.
   * @returns Array of ShoppingItem objects, or empty array if none exist
   * @remarks Returns empty array on error to prevent app crashes.
   *          Errors are logged with storage key context for debugging.
   */
  async getShoppingItems(): Promise<ShoppingItem[]> {
    try {
      const data = await AsyncStorage.getItem(GUEST_SHOPPING_ITEMS_KEY);
      if (!data) return [];
      
      const parsed = JSON.parse(data);
      // Validate it's an array
      if (!Array.isArray(parsed)) {
        console.error(`Invalid shopping item data format in ${GUEST_SHOPPING_ITEMS_KEY}: expected array, got ${typeof parsed}`);
        return [];
      }
      // Validate each item has required fields
      return parsed.filter((i): i is ShoppingItem => 
        i && typeof i === 'object' && i.localId && typeof i.localId === 'string' && i.name && typeof i.name === 'string' && i.listId && typeof i.listId === 'string'
      );
    } catch (error) {
      console.error(`Error reading guest shopping items from ${GUEST_SHOPPING_ITEMS_KEY}:`, error);
      return [];
    }
  },

  /**
   * Saves guest shopping items to AsyncStorage.
   * @param items - Array of ShoppingItem objects to save
   * @throws Error if storage operation fails or items are invalid
   */
  async saveShoppingItems(items: ShoppingItem[]): Promise<void> {
    // Validate input
    if (!Array.isArray(items)) {
      throw new Error('Shopping items must be an array');
    }
    
    const invalidItems = items.filter(i => !validateShoppingItem(i));
    if (invalidItems.length > 0) {
      throw new Error(`Invalid shopping items detected: ${invalidItems.length} items missing required fields (localId, name, listId)`);
    }
    
    try {
      await AsyncStorage.setItem(GUEST_SHOPPING_ITEMS_KEY, JSON.stringify(items));
    } catch (error) {
      console.error(`Error saving guest shopping items to ${GUEST_SHOPPING_ITEMS_KEY}:`, error);
      throw error;
    }
  },

  /**
   * Clears all guest data from AsyncStorage.
   * @throws Error if storage operation fails
   */
  async clearAll(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(GUEST_RECIPES_KEY),
        AsyncStorage.removeItem(GUEST_SHOPPING_LISTS_KEY),
        AsyncStorage.removeItem(GUEST_SHOPPING_ITEMS_KEY),
      ]);
    } catch (error) {
      console.error(`Error clearing guest data (keys: ${GUEST_RECIPES_KEY}, ${GUEST_SHOPPING_LISTS_KEY}, ${GUEST_SHOPPING_ITEMS_KEY}):`, error);
      throw error;
    }
  },
};
