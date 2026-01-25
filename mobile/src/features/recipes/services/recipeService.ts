import { Recipe, mockRecipes } from '../../../mocks/recipes';
import { api } from '../../../services/api';
import { guestStorage } from '../../../common/utils/guestStorage';
import type { DataMode } from '../../../common/types/dataModes';
import { validateServiceCompatibility } from '../../../common/validation/dataModeValidation';
import { withUpdatedAt, markDeleted, withCreatedAt, toSupabaseTimestamps, normalizeTimestampsFromApi } from '../../../common/utils/timestamps';
import { isDevMode } from '../../../common/utils/devMode';

/**
 * DTO types for API responses
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

export interface IRecipeService {
    getRecipes(): Promise<Recipe[]>;
    createRecipe(recipe: Partial<Recipe>): Promise<Recipe>;
    updateRecipe(recipeId: string, updates: Partial<Recipe>): Promise<Recipe>;
    deleteRecipe(recipeId: string): Promise<void>;
}

// Constants for retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 10; // Brief delay to allow concurrent writes to complete

/**
 * Builds a new recipe object with validated required fields and defaults
 * 
 * @param recipe - Partial recipe data to build from
 * @returns A complete Recipe object with all required fields
 */
function buildRecipeWithDefaults(recipe: Partial<Recipe>): Recipe {
  const defaultName = 'New Recipe';
  const defaultLocalId = `local-uuid-${Date.now()}`;
  
  // Extract and validate name (handle empty/whitespace strings)
  const recipeName = (recipe.name && recipe.name.trim()) ? recipe.name : defaultName;
  const recipeLocalId = recipe.localId || defaultLocalId;
  
  return {
    id: `local-${Date.now()}`,
    localId: recipeLocalId,
    name: recipeName,
    cookTime: recipe.cookTime || '0 min',
    category: recipe.category || 'Dinner',
    ingredients: recipe.ingredients || [],
    instructions: recipe.instructions || [],
    prepTime: recipe.prepTime,
    imageUrl: recipe.imageUrl,
    description: recipe.description,
    calories: recipe.calories,
    servings: recipe.servings,
  } as Recipe;
}

export class LocalRecipeService implements IRecipeService {
    /**
     * Seeds mock recipes into storage when empty (dev-only).
     * 
     * This method checks if the app is in development mode and if storage is truly empty
     * (no records at all, including soft-deleted). If both conditions are met, it seeds
     * mock recipes with proper timestamps and saves them to storage.
     * 
     * Note: guestStorage.getRecipes() returns ALL recipes including soft-deleted ones.
     * So recipes.length === 0 means storage is truly empty (no records at all).
     * 
     * @param existingRecipes - Current recipes from storage
     * @returns Seeded recipes if seeding occurred, null otherwise
     * @throws {Error} If seeding fails with a descriptive error message
     * @private
     */
    private async seedRecipesIfEmpty(existingRecipes: Recipe[]): Promise<Recipe[] | null> {
        // Only seed in dev mode when storage is truly empty
        const shouldSeed = isDevMode() && existingRecipes.length === 0;
        if (!shouldSeed) {
            return null;
        }

        try {
            // Ensure all mock recipes have createdAt timestamps
            // withCreatedAt() is safe - it won't overwrite existing timestamps
            const seededRecipes = mockRecipes.map(recipe => 
                withCreatedAt(recipe)
            );
            
            // Save seeded recipes to storage
            await guestStorage.saveRecipes(seededRecipes);
            
            return seededRecipes;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to seed mock recipes in dev mode: ${errorMessage}`);
        }
    }

    /**
     * Retrieves all recipes from guest storage.
     * 
     * In development mode, automatically seeds mock recipes if storage is empty.
     * This seeding only occurs when storage is truly empty (no records, including soft-deleted).
     * 
     * @returns Promise resolving to array of recipes
     * @throws {Error} If storage read fails or seeding fails in dev mode
     */
    async getRecipes(): Promise<Recipe[]> {
        const guestRecipes = await guestStorage.getRecipes();
        const seededRecipes = await this.seedRecipesIfEmpty(guestRecipes);
        return seededRecipes ?? guestRecipes;
    }

    async createRecipe(recipe: Partial<Recipe>): Promise<Recipe> {
        const newRecipe = buildRecipeWithDefaults(recipe);

        // Validate recipe has required fields before saving
        if (!newRecipe.localId || !newRecipe.name || !newRecipe.name.trim()) {
            throw new Error('Invalid recipe data: missing required fields (localId, name)');
        }

        // Persist to guest storage with retry logic for concurrent writes
        let retries = MAX_RETRIES;
        while (retries > 0) {
            try {
                const existingRecipes = await guestStorage.getRecipes();
                await guestStorage.saveRecipes([...existingRecipes, newRecipe]);
                return newRecipe;
            } catch (error) {
                retries--;
                if (retries === 0) {
                    throw new Error(`Failed to create recipe after ${MAX_RETRIES} retries: ${error instanceof Error ? error.message : String(error)}`);
                }
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
        }
        
        // This should never be reached, but TypeScript needs it
        throw new Error('Failed to create recipe: unexpected error');
    }

    async updateRecipe(recipeId: string, updates: Partial<Recipe>): Promise<Recipe> {
        // Validate updates don't remove required fields
        if (updates.localId === null || updates.name === null) {
            throw new Error('Invalid recipe update: cannot remove required fields (localId, name)');
        }

        // Update with retry logic for concurrent writes
        let retries = MAX_RETRIES;
        while (retries > 0) {
            try {
                const existingRecipes = await guestStorage.getRecipes();
                const recipeIndex = existingRecipes.findIndex(r => r.id === recipeId || r.localId === recipeId);
                
                if (recipeIndex === -1) {
                    throw new Error(`Recipe not found: ${recipeId}`);
                }

                const updatedRecipe = {
                    ...existingRecipes[recipeIndex],
                    ...updates,
                } as Recipe;

                // Validate updated recipe still has required fields
                if (!updatedRecipe.localId || !updatedRecipe.name) {
                    throw new Error('Invalid recipe update: missing required fields after update');
                }

                // Business rule: always update updatedAt on modification
                const withTimestamps = withUpdatedAt(updatedRecipe);

                const updatedRecipes = [...existingRecipes];
                updatedRecipes[recipeIndex] = withTimestamps;
                await guestStorage.saveRecipes(updatedRecipes);

                return withTimestamps;
            } catch (error) {
                // Don't retry if it's a validation error or not found error
                if (error instanceof Error && (error.message.includes('not found') || error.message.includes('Invalid'))) {
                    throw error;
                }
                
                retries--;
                if (retries === 0) {
                    throw new Error(`Failed to update recipe after ${MAX_RETRIES} retries: ${error instanceof Error ? error.message : String(error)}`);
                }
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
        }
        
        // This should never be reached, but TypeScript needs it
        throw new Error('Failed to update recipe: unexpected error');
    }

    async deleteRecipe(recipeId: string): Promise<void> {
        // Business rule: soft-delete (tombstone pattern)
        let retries = MAX_RETRIES;
        while (retries > 0) {
            try {
                const existingRecipes = await guestStorage.getRecipes();
                const recipeIndex = existingRecipes.findIndex(r => r.id === recipeId || r.localId === recipeId);
                
                if (recipeIndex === -1) {
                    throw new Error(`Recipe not found: ${recipeId}`);
                }

                // Business rule: mark as deleted, preserve tombstone
                const deletedRecipe = markDeleted(existingRecipes[recipeIndex]);
                // Also update updatedAt on delete
                const withTimestamps = withUpdatedAt(deletedRecipe);
                
                const updatedRecipes = [...existingRecipes];
                updatedRecipes[recipeIndex] = withTimestamps;
                await guestStorage.saveRecipes(updatedRecipes);
                return;
            } catch (error) {
                // Don't retry if it's a validation error or not found error
                if (error instanceof Error && (error.message.includes('not found') || error.message.includes('Invalid'))) {
                    throw error;
                }
                
                retries--;
                if (retries === 0) {
                    throw new Error(`Failed to delete recipe after ${MAX_RETRIES} retries: ${error instanceof Error ? error.message : String(error)}`);
                }
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            }
        }
        
        // This should never be reached, but TypeScript needs it
        throw new Error('Failed to delete recipe: unexpected error');
    }
}

/**
 * Remote recipe service for signed-in users.
 * 
 * This service should only be instantiated for signed-in users.
 * Service factory (createRecipeService) prevents guest mode from creating this service.
 * 
 * Defense-in-depth: All methods make API calls which require authentication.
 * Guest users cannot provide valid JWT tokens, so API calls will fail at the backend.
 */
export class RemoteRecipeService implements IRecipeService {
    async getRecipes(): Promise<Recipe[]> {
        const response = await api.get<RecipeApiResponse[]>('/recipes');
        // Normalize timestamps from API response (server is authority)
        return response.map((item) => normalizeTimestampsFromApi<Recipe>(item));
    }

    async createRecipe(recipe: Partial<Recipe>): Promise<Recipe> {
        // Apply timestamp for optimistic UI and offline queue
        const withTimestamps = withCreatedAt(recipe as Recipe);
        const payload = toSupabaseTimestamps(withTimestamps);
        const response = await api.post<RecipeApiResponse>('/recipes', payload);
        // Server is authority: overwrite with server timestamps
        return normalizeTimestampsFromApi<Recipe>(response);
    }

    async updateRecipe(recipeId: string, updates: Partial<Recipe>): Promise<Recipe> {
        // Get existing recipe first (or merge with updates)
        const existing = await this.getRecipes().then(recipes => 
            recipes.find(r => r.id === recipeId)
        );
        if (!existing) {
            throw new Error(`Recipe not found: ${recipeId}`);
        }
        
        // Apply timestamp for optimistic UI and offline queue
        const updated = { ...existing, ...updates };
        const withTimestamps = withUpdatedAt(updated);
        const payload = toSupabaseTimestamps(withTimestamps);
        const response = await api.put<RecipeApiResponse>(`/recipes/${recipeId}`, payload);
        // Server is authority: overwrite with server timestamps
        return normalizeTimestampsFromApi<Recipe>(response);
    }

    async deleteRecipe(recipeId: string): Promise<void> {
        // Get existing recipe
        const existing = await this.getRecipes().then(recipes => 
            recipes.find(r => r.id === recipeId)
        );
        if (!existing) {
            throw new Error(`Recipe not found: ${recipeId}`);
        }
        
        // Apply timestamp for optimistic UI and offline queue
        const deleted = markDeleted(existing);
        const withTimestamps = withUpdatedAt(deleted);
        const payload = toSupabaseTimestamps(withTimestamps);
        
        // Use PATCH instead of DELETE with body (more compatible)
        await api.patch(`/recipes/${recipeId}`, { deleted_at: payload.deleted_at });
    }
}

/**
 * Creates a recipe service based on the data mode
 * 
 * @param mode - The data mode ('guest' | 'signed-in')
 * @param entityType - The type of entity being accessed (for validation)
 * @returns The appropriate recipe service implementation
 * @throws Error if the mode and service type are incompatible
 * 
 * @remarks
 * Note: Conflict resolution (sync application) should be called in the sync pipeline/repository layer,
 * NOT inside Remote*Service methods. This keeps services focused on transport.
 */
export const createRecipeService = (
  mode: 'guest' | 'signed-in',
  entityType: 'recipes' = 'recipes'
): IRecipeService => {
  // Validate service compatibility
  const serviceType = mode === 'guest' ? 'local' : 'remote';
  validateServiceCompatibility(serviceType, mode);
  
  return mode === 'guest' ? new LocalRecipeService() : new RemoteRecipeService();
};

/**
 * Legacy factory function for backward compatibility
 * @deprecated Use createRecipeService with mode parameter instead
 */
export const createRecipeServiceLegacy = (isMockEnabled: boolean): IRecipeService => {
  const mode = isMockEnabled ? 'guest' : 'signed-in';
  return createRecipeService(mode);
};
