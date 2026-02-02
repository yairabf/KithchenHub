import { Recipe, mockRecipes } from '../../../mocks/recipes';
import { api } from '../../../services/api';
import { guestStorage } from '../../../common/utils/guestStorage';
import type { DataMode } from '../../../common/types/dataModes';
import { validateServiceCompatibility } from '../../../common/validation/dataModeValidation';
import { withUpdatedAt, markDeleted, withCreatedAtAndUpdatedAt, toSupabaseTimestamps, normalizeTimestampsFromApi } from '../../../common/utils/timestamps';
import { isDevMode } from '../../../common/utils/devMode';
import { getCached, setCached, readCachedEntitiesForUpdate } from '../../../common/repositories/cacheAwareRepository';
import { EntityTimestamps } from '../../../common/types/entityMetadata';
import { getIsOnline } from '../../../common/utils/networkStatus';

/**
 * DTO types for API responses
 */
/**
 * Backend RecipeDetailDto format (what POST /recipes returns)
 */
type RecipeDetailDto = {
  id: string;
  title: string;
  prepTime?: number;
  ingredients: Array<{ name: string; quantity?: number; unit?: string }>;
  instructions: Array<{ step: number; instruction: string }>;
  imageUrl?: string;
};

/**
 * Backend RecipeListItemDto format (what GET /recipes returns)
 */
type RecipeListItemDto = {
  id: string;
  title: string;
  imageUrl?: string;
};

/**
 * Legacy RecipeApiResponse type (kept for backward compatibility)
 * Maps to frontend Recipe format
 */
type RecipeApiResponse = {
  id: string;
  localId?: string;
  name: string;
  cookTime?: string;
  category?: string;
  ingredients?: any[];
  instructions?: any[];
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
 * Maps backend RecipeDetailDto to frontend Recipe format
 */
function mapDetailDtoToRecipe(dto: RecipeDetailDto): RecipeApiResponse {
  // Map ingredients: backend RecipeIngredientDto[] -> frontend Ingredient[]
  const ingredients = dto.ingredients.map((ing, index) => ({
    id: `ing-${index}`,
    quantity: ing.quantity?.toString() || '',
    unit: ing.unit || '',
    name: ing.name,
  }));

  // Map instructions: backend RecipeInstructionDto[] -> frontend Instruction[]
  const instructions = dto.instructions.map((inst, index) => ({
    id: `inst-${index}`,
    text: inst.instruction,
  }));

  return {
    id: dto.id,
    name: dto.title || 'Untitled Recipe',
    prepTime: dto.prepTime ? `${dto.prepTime} min` : undefined,
    cookTime: dto.prepTime ? `${dto.prepTime} min` : 'N/A', // Default value
    category: 'Dinner', // Default value since Recipe interface requires category: string
    ingredients: ingredients,
    instructions: instructions,
    imageUrl: dto.imageUrl,
    createdAt: undefined,
    updatedAt: undefined,
  };
}

export interface IRecipeService {
    getRecipes(): Promise<Recipe[]>;
    getRecipeById(recipeId: string): Promise<Recipe>;
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
            // Ensure all mock recipes have createdAt and updatedAt timestamps
            // withCreatedAtAndUpdatedAt() is safe - it won't overwrite existing timestamps
            const seededRecipes = mockRecipes.map(recipe => 
                withCreatedAtAndUpdatedAt(recipe)
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
    async getRecipeById(recipeId: string): Promise<Recipe> {
        const guestRecipes = await guestStorage.getRecipes();
        const recipe = guestRecipes.find(r => r.id === recipeId || r.localId === recipeId);
        if (!recipe) {
            throw new Error(`Recipe not found: ${recipeId}`);
        }
        return recipe;
    }

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

        // Business rule: auto-populate createdAt and updatedAt on creation
        const withTimestamps = withCreatedAtAndUpdatedAt(newRecipe);

        // Persist to guest storage with retry logic for concurrent writes
        let retries = MAX_RETRIES;
        while (retries > 0) {
            try {
                const existingRecipes = await guestStorage.getRecipes();
                await guestStorage.saveRecipes([...existingRecipes, withTimestamps]);
                return withTimestamps;
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
    /**
     * Fetches recipes from API (used by cache layer)
     * 
     * @returns Array of recipes with normalized timestamps
     */
    private async fetchRecipesFromApi(): Promise<Recipe[]> {
        // Backend returns RecipeListItemDto[] for GET /recipes (only id, title, imageUrl)
        const response = await api.get<RecipeListItemDto[]>('/recipes');
        console.log('[RemoteRecipeService] fetchRecipesFromApi - received', response.length, 'recipes');
        console.log('[RemoteRecipeService] fetchRecipesFromApi - response:', JSON.stringify(response, null, 2));
        
        // Map list items to Recipe format (ingredients/instructions will be empty arrays)
        // Full details would require fetching each recipe individually via GET /recipes/:id
        const mapped = response.map((item) => {
          const recipe = {
            id: item.id,
            name: item.title || 'Untitled Recipe',
            imageUrl: item.imageUrl,
            ingredients: [],
            instructions: [],
            cookTime: 'N/A', // Default value since Recipe interface requires cookTime: string
            category: 'Dinner', // Default value since Recipe interface requires category: string
          };
          console.log('[RemoteRecipeService] Mapped recipe item:', JSON.stringify({ id: recipe.id, name: recipe.name, title: item.title }, null, 2));
          return recipe;
        });
        
        console.log('[RemoteRecipeService] fetchRecipesFromApi - mapped recipes:', JSON.stringify(mapped, null, 2));
        
        // Normalize timestamps from API response (server is authority)
        // Ensure ingredients and instructions are always arrays
        return mapped.map((item) => {
          const normalized = normalizeTimestampsFromApi<Recipe>(item as any);
          console.log('[RemoteRecipeService] After normalization:', JSON.stringify({ id: normalized.id, name: normalized.name, title: (normalized as any).title }, null, 2));
          
          // Preserve name field explicitly (it might be lost during normalization)
          const recipeName = item.name || normalized.name || (normalized as any).title || 'Untitled Recipe';
          const finalRecipe = {
            ...normalized,
            name: recipeName, // Explicitly set name to ensure it's preserved
            ingredients: normalized.ingredients || [],
            instructions: normalized.instructions || [],
            cookTime: normalized.cookTime || item.cookTime || 'N/A',
            category: normalized.category || item.category || 'Dinner',
          };
          console.log('[RemoteRecipeService] Final recipe:', JSON.stringify({ id: finalRecipe.id, name: finalRecipe.name }, null, 2));
          return finalRecipe;
        });
    }

    async getRecipeById(recipeId: string): Promise<Recipe> {
        console.log('[RemoteRecipeService] getRecipeById() called with recipeId:', recipeId);
        
        // First check cache using proper cache-aware read (handles versioned format)
        const cached = await readCachedEntitiesForUpdate<Recipe>('recipes');
        const cachedRecipe = cached.find(r => r.id === recipeId);
        
        // If cached recipe has full details (ingredients/instructions), return it
        if (cachedRecipe && cachedRecipe.ingredients && cachedRecipe.ingredients.length > 0) {
            console.log('[RemoteRecipeService] Found recipe in cache with full details');
            return cachedRecipe;
        }
        
        // Otherwise fetch from API
        console.log('[RemoteRecipeService] Fetching full recipe details from API...');
        const response = await api.get<RecipeDetailDto>(`/recipes/${recipeId}`);
        console.log('[RemoteRecipeService] API response:', JSON.stringify(response, null, 2));
        
        // Map backend RecipeDetailDto to frontend Recipe format
        const mappedResponse = mapDetailDtoToRecipe(response);
        console.log('[RemoteRecipeService] Mapped response:', JSON.stringify(mappedResponse, null, 2));
        
        // Normalize timestamps
        const normalized = normalizeTimestampsFromApi<Recipe>(mappedResponse);
        const recipeName = mappedResponse.name || normalized.name || 'Untitled Recipe';
        const fullRecipe = {
            ...normalized,
            name: recipeName,
            ingredients: normalized.ingredients || [],
            instructions: normalized.instructions || [],
            cookTime: normalized.cookTime || mappedResponse.cookTime || 'N/A',
            category: normalized.category || mappedResponse.category || 'Dinner',
        };
        
        // Update cache with full details
        if (cachedRecipe) {
            // Replace the cached recipe with full details
            const updatedCache = cached.map(r => r.id === recipeId ? fullRecipe : r);
            await setCached('recipes', updatedCache, (r) => r.id);
        } else {
            // Add to cache if not found
            await setCached('recipes', [...cached, fullRecipe], (r) => r.id);
        }
        
        console.log('[RemoteRecipeService] Recipe details fetched and cached');
        return fullRecipe;
    }

    async getRecipes(): Promise<Recipe[]> {
        // Use cache-first strategy with background refresh
        return getCached<Recipe>(
            'recipes',
            () => this.fetchRecipesFromApi(),
            (recipe) => recipe.id,
            getIsOnline()
        );
    }

    /**
     * Maps frontend Recipe to backend CreateRecipeDto format
     */
    private mapRecipeToCreateDto(recipe: Partial<Recipe>): {
        title: string;
        prepTime?: number;
        ingredients: Array<{ name: string; quantity?: number; unit?: string }>;
        instructions: Array<{ step: number; instruction: string }>;
        imageUrl?: string;
    } {
        // Map ingredients: frontend Ingredient[] -> backend IngredientInputDto[]
        const ingredients = (recipe.ingredients || []).map((ing, index) => ({
            name: ing.name,
            quantity: ing.quantity ? parseFloat(ing.quantity) : undefined,
            unit: ing.unit || undefined,
        }));

        // Map instructions: frontend Instruction[] -> backend InstructionInputDto[]
        const instructions = (recipe.instructions || []).map((inst, index) => ({
            step: index + 1,
            instruction: inst.text,
        }));

        // Parse prepTime from string (e.g., "10 min") to number (minutes)
        let prepTime: number | undefined;
        if (recipe.prepTime) {
            const match = recipe.prepTime.match(/(\d+)/);
            prepTime = match ? parseInt(match[1], 10) : undefined;
        }

        return {
            title: recipe.name || 'Untitled Recipe',
            prepTime,
            ingredients,
            instructions,
            imageUrl: recipe.imageUrl,
        };
    }

    async createRecipe(recipe: Partial<Recipe>): Promise<Recipe> {
        console.log('[RemoteRecipeService] createRecipe() called with recipe:', JSON.stringify(recipe, null, 2));
        
        // Map frontend Recipe format to backend CreateRecipeDto format
        const dto = this.mapRecipeToCreateDto(recipe);
        console.log('[RemoteRecipeService] Mapped to CreateRecipeDto:', JSON.stringify(dto, null, 2));
        
        console.log('[RemoteRecipeService] Making POST request to /recipes...');
        const response = await api.post<RecipeDetailDto>('/recipes', dto);
        console.log('[RemoteRecipeService] API response received:', JSON.stringify(response, null, 2));
        
        // Map backend RecipeDetailDto to frontend Recipe format
        const mappedResponse = mapDetailDtoToRecipe(response);
        console.log('[RemoteRecipeService] Mapped response to Recipe format:', JSON.stringify(mappedResponse, null, 2));
        
        // Server is authority: overwrite with server timestamps
        const normalized = normalizeTimestampsFromApi<Recipe>(mappedResponse);
        // Ensure ingredients and instructions are always arrays
        // Preserve name field explicitly (it might be lost during normalization)
        const recipeName = mappedResponse.name || normalized.name || 'Untitled Recipe';
        const created = {
          ...normalized,
          name: recipeName, // Explicitly set name to ensure it's preserved
          ingredients: normalized.ingredients || [],
          instructions: normalized.instructions || [],
          cookTime: normalized.cookTime || mappedResponse.cookTime || 'N/A',
          category: normalized.category || mappedResponse.category || 'Dinner',
        };
        console.log('[RemoteRecipeService] Normalized recipe:', JSON.stringify(created, null, 2));
        
        // Note: Cache update is handled by CacheAwareRecipeRepository
        // This service should not update cache directly to avoid duplicates
        // The repository will replace the optimistic entity with the server response
        console.log('[RemoteRecipeService] Cache update will be handled by repository');
        
        return created;
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
        const updatedRecipe = normalizeTimestampsFromApi<Recipe>(response);
        
        // Write-through cache update: read cache directly (no network fetch)
        // Note: Cache updates are best-effort; failures are logged but don't throw
        const current = await readCachedEntitiesForUpdate<Recipe>('recipes');
        const updatedCache = current.map(r => r.id === recipeId ? updatedRecipe : r);
        await setCached('recipes', updatedCache, (r) => r.id);
        
        return updatedRecipe;
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
        
        // Write-through cache update: read cache directly (no network fetch)
        // Note: Cache updates are best-effort; failures are logged but don't throw
        const current = await readCachedEntitiesForUpdate<Recipe>('recipes');
        const updatedCache = current.map(r => r.id === recipeId ? withTimestamps : r);
        await setCached('recipes', updatedCache, (r) => r.id);
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
