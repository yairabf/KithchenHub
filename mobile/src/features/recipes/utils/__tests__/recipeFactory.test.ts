import { createRecipe, mapFormDataToRecipeUpdates, mapRecipeToFormData } from '../recipeFactory';
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
            expect(recipe.title).toBe(recipeData.title);
            expect(recipe.prepTime).toBe(15);
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

            expect(recipe.prepTime).toBeUndefined();
            expect(recipe.category).toBe('');
        });



        it('preserves catalog image and category metadata on selected ingredients', () => {
            const recipeData = {
                title: 'Apple Snack',
                prepTime: '5',
                category: 'Snack',
                description: '',
                ingredients: [
                    {
                        id: 'ingredient-apple',
                        name: 'Apple',
                        catalogItemId: 'catalog-apple',
                        image: 'https://cdn.example.com/apple.png',
                        category: 'fruits',
                        quantityAmount: '2',
                        quantityUnit: 'pcs',
                    },
                ],
                instructions: [],
            };

            const recipe = createRecipe(recipeData);

            expect(recipe.ingredients[0]).toMatchObject({
                name: 'Apple',
                catalogItemId: 'catalog-apple',
                image: 'https://cdn.example.com/apple.png',
                category: 'fruits',
            });
        });

        describe.each([
            ['non-empty description', '  Tasty dish  ', 'Tasty dish'],
            ['empty string description', '', undefined],
            ['whitespace-only description', '   ', undefined],
        ])('description with %s', (_label, inputDescription, expectedDescription) => {
            it('trims and normalizes description', () => {
                const recipeData = {
                    title: 'Recipe',
                    prepTime: '10',
                    category: 'Dinner',
                    description: inputDescription,
                    ingredients: [],
                    instructions: [],
                };
                const recipe = createRecipe(recipeData);
                expect(recipe.description).toBe(expectedDescription);
            });
        });
    });

    describe('mapFormDataToRecipeUpdates', () => {
        describe.each([
            ['includes and trims description', '  My description  ', 'My description'],
            ['omits description when empty', '', undefined],
            ['omits description when whitespace-only', '   ', undefined],
        ])('description: %s', (_label, inputDescription, expectedDescription) => {
            it('maps description correctly', () => {
                const formData = {
                    title: 'Title',
                    category: 'Dinner',
                    prepTime: '15',
                    description: inputDescription,
                    ingredients: [],
                    instructions: [],
                };
                const updates = mapFormDataToRecipeUpdates(formData);
                expect(updates.description).toBe(expectedDescription);
            });
        });


        it('preserves catalog image and category metadata in update payloads', () => {
            const updates = mapFormDataToRecipeUpdates({
                title: 'Apple Snack',
                category: 'Snack',
                prepTime: '5',
                description: '',
                ingredients: [
                    {
                        id: 'ingredient-apple',
                        name: 'Apple',
                        catalogItemId: 'catalog-apple',
                        image: 'https://cdn.example.com/apple.png',
                        category: 'fruits',
                        quantityAmount: '2',
                        quantityUnit: 'pcs',
                    },
                ],
                instructions: [],
            });

            expect(updates.ingredients?.[0]).toMatchObject({
                name: 'Apple',
                catalogItemId: 'catalog-apple',
                image: 'https://cdn.example.com/apple.png',
                category: 'fruits',
            });
        });
    });

    describe('mapRecipeToFormData', () => {
        it('includes description from recipe', () => {
            const recipe = {
                id: '1',
                localId: 'uuid-1',
                title: 'Pancakes',
                category: 'Breakfast',
                description: 'Fluffy breakfast',
                ingredients: [],
                instructions: [{ step: 1, instruction: 'Mix' }],
            };
            const formData = mapRecipeToFormData(recipe as ReturnType<typeof createRecipe>);
            expect(formData.description).toBe('Fluffy breakfast');
        });

        it('defaults description to empty string when missing', () => {
            const recipe = {
                id: '1',
                localId: 'uuid-1',
                title: 'Pancakes',
                category: 'Breakfast',
                ingredients: [],
                instructions: [],
            };
            const formData = mapRecipeToFormData(recipe as ReturnType<typeof createRecipe>);
            expect(formData.description).toBe('');
        });

        it('preserves catalog image and category metadata when editing a recipe', () => {
            const recipe = {
                id: '1',
                localId: 'uuid-1',
                title: 'Apple Snack',
                category: 'Snack',
                ingredients: [
                    {
                        id: 'ingredient-apple',
                        name: 'Apple',
                        catalogItemId: 'catalog-apple',
                        image: 'https://cdn.example.com/apple.png',
                        category: 'fruits',
                        quantityAmount: 2,
                        quantityUnit: 'pcs',
                    },
                ],
                instructions: [],
            };

            const formData = mapRecipeToFormData(recipe as ReturnType<typeof createRecipe>);

            expect(formData.ingredients[0]).toMatchObject({
                name: 'Apple',
                catalogItemId: 'catalog-apple',
                image: 'https://cdn.example.com/apple.png',
                category: 'fruits',
            });
        });
    });
});
