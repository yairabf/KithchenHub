import { createRecipe } from '../recipeFactory';
import * as Crypto from 'expo-crypto';

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
    randomUUID: jest.fn(() => 'test-uuid-recipe'),
}));

describe('recipeFactory', () => {
    describe('createRecipe', () => {
        it('should create a recipe with a valid localId', () => {
            const recipeData = {
                title: 'New Recipe',
                prepTime: '15 min',
                category: 'Dinner',
                description: 'Tasty',
                ingredients: [],
                instructions: [],
            };

            const recipe = createRecipe(recipeData);

            expect(recipe.localId).toBe('test-uuid-recipe');
            expect(recipe.name).toBe(recipeData.title);
            expect(recipe.cookTime).toBe(recipeData.prepTime);
            expect(recipe.category).toBe(recipeData.category);
            expect(recipe.id).toBeDefined(); // Legacy ID check
        });

        it('should set default values for optional fields', () => {
            const recipeData = {
                title: 'Simple Recipe',
                prepTime: '',
                category: '',
                description: '',
                ingredients: [],
                instructions: [],
            };

            const recipe = createRecipe(recipeData);

            expect(recipe.cookTime).toBe('N/A');
            expect(recipe.category).toBe('Dinner');
        });
    });
});
