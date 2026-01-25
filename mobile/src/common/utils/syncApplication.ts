import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENTITY_TYPES, getSignedInCacheKey, getModeFromStorageKey } from '../storage/dataModeStorage';
import { EntityTimestamps, toPersistedTimestamps } from '../types/entityMetadata';
import { mergeEntityArrays } from './conflictResolution';
import { updateCacheMetadata } from './cacheMetadata';
import { normalizePersistedArray } from './storageHelpers';

export type SyncEntityType = 'recipes' | 'shoppingLists' | 'chores' | 'shoppingItems';

const entityTypeToStorageKey: Record<SyncEntityType, string> = {
  recipes: ENTITY_TYPES.recipes,
  shoppingLists: ENTITY_TYPES.shoppingLists,
  shoppingItems: ENTITY_TYPES.shoppingItems,
  chores: ENTITY_TYPES.chores,
};

/**
 * Applies remote updates to local state for a single entity type.
 * 
 * Uses merge utilities to resolve conflicts using LWW + tombstone rules.
 * Merges remote entities with local cached entities and persists the result.
 * 
 * This function should be called in the sync pipeline/repository layer,
 * NOT inside Remote*Service methods (to keep services focused on transport).
 * 
 * @param entityType - Type of entity to sync ('recipes' | 'shoppingLists' | 'chores' | 'shoppingItems')
 * @param remoteEntities - Array of remote entities to merge with local state
 * @param getId - Function to extract entity ID for matching entities
 * @returns Promise that resolves when merge and persistence are complete
 * @throws Error if storage operations fail (errors are logged but not swallowed)
 * 
 * @example
 * ```typescript
 * const remoteRecipes = await recipeService.getRecipes();
 * await applyRemoteUpdatesToLocal('recipes', remoteRecipes, (r) => r.id);
 * ```
 */
export async function applyRemoteUpdatesToLocal<T extends EntityTimestamps>(
  entityType: SyncEntityType,
  remoteEntities: T[],
  getId: (entity: T) => string
): Promise<void> {
  const storageEntity = entityTypeToStorageKey[entityType];
  const storageKey = getSignedInCacheKey(storageEntity);

  // Defense-in-depth: Validate storage key implies signed-in mode
  // If storage key is not signed-in, this is a programming error
  const keyMode = getModeFromStorageKey(storageKey);
  if (keyMode !== 'signed-in') {
    const modeDescription = keyMode ?? 'unknown';
    throw new Error(
      `applyRemoteUpdatesToLocal() called with ${modeDescription} storage key. This function requires signed-in cache keys. Guest data is local-only and never synced remotely.`
    );
  }

  try {
    const cached = await AsyncStorage.getItem(storageKey);
    const localEntities = normalizePersistedArray<T>(cached, storageKey);
    const merged = mergeEntityArrays(localEntities, remoteEntities, getId);
    const serialized = merged.map(toPersistedTimestamps);

    await AsyncStorage.setItem(storageKey, JSON.stringify(serialized));
    
    // Update cache metadata after successful sync
    await updateCacheMetadata(entityType, new Date().toISOString());
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Failed applying remote updates for ${entityType}:`, errorMessage);
    // Re-throw to allow callers to handle errors appropriately
    throw new Error(`Failed to sync ${entityType}: ${errorMessage}`, { cause: error });
  }
}
