/**
 * Guest Storage Module (AsyncStorage v1)
 * 
 * This module provides persistence for guest user data using AsyncStorage as the backend.
 * 
 * **Storage Backend Decision**: AsyncStorage is the chosen backend for Guest Mode v1.
 * See `docs/architecture/GUEST_STORAGE_DECISION.md` for the full decision rationale,
 * operational limits, migration triggers, and migration plan.
 * 
 * **Operational Limits**:
 * - Full collection read/write pattern (no partial updates)
 * - No transactions or atomicity guarantees
 * - No indexing or query optimization
 * - Single-writer pattern required to prevent race conditions
 * 
 * **Migration Triggers**: When guest data exceeds ~1,000 entities, operations exceed
 * 100-200ms, or feature requirements demand partial updates/indexing, migration to
 * SQLite/WatermelonDB should be initiated. See decision document for details.
 * 
 * @module guestStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe } from '../../mocks/recipes';
import { ShoppingList, ShoppingItem } from '../../mocks/shopping';
import { Chore } from '../../mocks/chores';
import { toPersistedTimestamps, fromPersistedTimestamps } from '../types/entityMetadata';

const GUEST_RECIPES_KEY = '@kitchen_hub_guest_recipes';
const GUEST_SHOPPING_LISTS_KEY = '@kitchen_hub_guest_shopping_lists';
const GUEST_SHOPPING_ITEMS_KEY = '@kitchen_hub_guest_shopping_items';
const GUEST_CHORES_KEY = '@kitchen_hub_guest_chores';

// Performance monitoring thresholds
const PERFORMANCE_THRESHOLD_MS = 100;
const ENTITY_COUNT_THRESHOLD = 100;
const PAYLOAD_SIZE_THRESHOLD_BYTES = 100000;

/**
 * Gets current high-resolution timestamp for performance monitoring.
 * Falls back to Date.now() if performance API is not available.
 * 
 * @returns High-resolution timestamp in milliseconds, or Date.now() if performance API is unavailable
 * @remarks This function provides a safe way to measure performance across different
 *          React Native environments. The performance API may not be available in all
 *          contexts (e.g., older React Native versions, certain test environments).
 */
function getPerformanceNow(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

/**
 * Logs performance metrics if thresholds are exceeded.
 * 
 * @param operationName - Name of the operation (e.g., 'getRecipes', 'saveShoppingItems')
 * @param startTime - Start timestamp from getPerformanceNow()
 * @param entityCount - Number of entities processed
 * @param payloadSize - Size of payload in bytes
 * @remarks This function centralizes performance monitoring logic to ensure consistent
 *          logging format and threshold checking across all storage operations.
 */
function logPerformanceIfNeeded(
  operationName: string,
  startTime: number,
  entityCount: number,
  payloadSize: number
): void {
  const duration = getPerformanceNow() - startTime;
  
  if (duration > PERFORMANCE_THRESHOLD_MS || 
      entityCount > ENTITY_COUNT_THRESHOLD || 
      payloadSize > PAYLOAD_SIZE_THRESHOLD_BYTES) {
    console.log(
      `[guestStorage] ${operationName}: ${entityCount} entities, ${payloadSize} bytes, ${duration.toFixed(2)}ms`
    );
  }
}

/**
 * Logs a warning for slow empty reads (baseline performance check).
 * 
 * @param operationName - Name of the operation
 * @param startTime - Start timestamp from getPerformanceNow()
 */
function logSlowEmptyRead(operationName: string, startTime: number): void {
  const duration = getPerformanceNow() - startTime;
  if (duration > PERFORMANCE_THRESHOLD_MS) {
    console.warn(`[guestStorage] ${operationName} took ${duration.toFixed(2)}ms (empty)`);
  }
}

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
 * Validates that a chore has required fields
 * @param chore - The chore object to validate
 * @returns True if the chore is valid, false otherwise
 */
function validateChore(chore: unknown): chore is Chore {
  if (!chore || typeof chore !== 'object') {
    return false;
  }
  
  const candidate = chore as Record<string, unknown>;
  
  return (
    typeof candidate.localId === 'string' &&
    candidate.localId.length > 0 &&
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0
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
    const startTime = getPerformanceNow();
    try {
      const data = await AsyncStorage.getItem(GUEST_RECIPES_KEY);
      if (!data) {
        logSlowEmptyRead('getRecipes', startTime);
        return [];
      }
      
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
      const normalized = validItems.map(fromPersistedTimestamps) as unknown as Recipe[];
      // Validate each recipe has required fields using existing validator
      const result = normalized.filter(validateRecipe);
      
      // Performance monitoring: log if operation exceeds threshold or data size is large
      logPerformanceIfNeeded('getRecipes', startTime, result.length, data.length);
      
      return result;
    } catch (error) {
      const duration = getPerformanceNow() - startTime;
      console.error(`Error reading guest recipes from ${GUEST_RECIPES_KEY} (${duration.toFixed(2)}ms):`, error);
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
    const startTime = getPerformanceNow();
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
      const jsonString = JSON.stringify(serialized);
      await AsyncStorage.setItem(GUEST_RECIPES_KEY, jsonString);
      
      // Performance monitoring: log if operation exceeds threshold or data size is large
      logPerformanceIfNeeded('saveRecipes', startTime, recipes.length, jsonString.length);
    } catch (error) {
      const duration = getPerformanceNow() - startTime;
      console.error(`Error saving guest recipes to ${GUEST_RECIPES_KEY} (${duration.toFixed(2)}ms):`, error);
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
    const startTime = getPerformanceNow();
    try {
      const data = await AsyncStorage.getItem(GUEST_SHOPPING_LISTS_KEY);
      if (!data) {
        logSlowEmptyRead('getShoppingLists', startTime);
        return [];
      }
      
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
      const normalized = validItems.map(fromPersistedTimestamps) as unknown as ShoppingList[];
      // Validate each list has required fields using existing validator
      const result = normalized.filter(validateShoppingList);
      
      // Performance monitoring: log if operation exceeds threshold or data size is large
      logPerformanceIfNeeded('getShoppingLists', startTime, result.length, data.length);
      
      return result;
    } catch (error) {
      const duration = getPerformanceNow() - startTime;
      console.error(`Error reading guest shopping lists from ${GUEST_SHOPPING_LISTS_KEY} (${duration.toFixed(2)}ms):`, error);
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
    const startTime = getPerformanceNow();
    try {
      // Shallow serialization: convert Date objects to ISO strings (top-level entities only)
      const serialized = lists.map(toPersistedTimestamps);
      const jsonString = JSON.stringify(serialized);
      await AsyncStorage.setItem(GUEST_SHOPPING_LISTS_KEY, jsonString);
      
      // Performance monitoring: log if operation exceeds threshold or data size is large
      logPerformanceIfNeeded('saveShoppingLists', startTime, lists.length, jsonString.length);
    } catch (error) {
      const duration = getPerformanceNow() - startTime;
      console.error(`Error saving guest shopping lists to ${GUEST_SHOPPING_LISTS_KEY} (${duration.toFixed(2)}ms):`, error);
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
    const startTime = getPerformanceNow();
    try {
      const data = await AsyncStorage.getItem(GUEST_SHOPPING_ITEMS_KEY);
      if (!data) {
        logSlowEmptyRead('getShoppingItems', startTime);
        return [];
      }
      
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
      const normalized = validItems.map(fromPersistedTimestamps) as unknown as ShoppingItem[];
      // Validate each item has required fields using existing validator
      const result = normalized.filter(validateShoppingItem);
      
      // Performance monitoring: log if operation exceeds threshold or data size is large
      logPerformanceIfNeeded('getShoppingItems', startTime, result.length, data.length);
      
      return result;
    } catch (error) {
      const duration = getPerformanceNow() - startTime;
      console.error(`Error reading guest shopping items from ${GUEST_SHOPPING_ITEMS_KEY} (${duration.toFixed(2)}ms):`, error);
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
    const startTime = getPerformanceNow();
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
      const jsonString = JSON.stringify(serialized);
      await AsyncStorage.setItem(GUEST_SHOPPING_ITEMS_KEY, jsonString);
      
      // Performance monitoring: log if operation exceeds threshold or data size is large
      logPerformanceIfNeeded('saveShoppingItems', startTime, items.length, jsonString.length);
    } catch (error) {
      const duration = getPerformanceNow() - startTime;
      console.error(`Error saving guest shopping items to ${GUEST_SHOPPING_ITEMS_KEY} (${duration.toFixed(2)}ms):`, error);
      throw error;
    }
  },

  /**
   * Retrieves all guest chores from AsyncStorage.
   * @returns Array of Chore objects, or empty array if none exist
   * @remarks Returns empty array on error to prevent app crashes.
   *          Errors are logged with storage key context for debugging.
   *          Timestamps are normalized from ISO strings to Date objects (shallow normalization only).
   */
  async getChores(): Promise<Chore[]> {
    const startTime = getPerformanceNow();
    try {
      const data = await AsyncStorage.getItem(GUEST_CHORES_KEY);
      if (!data) {
        logSlowEmptyRead('getChores', startTime);
        return [];
      }
      
      const parsed = JSON.parse(data);
      // Validate it's an array
      if (!Array.isArray(parsed)) {
        console.error(`Invalid chore data format in ${GUEST_CHORES_KEY}: expected array, got ${typeof parsed}`);
        return [];
      }
      // Filter out null/invalid items before normalization
      const validItems = parsed.filter((c): c is Record<string, unknown> => 
        c !== null && typeof c === 'object'
      );
      // Shallow normalization: convert ISO strings to Date objects (top-level entities only)
      const normalized = validItems.map(fromPersistedTimestamps) as unknown as Chore[];
      // Validate each chore has required fields using existing validator
      const result = normalized.filter(validateChore);
      
      // Performance monitoring: log if operation exceeds threshold or data size is large
      logPerformanceIfNeeded('getChores', startTime, result.length, data.length);
      
      return result;
    } catch (error) {
      const duration = getPerformanceNow() - startTime;
      console.error(`Error reading guest chores from ${GUEST_CHORES_KEY} (${duration.toFixed(2)}ms):`, error);
      return [];
    }
  },

  /**
   * Saves guest chores to AsyncStorage.
   * @param chores - Array of Chore objects to save
   * @throws Error if storage operation fails or chores are invalid
   * @remarks Timestamps are serialized from Date objects to ISO strings (shallow serialization only).
   *          deletedAt is omitted (not null) for active records.
   */
  async saveChores(chores: Chore[]): Promise<void> {
    const startTime = getPerformanceNow();
    // Validate input
    if (!Array.isArray(chores)) {
      throw new Error('Chores must be an array');
    }
    
    const invalidChores = chores.filter(c => !validateChore(c));
    if (invalidChores.length > 0) {
      throw new Error(`Invalid chores detected: ${invalidChores.length} chores missing required fields (localId, name)`);
    }
    
    try {
      // Shallow serialization: convert Date objects to ISO strings (top-level entities only)
      const serialized = chores.map(toPersistedTimestamps);
      const jsonString = JSON.stringify(serialized);
      await AsyncStorage.setItem(GUEST_CHORES_KEY, jsonString);
      
      // Performance monitoring: log if operation exceeds threshold or data size is large
      logPerformanceIfNeeded('saveChores', startTime, chores.length, jsonString.length);
    } catch (error) {
      const duration = getPerformanceNow() - startTime;
      console.error(`Error saving guest chores to ${GUEST_CHORES_KEY} (${duration.toFixed(2)}ms):`, error);
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
        AsyncStorage.removeItem(GUEST_CHORES_KEY),
      ]);
    } catch (error) {
      console.error(`Error clearing guest data (keys: ${GUEST_RECIPES_KEY}, ${GUEST_SHOPPING_LISTS_KEY}, ${GUEST_SHOPPING_ITEMS_KEY}, ${GUEST_CHORES_KEY}):`, error);
      throw error;
    }
  },
};
