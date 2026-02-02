/**
 * Cache-Aware Recipe Repository
 * 
 * Wraps RemoteRecipeService with cache-first read strategies and write-through caching.
 * Provides immediate cache returns for reads and background refresh for stale data.
 */

import type { Recipe } from '../../mocks/recipes';
import type { IRecipeService } from '../../features/recipes/services/recipeService';
import type { ICacheAwareRepository } from './baseCacheAwareRepository';
import { EntityTimestamps } from '../types/entityMetadata';
import { 
  getCached, 
  invalidateCache,
  readCachedEntitiesForUpdate,
  addEntityToCache,
  updateEntityInCache,
  setCached
} from './cacheAwareRepository';
import { getIsOnline } from '../utils/networkStatus';
import { api } from '../../services/api';
import { normalizeTimestampsFromApi } from '../utils/timestamps';
import { cacheEvents } from '../utils/cacheEvents';
import { NetworkError } from '../../services/api';
import { syncQueueStorage, type SyncOp, type QueueTargetId } from '../utils/syncQueueStorage';
import * as Crypto from 'expo-crypto';
import { withCreatedAt, withUpdatedAt, markDeleted } from '../utils/timestamps';

/**
 * DTO type for API responses (matches RemoteRecipeService)
 */
type RecipeApiResponse = {
  id: string;
  localId?: string;
  name: string;
  cookTime?: string;
  category?: string;
  ingredients?: string[];
  instructions?: string[];
  prepTime?: string;
  imageUrl?: string;
  description?: string;
  calories?: number;
  servings?: number;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
};

/**
 * Cache-aware repository for recipes
 * 
 * Implements cache-first read strategy with background refresh and write-through caching.
 */
export class CacheAwareRecipeRepository implements ICacheAwareRepository<Recipe> {
  private readonly entityType = 'recipes' as const;
  
  constructor(private readonly service: IRecipeService) {}
  
  /**
   * Gets the ID from a recipe entity
   */
  private getId(recipe: Recipe): string {
    return recipe.id;
  }
  
  /**
   * Fetches recipes from API (used by cache layer)
   * 
   * Note: This duplicates the API call logic from RemoteRecipeService.
   * Once services are refactored, this can be extracted to a shared method.
   */
  private async fetchRecipesFromApi(): Promise<Recipe[]> {
    console.log('[fetchRecipesFromApi] Starting fetch from API...');
    try {
      const response = await api.get<RecipeApiResponse[]>('/recipes');
      console.log('[fetchRecipesFromApi] API response received');
      console.log('[fetchRecipesFromApi] Response type:', typeof response, 'isArray:', Array.isArray(response), 'length:', Array.isArray(response) ? response.length : 'N/A');
      console.log('[fetchRecipesFromApi] Raw response:', JSON.stringify(response, null, 2));
      
      // Normalize timestamps from API response (server is authority)
      const normalized = response.map((item) => normalizeTimestampsFromApi<Recipe>(item));
      console.log('[fetchRecipesFromApi] Successfully normalized', normalized.length, 'recipes');
      console.log('[fetchRecipesFromApi] Normalized recipes:', JSON.stringify(normalized, null, 2));
      return normalized;
    } catch (error) {
      console.error('[fetchRecipesFromApi] Error fetching recipes:', error);
      console.error('[fetchRecipesFromApi] Error details:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  
  /**
   * Cache-first read with background refresh
   * Returns cached data immediately, refreshes in background if stale
   */
  async findAll(): Promise<Recipe[]> {
    return getCached<Recipe>(
      this.entityType,
      () => this.fetchRecipesFromApi(),
      (recipe) => this.getId(recipe),
      getIsOnline(),
      false // Don't force refresh on normal findAll
    );
  }
  
  /**
   * Force refresh from API (bypasses cache)
   * Fetches fresh data from API and updates cache
   */
  async refresh(): Promise<Recipe[]> {
    return getCached<Recipe>(
      this.entityType,
      () => this.fetchRecipesFromApi(),
      (recipe) => this.getId(recipe),
      getIsOnline(),
      true // Force refresh
    );
  }
  
  /**
   * Find single recipe by ID (reads from cache first, fetches from API if details missing)
   * 
   * If recipe is found in cache but missing details (empty ingredients/instructions),
   * fetches full details from API and updates cache.
   * 
   * @param id - Recipe ID to find
   * @returns Recipe if found, null otherwise
   */
  async findById(id: string): Promise<Recipe | null> {
    const recipes = await readCachedEntitiesForUpdate<Recipe>(this.entityType);
    const cached = recipes.find(r => r.id === id || r.localId === id);
    
    if (!cached) {
      return null;
    }
    
    // Check if recipe has full details (ingredients/instructions)
    const hasFullDetails = cached.ingredients && cached.ingredients.length > 0;
    
    if (!hasFullDetails) {
      // Fetch full details from API
      console.log(`[CacheAwareRecipeRepository] Recipe ${id} missing details, fetching from API...`);
      try {
        const fullRecipe = await this.service.getRecipeById(id);
        
        // Validate fetched recipe has an ID
        const fetchedId = this.getId(fullRecipe);
        if (!fetchedId) {
          console.error(`[CacheAwareRecipeRepository] Fetched recipe missing ID, cannot update cache. Recipe data:`, JSON.stringify({ name: fullRecipe?.name, title: (fullRecipe as any)?.title }));
          // Return cached recipe instead of invalid fetched recipe
          return cached;
        }
        
        // Ensure ID matches (in case API returns different ID)
        if (fetchedId !== id && fullRecipe.localId !== id) {
          console.warn(`[CacheAwareRecipeRepository] Fetched recipe ID mismatch: requested=${id}, fetched=${fetchedId}, preserving requested ID`);
          // Preserve the original ID to ensure cache update works
          const recipeWithCorrectId = { ...fullRecipe, id } as Recipe;
          await updateEntityInCache(
            this.entityType,
            recipeWithCorrectId,
            (r) => this.getId(r),
            (r) => r.id === id || r.localId === id
          );
        } else {
          // Update cache with full details
          await updateEntityInCache(
            this.entityType,
            fullRecipe,
            (r) => this.getId(r),
            (r) => r.id === id || r.localId === id
          );
        }
        
        cacheEvents.emitCacheChange(this.entityType);
        return fullRecipe;
      } catch (error) {
        console.error(`[CacheAwareRecipeRepository] Failed to fetch full recipe details:`, error);
        // Return cached recipe even if it's missing details
        return cached;
      }
    }
    
    return cached;
  }
  
  /**
   * Creates an optimistic recipe entity with localId for offline operations.
   * 
   * Generates a temporary UUID as localId and sets initial timestamps.
   * The entity will be updated with server-assigned ID after successful sync.
   * 
   * @param data - Partial recipe data from user input
   * @returns Complete Recipe entity with generated localId and timestamps
   */
  private createOptimisticRecipe(data: Partial<Recipe>): Recipe {
    const localId = Crypto.randomUUID();
    const now = new Date().toISOString();
    
    return withCreatedAt({
      id: localId, // Use localId as id initially (will be replaced by server id after sync)
      localId: localId,
      name: data.name ?? '',
      cookTime: data.cookTime ?? '',
      prepTime: data.prepTime,
      category: data.category ?? '',
      imageUrl: data.imageUrl,
      description: data.description,
      calories: data.calories,
      servings: data.servings,
      ingredients: data.ingredients ?? [],
      instructions: data.instructions ?? [],
      createdAt: now,
      updatedAt: now,
    } as Recipe);
  }

  /**
   * Ensures localId exists on entity (for updates of existing entities)
   */
  private ensureLocalId(recipe: Recipe): Recipe {
    if (!recipe.localId) {
      // Entity from server may not have localId, use id as localId
      return { ...recipe, localId: recipe.id };
    }
    return recipe;
  }

  /**
   * Helper method for enqueueing writes to the sync queue.
   * 
   * Extracts localId and serverId from the entity and enqueues the write
   * operation for later sync when network is available.
   * 
   * @param op - Sync operation type (create, update, delete)
   * @param entity - Recipe entity to enqueue
   */
  private async enqueueWrite(
    op: SyncOp,
    entity: Recipe
  ): Promise<void> {
    const localId = entity.localId ?? entity.id;
    const serverId = entity.id !== localId ? entity.id : undefined;
    
    await syncQueueStorage.enqueue(
      this.entityType,
      op,
      { localId, serverId },
      entity // Full entity payload
    );
  }

  /**
   * Creates a recipe with write-through caching and offline queueing
   * 
   * Critical Write Ordering Rule (Non-negotiable):
   * UI action → Update cache immediately → Emit cache event → Handle sync (enqueue if offline, call service if online)
   * 
   * The cache must be updated BEFORE any network operations or queueing.
   * This ensures UI updates instantly regardless of network status.
   * 
   * @param recipe - Partial recipe data to create
   * @returns The created recipe (optimistic if offline, server response if online)
   * @throws {Error} If service call fails (when online)
   */
  async create(recipe: Partial<Recipe>): Promise<Recipe> {
    console.log('[CacheAwareRecipeRepository] create() called with recipe:', JSON.stringify(recipe, null, 2));
    
    // Step 1: Create optimistic entity (always, for consistent behavior)
    const optimisticEntity = this.createOptimisticRecipe(recipe);
    console.log('[CacheAwareRecipeRepository] Created optimistic entity:', JSON.stringify(optimisticEntity, null, 2));
    
    // Step 2: Update cache immediately (write-through) - ALWAYS FIRST
    console.log('[CacheAwareRecipeRepository] Adding optimistic entity to cache...');
    await addEntityToCache(
      this.entityType,
      optimisticEntity,
      (r) => this.getId(r)
    );
    console.log('[CacheAwareRecipeRepository] Optimistic entity added to cache');
    
    // Step 3: Emit cache event (UI updates instantly) - ALWAYS SECOND
    cacheEvents.emitCacheChange(this.entityType);
    
    // Step 4: Handle sync (online vs offline) - AFTER cache update
    const isOnline = getIsOnline();
    console.log('[CacheAwareRecipeRepository] Network status:', isOnline ? 'online' : 'offline');
    
    if (isOnline) {
      // Online: Call service, update cache with server response
      try {
        console.log('[CacheAwareRecipeRepository] Calling service.createRecipe()...');
        const created = await this.service.createRecipe(recipe);
        console.log('[CacheAwareRecipeRepository] Service returned created recipe:', JSON.stringify(created, null, 2));
        
        // Replace optimistic entity with server response (matched by localId)
        console.log('[CacheAwareRecipeRepository] Replacing optimistic entity with server response...');
        await updateEntityInCache(
          this.entityType,
          created,
          (r) => this.getId(r),
          (r) => r.localId === optimisticEntity.localId || r.id === optimisticEntity.id
        );
        console.log('[CacheAwareRecipeRepository] Cache updated with server response, optimistic entity replaced');
        cacheEvents.emitCacheChange(this.entityType);
        return created;
      } catch (error) {
        console.error('[CacheAwareRecipeRepository] Error during service.createRecipe():', error);
        // Network error during service call → enqueue for retry
        if (error instanceof NetworkError) {
          console.log('[CacheAwareRecipeRepository] Network error detected, enqueueing for retry...');
          await this.enqueueWrite('create', optimisticEntity);
        }
        throw error;
      }
    } else {
      // Offline: Enqueue write for later sync
      console.log('[CacheAwareRecipeRepository] Offline mode, enqueueing write for later sync...');
      await this.enqueueWrite('create', optimisticEntity);
      return optimisticEntity;
    }
  }
  
  /**
   * Updates a recipe with write-through caching and offline queueing
   * 
   * Critical Write Ordering Rule (Non-negotiable):
   * UI action → Update cache immediately → Emit cache event → Handle sync (enqueue if offline, call service if online)
   * 
   * @param id - Recipe ID to update
   * @param updates - Partial recipe data to update
   * @returns The updated recipe (optimistic if offline, server response if online)
   * @throws {Error} If service call fails (when online)
   */
  async update(id: string, updates: Partial<Recipe>): Promise<Recipe> {
    // Step 1: Read current cache to get existing entity
    const current = await readCachedEntitiesForUpdate<Recipe>(this.entityType);
    const existing = current.find(r => r.id === id || r.localId === id);
    
    if (!existing) {
      throw new Error(`Recipe with id ${id} not found in cache`);
    }
    
    // Step 2: Create optimistic updated entity
    const optimisticEntity = this.ensureLocalId(withUpdatedAt({
      ...existing,
      ...updates,
    } as Recipe));
    
    // Step 3: Update cache immediately (write-through) - ALWAYS FIRST
    await updateEntityInCache(
      this.entityType,
      optimisticEntity,
      (r) => this.getId(r),
      (r) => r.id === id || r.localId === id
    );
    
    // Step 4: Emit cache event (UI updates instantly) - ALWAYS SECOND
    cacheEvents.emitCacheChange(this.entityType);
    
    // Step 5: Handle sync (online vs offline) - AFTER cache update
    const isOnline = getIsOnline();
    
    if (isOnline) {
      // Online: Call service, update cache with server response
      try {
        const updated = await this.service.updateRecipe(id, updates);
        // Update cache with server timestamps
        await updateEntityInCache(
          this.entityType,
          updated,
          (r) => this.getId(r),
          (r) => r.id === id || r.localId === id
        );
        cacheEvents.emitCacheChange(this.entityType);
        return updated;
      } catch (error) {
        // Network error during service call → enqueue for retry
        if (error instanceof NetworkError) {
          await this.enqueueWrite('update', optimisticEntity);
        }
        throw error;
      }
    } else {
      // Offline: Enqueue write for later sync
      await this.enqueueWrite('update', optimisticEntity);
      return optimisticEntity;
    }
  }
  
  /**
   * Deletes a recipe (soft-delete) with write-through caching and offline queueing
   * 
   * Critical Write Ordering Rule (Non-negotiable):
   * UI action → Update cache immediately → Emit cache event → Handle sync (enqueue if offline, call service if online)
   * 
   * @param id - Recipe ID to delete
   * @throws {Error} If service call fails (when online)
   */
  async delete(id: string): Promise<void> {
    // Step 1: Read current cache to get existing entity
    const current = await readCachedEntitiesForUpdate<Recipe>(this.entityType);
    const existing = current.find(r => r.id === id || r.localId === id);
    
    if (!existing) {
      // Entity not found, nothing to delete
      return;
    }
    
    // Step 2: Create optimistic deleted entity
    const optimisticEntity = this.ensureLocalId(markDeleted(existing));
    
    // Step 3: Update cache immediately (write-through) - ALWAYS FIRST
    await updateEntityInCache(
      this.entityType,
      optimisticEntity,
      (r) => this.getId(r),
      (r) => r.id === id || r.localId === id
    );
    
    // Step 4: Emit cache event (UI updates instantly) - ALWAYS SECOND
    cacheEvents.emitCacheChange(this.entityType);
    
    // Step 5: Handle sync (online vs offline) - AFTER cache update
    const isOnline = getIsOnline();
    
    if (isOnline) {
      // Online: Call service, update cache with server response
      try {
        await this.service.deleteRecipe(id);
        // Cache already updated optimistically, no need to update again
        // Server response confirms deletion
      } catch (error) {
        // Network error during service call → enqueue for retry
        if (error instanceof NetworkError) {
          await this.enqueueWrite('delete', optimisticEntity);
        }
        throw error;
      }
    } else {
      // Offline: Enqueue write for later sync
      await this.enqueueWrite('delete', optimisticEntity);
    }
  }
  
  /**
   * Invalidate cache (force refresh on next read)
   */
  async invalidateCache(): Promise<void> {
    await invalidateCache(this.entityType);
  }
}
