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
  updateEntityInCache
} from './cacheAwareRepository';
import { getIsOnline } from '../utils/networkStatus';
import { api } from '../../services/api';
import { normalizeTimestampsFromApi } from '../utils/timestamps';

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
    const response = await api.get<RecipeApiResponse[]>('/recipes');
    // Normalize timestamps from API response (server is authority)
    return response.map((item) => normalizeTimestampsFromApi<Recipe>(item));
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
      getIsOnline()
    );
  }
  
  /**
   * Find single recipe by ID (reads directly from cache, no network fetch)
   * 
   * Optimized to read directly from cache without triggering findAll(),
   * which may cause unnecessary network requests.
   * 
   * @param id - Recipe ID to find
   * @returns Recipe if found, null otherwise
   */
  async findById(id: string): Promise<Recipe | null> {
    const recipes = await readCachedEntitiesForUpdate<Recipe>(this.entityType);
    return recipes.find(r => r.id === id || r.localId === id) ?? null;
  }
  
  /**
   * Creates a recipe with write-through caching
   * 
   * Implements write-through caching:
   * 1. Creates recipe on server via service
   * 2. Reads current cache
   * 3. Adds created recipe to cache
   * 4. Emits cache change event to trigger UI updates
   * 
   * If cache update fails, the error is logged but the operation
   * still succeeds (server write completed). Cache is invalidated
   * to force refresh on next read.
   * 
   * @param recipe - Partial recipe data to create
   * @returns The created recipe with server timestamps
   * @throws {Error} If service call fails
   */
  async create(recipe: Partial<Recipe>): Promise<Recipe> {
    // 1. Call service to create on server
    const created = await this.service.createRecipe(recipe);
    
    // 2. Update cache (with error handling)
    await addEntityToCache(
      this.entityType,
      created,
      (r) => this.getId(r)
    );
    
    return created;
  }
  
  /**
   * Updates a recipe with write-through caching
   * 
   * Implements write-through caching:
   * 1. Updates recipe on server via service
   * 2. Reads current cache
   * 3. Updates recipe in cache
   * 4. Emits cache change event to trigger UI updates
   * 
   * If cache update fails, the error is logged but the operation
   * still succeeds (server write completed). Cache is invalidated
   * to force refresh on next read.
   * 
   * @param id - Recipe ID to update
   * @param updates - Partial recipe data to update
   * @returns The updated recipe with server timestamps
   * @throws {Error} If service call fails
   */
  async update(id: string, updates: Partial<Recipe>): Promise<Recipe> {
    // 1. Call service to update on server
    const updated = await this.service.updateRecipe(id, updates);
    
    // 2. Update cache (with error handling)
    await updateEntityInCache(
      this.entityType,
      updated,
      (r) => this.getId(r),
      (r) => r.id === id || r.localId === id
    );
    
    return updated;
  }
  
  /**
   * Deletes a recipe (soft-delete) with write-through caching
   * 
   * Implements write-through caching:
   * 1. Deletes recipe on server via service (soft-delete)
   * 2. Reads current cache
   * 3. Marks recipe as deleted in cache
   * 4. Emits cache change event to trigger UI updates
   * 
   * If cache update fails, the error is logged but the operation
   * still succeeds (server write completed). Cache is invalidated
   * to force refresh on next read.
   * 
   * @param id - Recipe ID to delete
   * @throws {Error} If service call fails
   */
  async delete(id: string): Promise<void> {
    // 1. Call service to delete on server
    await this.service.deleteRecipe(id);
    
    // 2. Read current cache and mark as deleted
    try {
      const current = await readCachedEntitiesForUpdate<Recipe>(this.entityType);
      const recipe = current.find(r => r.id === id || r.localId === id);
      if (recipe) {
        const deleted = { ...recipe, deletedAt: new Date().toISOString() };
        await updateEntityInCache(
          this.entityType,
          deleted,
          (r) => this.getId(r),
          (r) => r.id === id || r.localId === id
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to update cache after delete for ${this.entityType}:`, errorMessage);
      // Don't throw - server operation succeeded
      try {
        await invalidateCache(this.entityType);
      } catch (invalidateError) {
        // Ignore invalidation errors
        console.error(`Failed to invalidate cache after delete error:`, invalidateError);
      }
    }
  }
  
  /**
   * Invalidate cache (force refresh on next read)
   */
  async invalidateCache(): Promise<void> {
    await invalidateCache(this.entityType);
  }
}
