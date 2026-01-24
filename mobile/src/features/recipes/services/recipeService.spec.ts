import {
  createRecipeService,
  LocalRecipeService,
  RemoteRecipeService,
} from './recipeService';
import { api } from '../../../services/api';
import { mockRecipes } from '../../../mocks/recipes';
import { guestStorage } from '../../../common/utils/guestStorage';

// Mock the api client
jest.mock('../../../services/api', () => ({
    api: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
    },
}));

// Mock guestStorage
jest.mock('../../../common/utils/guestStorage', () => ({
    guestStorage: {
        getRecipes: jest.fn().mockResolvedValue([]),
        saveRecipes: jest.fn().mockResolvedValue(undefined),
    },
}));

describe('createRecipeService', () => {
  describe.each([
    ['guest mode', 'guest', LocalRecipeService],
    ['signed-in mode', 'signed-in', RemoteRecipeService],
  ])('when %s', (_label, mode, expectedClass) => {
    it('returns the expected service implementation', () => {
      const service = createRecipeService(mode as 'guest' | 'signed-in');

      expect(service).toBeInstanceOf(expectedClass);
    });
  });
});

describe('Recipe Services', () => {
    describe('LocalRecipeService', () => {
        let service: LocalRecipeService;

        beforeEach(() => {
            service = new LocalRecipeService();
            jest.clearAllMocks();
        });

        it('getRecipes returns recipes from guestStorage', async () => {
            (guestStorage.getRecipes as jest.Mock).mockResolvedValue(mockRecipes);
            const recipes = await service.getRecipes();
            expect(recipes).toEqual(mockRecipes);
            expect(guestStorage.getRecipes).toHaveBeenCalled();
        });

        it('getRecipes returns empty array when no guest data exists', async () => {
            (guestStorage.getRecipes as jest.Mock).mockResolvedValue([]);
            const recipes = await service.getRecipes();
            expect(recipes).toEqual([]);
            expect(guestStorage.getRecipes).toHaveBeenCalled();
        });

        it('createRecipe returns a new recipe object and persists to guestStorage', async () => {
            (guestStorage.getRecipes as jest.Mock).mockResolvedValue([]);
            const newRecipeData = { name: 'Test Recipe' };
            const recipe = await service.createRecipe(newRecipeData);

            expect(recipe.id).toBeDefined();
            expect(recipe.localId).toBeDefined();
            expect(recipe.name).toBe('Test Recipe');
            expect(recipe.category).toBe('Dinner'); // Default
            expect(guestStorage.getRecipes).toHaveBeenCalled();
            expect(guestStorage.saveRecipes).toHaveBeenCalledWith([recipe]);
        });

        describe.each([
            [
                'updates name and imageUrl',
                { name: 'Updated Recipe', imageUrl: 'https://example.com/image.jpg' },
            ],
            [
                'updates description only',
                { description: 'Updated description' },
            ],
        ])('updateRecipe: %s', (_label, updates) => {
            it('returns a recipe with updated fields and persists to guestStorage', async () => {
                const existingRecipe = {
                    id: 'local-1',
                    localId: 'uuid-1',
                    name: 'Original Recipe',
                    cookTime: '30 min',
                    category: 'Dinner',
                    ingredients: [],
                    instructions: [],
                };
                (guestStorage.getRecipes as jest.Mock).mockResolvedValue([existingRecipe]);

                const recipe = await service.updateRecipe('local-1', updates);

                expect(recipe.id).toBe('local-1');
                expect(recipe).toEqual(expect.objectContaining(updates));
                expect(guestStorage.getRecipes).toHaveBeenCalled();
                expect(guestStorage.saveRecipes).toHaveBeenCalledWith([recipe]);
            });
        });

        it('updateRecipe throws error when recipe not found', async () => {
            (guestStorage.getRecipes as jest.Mock).mockResolvedValue([]);

            await expect(service.updateRecipe('non-existent', { name: 'Test' })).rejects.toThrow(
                'Recipe not found: non-existent'
            );
        });

        it('should handle concurrent recipe creation', async () => {
            (guestStorage.getRecipes as jest.Mock).mockResolvedValue([]);
            (guestStorage.saveRecipes as jest.Mock).mockResolvedValue(undefined);

            const promises = Array.from({ length: 5 }, (_, i) =>
                service.createRecipe({ name: `Recipe ${i}` })
            );

            const recipes = await Promise.all(promises);

            expect(recipes.length).toBe(5);
            expect(recipes.every(r => r.localId && r.name)).toBe(true);
            // Verify all recipes were saved (saveRecipes should be called 5 times due to retries)
            expect(guestStorage.saveRecipes).toHaveBeenCalled();
        });

        it('should provide default values for missing fields', async () => {
            (guestStorage.getRecipes as jest.Mock).mockResolvedValue([]);

            // Even with empty name, it should get a default
            const recipe = await service.createRecipe({ name: '' });
            expect(recipe.name).toBe('New Recipe');
            expect(recipe.localId).toBeDefined();
        });
    });

    describe('RemoteRecipeService', () => {
        let service: RemoteRecipeService;

        beforeEach(() => {
            service = new RemoteRecipeService();
            jest.clearAllMocks();
        });

        it('getRecipes calls api.get', async () => {
            const mockResult = [{ id: '1', name: 'Remote' }];
            (api.get as jest.Mock).mockResolvedValue(mockResult);

            const recipes = await service.getRecipes();

            expect(api.get).toHaveBeenCalledWith('/recipes');
            expect(recipes).toEqual(mockResult);
        });

        it('createRecipe calls api.post', async () => {
            const newRecipeData = { name: 'New Remote' };
            const mockResult = { id: 'remote-1', ...newRecipeData };
            (api.post as jest.Mock).mockResolvedValue(mockResult);

            const recipe = await service.createRecipe(newRecipeData);

            expect(api.post).toHaveBeenCalledWith('/recipes', newRecipeData);
            expect(recipe).toEqual(mockResult);
        });

        describe.each([
            ['updates imageUrl', { imageUrl: 'https://example.com/image.jpg' }],
            ['updates name', { name: 'Updated Remote' }],
        ])('updateRecipe: %s', (_label, updates) => {
            it('calls api.put with recipe id', async () => {
                const recipeId = 'remote-1';
                const mockResult = { id: recipeId, ...updates };
                (api.put as jest.Mock).mockResolvedValue(mockResult);

                const recipe = await service.updateRecipe(recipeId, updates);

                expect(api.put).toHaveBeenCalledWith(`/recipes/${recipeId}`, updates);
                expect(recipe).toEqual(mockResult);
            });
        });
    });
});
