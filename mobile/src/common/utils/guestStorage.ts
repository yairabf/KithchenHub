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
import { getGuestStorageKey, ENTITY_TYPES } from '../storage/dataModeStorage';
import { readEntityEnvelope, writeEntityEnvelope } from './guestStorageHelpers';

const GUEST_RECIPES_KEY = getGuestStorageKey(ENTITY_TYPES.recipes);
const GUEST_SHOPPING_LISTS_KEY = getGuestStorageKey(ENTITY_TYPES.shoppingLists);
const GUEST_SHOPPING_ITEMS_KEY = getGuestStorageKey(ENTITY_TYPES.shoppingItems);
const GUEST_CHORES_KEY = getGuestStorageKey(ENTITY_TYPES.chores);


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
    const envelope = await readEntityEnvelope(GUEST_RECIPES_KEY, validateRecipe);
    return envelope.data;
  },

  /**
   * Saves guest recipes to AsyncStorage.
   * @param recipes - Array of Recipe objects to save
   * @throws Error if storage operation fails or recipes are invalid
   * @remarks Timestamps are serialized from Date objects to ISO strings (shallow serialization only).
   *          deletedAt is omitted (not null) for active records.
   */
  async saveRecipes(recipes: Recipe[]): Promise<void> {
    await writeEntityEnvelope(GUEST_RECIPES_KEY, recipes, validateRecipe);
  },

  /**
   * Retrieves all guest shopping lists from AsyncStorage.
   * @returns Array of ShoppingList objects, or empty array if none exist
   * @remarks Returns empty array on error to prevent app crashes.
   *          Errors are logged with storage key context for debugging.
   *          Timestamps are normalized from ISO strings to Date objects (shallow normalization only).
   */
  async getShoppingLists(): Promise<ShoppingList[]> {
    const envelope = await readEntityEnvelope(GUEST_SHOPPING_LISTS_KEY, validateShoppingList);
    return envelope.data;
  },

  /**
   * Saves guest shopping lists to AsyncStorage.
   * @param lists - Array of ShoppingList objects to save
   * @throws Error if storage operation fails
   * @remarks Timestamps are serialized from Date objects to ISO strings (shallow serialization only).
   *          deletedAt is omitted (not null) for active records.
   */
  async saveShoppingLists(lists: ShoppingList[]): Promise<void> {
    await writeEntityEnvelope(GUEST_SHOPPING_LISTS_KEY, lists, validateShoppingList);
  },

  /**
   * Retrieves all guest shopping items from AsyncStorage.
   * @returns Array of ShoppingItem objects, or empty array if none exist
   * @remarks Returns empty array on error to prevent app crashes.
   *          Errors are logged with storage key context for debugging.
   *          Timestamps are normalized from ISO strings to Date objects (shallow normalization only).
   */
  async getShoppingItems(): Promise<ShoppingItem[]> {
    const envelope = await readEntityEnvelope(GUEST_SHOPPING_ITEMS_KEY, validateShoppingItem);
    return envelope.data;
  },

  /**
   * Saves guest shopping items to AsyncStorage.
   * @param items - Array of ShoppingItem objects to save
   * @throws Error if storage operation fails or items are invalid
   * @remarks Timestamps are serialized from Date objects to ISO strings (shallow serialization only).
   *          deletedAt is omitted (not null) for active records.
   */
  async saveShoppingItems(items: ShoppingItem[]): Promise<void> {
    await writeEntityEnvelope(GUEST_SHOPPING_ITEMS_KEY, items, validateShoppingItem);
  },

  /**
   * Retrieves all guest chores from AsyncStorage.
   * @returns Array of Chore objects, or empty array if none exist
   * @remarks Returns empty array on error to prevent app crashes.
   *          Errors are logged with storage key context for debugging.
   *          Timestamps are normalized from ISO strings to Date objects (shallow normalization only).
   */
  async getChores(): Promise<Chore[]> {
    const envelope = await readEntityEnvelope(GUEST_CHORES_KEY, validateChore);
    return envelope.data;
  },

  /**
   * Saves guest chores to AsyncStorage.
   * @param chores - Array of Chore objects to save
   * @throws Error if storage operation fails or chores are invalid
   * @remarks Timestamps are serialized from Date objects to ISO strings (shallow serialization only).
   *          deletedAt is omitted (not null) for active records.
   */
  async saveChores(chores: Chore[]): Promise<void> {
    await writeEntityEnvelope(GUEST_CHORES_KEY, chores, validateChore);
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
