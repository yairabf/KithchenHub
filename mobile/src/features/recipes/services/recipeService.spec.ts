import {
  createRecipeService,
  LocalRecipeService,
  RemoteRecipeService,
} from './recipeService';

describe('createRecipeService', () => {
  describe.each([
    ['mock enabled', true, LocalRecipeService],
    ['mock disabled', false, RemoteRecipeService],
  ])('when %s', (_label, isMockEnabled, expectedClass) => {
    it('returns the expected service implementation', () => {
      const service = createRecipeService(isMockEnabled);

      expect(service).toBeInstanceOf(expectedClass);
    });
  });
});
import { api } from '../../../services/api';
import { mockRecipes } from '../../../mocks/recipes';

// Mock the api client
jest.mock('../../../services/api', () => ({
    api: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
    },
}));

describe('Recipe Services', () => {
    describe('LocalRecipeService', () => {
        let service: LocalRecipeService;

        beforeEach(() => {
            service = new LocalRecipeService();
        });

        it('getRecipes returns mock recipes', async () => {
            const recipes = await service.getRecipes();
            expect(recipes).toEqual(mockRecipes);
        });

        it('createRecipe returns a new recipe object', async () => {
            const newRecipeData = { name: 'Test Recipe' };
            const recipe = await service.createRecipe(newRecipeData);

            expect(recipe.id).toBeDefined();
            expect(recipe.localId).toBeDefined();
            expect(recipe.name).toBe('Test Recipe');
            expect(recipe.category).toBe('Dinner'); // Default
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
            it('returns a recipe with updated fields', async () => {
                const recipe = await service.updateRecipe('local-1', updates);

                expect(recipe.id).toBe('local-1');
                expect(recipe).toEqual(expect.objectContaining(updates));
            });
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
