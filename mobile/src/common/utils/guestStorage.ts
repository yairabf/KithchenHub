import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe } from '../../mocks/recipes';
import { ShoppingList, ShoppingItem } from '../../mocks/shopping';
import { toPersistedTimestamps, fromPersistedTimestamps } from '../types/entityMetadata';

const GUEST_RECIPES_KEY = '@kitchen_hub_guest_recipes';
const GUEST_SHOPPING_LISTS_KEY = '@kitchen_hub_guest_shopping_lists';
const GUEST_SHOPPING_ITEMS_KEY = '@kitchen_hub_guest_shopping_items';

/**
 * Validates that a recipe has required fields
 * @param recipe - The recipe object to validate
 * @returns True if the recipe is valid, false otherwise
 */
function validateRecipe(recipe: unknown): recipe is Recipe {
  if (!recipe || typeof recipe !== 'object') {
    return false;
  }
  
  const candidate = recipe as Record<string, unknown>;
  
  return (
    typeof candidate.localId === 'string' &&
    candidate.localId.length > 0 &&
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0
  );
}

/**
 * Validates that a shopping list has required fields
 * @param list - The shopping list object to validate
 * @returns True if the list is valid, false otherwise
 */
function validateShoppingList(list: unknown): list is ShoppingList {
  if (!list || typeof list !== 'object') {
    return false;
  }
  
  const candidate = list as Record<string, unknown>;
  
  return (
    typeof candidate.localId === 'string' &&
    candidate.localId.length > 0 &&
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0
  );
}

/**
 * Validates that a shopping item has required fields
 * @param item - The shopping item object to validate
 * @returns True if the item is valid, false otherwise
 */
function validateShoppingItem(item: unknown): item is ShoppingItem {
  if (!item || typeof item !== 'object') {
    return false;
  }
  
  const candidate = item as Record<string, unknown>;
  
  return (
    typeof candidate.localId === 'string' &&
    candidate.localId.length > 0 &&
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0 &&
    typeof candidate.listId === 'string' &&
    candidate.listId.length > 0
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
   *          Timestamps are normalized from ISO strings to Date objects (shallow normalization only).
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
      // Filter out null/invalid items before normalization
      const validItems = parsed.filter((r): r is Record<string, unknown> => 
        r !== null && typeof r === 'object'
      );
      // Shallow normalization: convert ISO strings to Date objects (top-level entities only)
      const normalized = validItems.map(fromPersistedTimestamps);
      // Validate each recipe has required fields
      return normalized.filter((r): r is Recipe => 
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
   * @remarks Timestamps are serialized from Date objects to ISO strings (shallow serialization only).
   *          deletedAt is omitted (not null) for active records.
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
      // Shallow serialization: convert Date objects to ISO strings (top-level entities only)
      const serialized = recipes.map(toPersistedTimestamps);
      await AsyncStorage.setItem(GUEST_RECIPES_KEY, JSON.stringify(serialized));
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
   *          Timestamps are normalized from ISO strings to Date objects (shallow normalization only).
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
      // Filter out null/invalid items before normalization
      const validItems = parsed.filter((l): l is Record<string, unknown> => 
        l !== null && typeof l === 'object'
      );
      // Shallow normalization: convert ISO strings to Date objects (top-level entities only)
      const normalized = validItems.map(fromPersistedTimestamps);
      // Validate each list has required fields
      return normalized.filter((l): l is ShoppingList => 
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
   * @remarks Timestamps are serialized from Date objects to ISO strings (shallow serialization only).
   *          deletedAt is omitted (not null) for active records.
   */
  async saveShoppingLists(lists: ShoppingList[]): Promise<void> {
    try {
      // Shallow serialization: convert Date objects to ISO strings (top-level entities only)
      const serialized = lists.map(toPersistedTimestamps);
      await AsyncStorage.setItem(GUEST_SHOPPING_LISTS_KEY, JSON.stringify(serialized));
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
   *          Timestamps are normalized from ISO strings to Date objects (shallow normalization only).
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
      // Filter out null/invalid items before normalization
      const validItems = parsed.filter((i): i is Record<string, unknown> => 
        i !== null && typeof i === 'object'
      );
      // Shallow normalization: convert ISO strings to Date objects (top-level entities only)
      const normalized = validItems.map(fromPersistedTimestamps);
      // Validate each item has required fields
      return normalized.filter((i): i is ShoppingItem => 
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
   * @remarks Timestamps are serialized from Date objects to ISO strings (shallow serialization only).
   *          deletedAt is omitted (not null) for active records.
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
      // Shallow serialization: convert Date objects to ISO strings (top-level entities only)
      const serialized = items.map(toPersistedTimestamps);
      await AsyncStorage.setItem(GUEST_SHOPPING_ITEMS_KEY, JSON.stringify(serialized));
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
