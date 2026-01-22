import { LocalRecipeService, RemoteRecipeService } from './recipeService';
import { api } from '../../../services/api';
import { mockRecipes } from '../../../mocks/recipes';

// Mock the api client
jest.mock('../../../services/api', () => ({
    api: {
        get: jest.fn(),
        post: jest.fn(),
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
    });
});
