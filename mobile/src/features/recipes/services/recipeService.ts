import { Recipe } from '../../../mocks/recipes';
import { api } from '../../../services/api';
import { guestStorage } from '../../../common/utils/guestStorage';
import type { DataMode } from '../../../common/types/dataModes';
import { validateServiceCompatibility } from '../../../common/validation/dataModeValidation';

export interface IRecipeService {
    getRecipes(): Promise<Recipe[]>;
    createRecipe(recipe: Partial<Recipe>): Promise<Recipe>;
    updateRecipe(recipeId: string, updates: Partial<Recipe>): Promise<Recipe>;
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
    async getRecipes(): Promise<Recipe[]> {
        // Read from real guest storage, return empty array if no data exists
        const guestRecipes = await guestStorage.getRecipes();
        return guestRecipes;
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

                const updatedRecipes = [...existingRecipes];
                updatedRecipes[recipeIndex] = updatedRecipe;
                await guestStorage.saveRecipes(updatedRecipes);

                return updatedRecipe;
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
}

export class RemoteRecipeService implements IRecipeService {
    async getRecipes(): Promise<Recipe[]> {
        return api.get<Recipe[]>('/recipes');
    }

    async createRecipe(recipe: Partial<Recipe>): Promise<Recipe> {
        return api.post<Recipe>('/recipes', recipe);
    }

    async updateRecipe(recipeId: string, updates: Partial<Recipe>): Promise<Recipe> {
        return api.put<Recipe>(`/recipes/${recipeId}`, updates);
    }
}

/**
 * Creates a recipe service based on the data mode
 * 
 * @param mode - The data mode ('guest' | 'signed-in')
 * @param entityType - The type of entity being accessed (for validation)
 * @returns The appropriate recipe service implementation
 * @throws Error if the mode and service type are incompatible
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
