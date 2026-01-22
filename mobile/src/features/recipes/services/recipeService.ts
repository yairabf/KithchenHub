import { Recipe, mockRecipes } from '../../../mocks/recipes';
import { api } from '../../../services/api';

export interface IRecipeService {
    getRecipes(): Promise<Recipe[]>;
    createRecipe(recipe: Partial<Recipe>): Promise<Recipe>;
}

export class LocalRecipeService implements IRecipeService {
    async getRecipes(): Promise<Recipe[]> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return [...mockRecipes];
    }

    async createRecipe(recipe: Partial<Recipe>): Promise<Recipe> {
        // In local mode for this task, we aren't persisting to disk yet 
        // effectively, but the hook will manage local state.
        // TODO: Implement proper validation, error handling, and persistence (e.g. SQLite/WatermelonDB)
        // This is currently a POC in-memory implementation.
        return {
            id: `local-${Date.now()}`,
            localId: recipe.localId || `local-uuid-${Date.now()}`,
            name: recipe.name || 'New Recipe',
            cookTime: recipe.cookTime || '0 min',
            category: recipe.category || 'Dinner',
            ingredients: recipe.ingredients || [],
            instructions: recipe.instructions || [],
            ...recipe,
        } as Recipe;
    }
}

export class RemoteRecipeService implements IRecipeService {
    async getRecipes(): Promise<Recipe[]> {
        return api.get<Recipe[]>('/recipes');
    }

    async createRecipe(recipe: Partial<Recipe>): Promise<Recipe> {
        return api.post<Recipe>('/recipes', recipe);
    }
}
