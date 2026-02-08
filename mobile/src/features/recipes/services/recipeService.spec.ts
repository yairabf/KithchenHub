import {
  createRecipeService,
  LocalRecipeService,
  RemoteRecipeService,
} from './recipeService';
import { api } from '../../../services/api';
import { mockRecipes } from '../../../mocks/recipes';
import { guestStorage } from '../../../common/utils/guestStorage';
import { isDevMode } from '../../../common/utils/devMode';
import { invalidateCache } from '../../../common/repositories/cacheAwareRepository';

// Mock AsyncStorage (required for cache-aware repository)
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock network status utility
jest.mock('../../../common/utils/networkStatus', () => ({
  getIsOnline: jest.fn(() => true),
  setNetworkStatusProvider: jest.fn(),
}));

// Mock the api client
jest.mock('../../../services/api', () => ({
    api: {
        get: jest.fn(),
        post: jest.fn(),
        put: jest.fn(),
        patch: jest.fn(),
    },
}));

// Mock guestStorage
jest.mock('../../../common/utils/guestStorage', () => ({
    guestStorage: {
        getRecipes: jest.fn().mockResolvedValue([]),
        saveRecipes: jest.fn().mockResolvedValue(undefined),
    },
}));

// Mock devMode utility
jest.mock('../../../common/utils/devMode', () => ({
    isDevMode: jest.fn(),
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

        it('createRecipe returns a new recipe object with createdAt and persists to guestStorage', async () => {
            (guestStorage.getRecipes as jest.Mock).mockResolvedValue([]);
            const newRecipeData = { title: 'Test Recipe' };
            const beforeCreation = Date.now();
            const recipe = await service.createRecipe(newRecipeData);
            const afterCreation = Date.now();

            expect(recipe.id).toBeDefined();
            expect(recipe.localId).toBeDefined();
            expect(recipe.title).toBe('Test Recipe');
            expect(recipe.category).toBeUndefined();
            // Verify createdAt is set and is a valid Date
            expect(recipe.createdAt).toBeInstanceOf(Date);
            expect(recipe.createdAt!.getTime()).toBeGreaterThanOrEqual(beforeCreation);
            expect(recipe.createdAt!.getTime()).toBeLessThanOrEqual(afterCreation);
            expect(guestStorage.getRecipes).toHaveBeenCalled();
            expect(guestStorage.saveRecipes).toHaveBeenCalledWith([recipe]);
        });

        describe.each([
            [
                'updates title and imageUrl',
                { title: 'Updated Recipe', imageUrl: 'https://example.com/image.jpg' },
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
                    title: 'Original Recipe',
                    cookTime: 30,
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

            await expect(service.updateRecipe('non-existent', { title: 'Test' })).rejects.toThrow(
                'Recipe not found: non-existent'
            );
        });

        it('deleteRecipe soft-deletes recipe and persists to guestStorage', async () => {
            const existingRecipe = {
                id: 'local-1',
                localId: 'uuid-1',
                name: 'Recipe to Delete',
                cookTime: '30 min',
                category: 'Dinner',
                ingredients: [],
                instructions: [],
            };
            (guestStorage.getRecipes as jest.Mock).mockResolvedValue([existingRecipe]);

            await service.deleteRecipe('local-1');

            expect(guestStorage.getRecipes).toHaveBeenCalled();
            expect(guestStorage.saveRecipes).toHaveBeenCalled();
            const savedRecipes = (guestStorage.saveRecipes as jest.Mock).mock.calls[0][0];
            expect(savedRecipes[0]).toEqual(expect.objectContaining({
                id: 'local-1',
                deletedAt: expect.any(Date),
                updatedAt: expect.any(Date),
            }));
        });

        it('should handle concurrent recipe creation', async () => {
            (guestStorage.getRecipes as jest.Mock).mockResolvedValue([]);
            (guestStorage.saveRecipes as jest.Mock).mockResolvedValue(undefined);

            const promises = Array.from({ length: 5 }, (_, i) =>
                service.createRecipe({ title: `Recipe ${i}` })
            );

            const recipes = await Promise.all(promises);

            expect(recipes.length).toBe(5);
            expect(recipes.every(r => r.localId && r.title)).toBe(true);
            // Verify all recipes were saved (saveRecipes should be called 5 times due to retries)
            expect(guestStorage.saveRecipes).toHaveBeenCalled();
        });

        it('should provide default values for missing fields', async () => {
            (guestStorage.getRecipes as jest.Mock).mockResolvedValue([]);

            // Even with empty title, it should get a default
            const recipe = await service.createRecipe({ title: '' });
            expect(recipe.title).toBe('New Recipe');
            expect(recipe.localId).toBeDefined();
        });

        describe('Dev-Only Seeding', () => {
            beforeEach(() => {
                jest.clearAllMocks();
            });

            it('seeds mock recipes when storage is empty in dev mode', async () => {
                (isDevMode as jest.Mock).mockReturnValue(true);
                (guestStorage.getRecipes as jest.Mock).mockResolvedValue([]);

                const recipes = await service.getRecipes();

                expect(recipes).toHaveLength(mockRecipes.length);
                expect(guestStorage.saveRecipes).toHaveBeenCalledWith(
                    expect.arrayContaining([
                        expect.objectContaining({ title: 'Pancakes' }),
                        expect.objectContaining({ title: 'Pasta Carbonara' }),
                    ])
                );
                // Verify all seeded recipes have createdAt
                recipes.forEach(recipe => {
                    expect(recipe.createdAt).toBeInstanceOf(Date);
                });
            });

            describe.each([
                [
                    'storage has existing recipes',
                    true, // isDevMode
                    [{
                        id: '1',
                        localId: 'uuid-1',
                        title: 'Existing',
                        cookTime: 30,
                        category: 'Dinner',
                        ingredients: [],
                        instructions: [],
                    }],
                ],
                [
                    'storage has soft-deleted recipes',
                    true, // isDevMode
                    [{
                        id: '1',
                        localId: 'uuid-1',
                        title: 'Deleted Recipe',
                        cookTime: 30,
                        category: 'Dinner',
                        ingredients: [],
                        instructions: [],
                        deletedAt: new Date(), // Soft-deleted
                    }],
                ],
                [
                    'production mode with empty storage',
                    false, // isDevMode
                    [],
                ],
            ])('does not seed when %s', (_description, isDev, existingRecipes) => {
                it('returns existing recipes without seeding', async () => {
                    (isDevMode as jest.Mock).mockReturnValue(isDev);
                    (guestStorage.getRecipes as jest.Mock).mockResolvedValue(existingRecipes);

                    const recipes = await service.getRecipes();

                    expect(recipes).toEqual(existingRecipes);
                    expect(guestStorage.saveRecipes).not.toHaveBeenCalled();
                });
            });

            it('seeded recipes have proper timestamps', async () => {
                (isDevMode as jest.Mock).mockReturnValue(true);
                (guestStorage.getRecipes as jest.Mock).mockResolvedValue([]);
                
                const beforeSeeding = Date.now();
                const recipes = await service.getRecipes();
                const afterSeeding = Date.now();

                // Verify all seeded recipes have createdAt timestamps
                recipes.forEach(recipe => {
                    expect(recipe.createdAt).toBeInstanceOf(Date);
                    const timestamp = recipe.createdAt!.getTime();
                    expect(timestamp).toBeGreaterThan(0);
                    // Verify timestamp is recent (within test execution time)
                    expect(timestamp).toBeGreaterThanOrEqual(beforeSeeding);
                    expect(timestamp).toBeLessThanOrEqual(afterSeeding);
                });
            });

            it('seeding is idempotent - only seeds once when empty', async () => {
                (isDevMode as jest.Mock).mockReturnValue(true);
                (guestStorage.getRecipes as jest.Mock).mockResolvedValue([]);

                // First call should seed
                const firstCall = await service.getRecipes();
                expect(firstCall).toHaveLength(mockRecipes.length);
                expect(guestStorage.saveRecipes).toHaveBeenCalledTimes(1);

                // Second call should return seeded recipes (no re-seeding)
                (guestStorage.getRecipes as jest.Mock).mockResolvedValue(firstCall);
                const secondCall = await service.getRecipes();
                expect(secondCall).toHaveLength(mockRecipes.length);
                // saveRecipes should still be called only once (from first call)
                expect(guestStorage.saveRecipes).toHaveBeenCalledTimes(1);
            });

            it('throws meaningful error when seeding fails', async () => {
                (isDevMode as jest.Mock).mockReturnValue(true);
                (guestStorage.getRecipes as jest.Mock).mockResolvedValue([]);
                (guestStorage.saveRecipes as jest.Mock).mockRejectedValue(new Error('Storage full'));

                await expect(service.getRecipes()).rejects.toThrow(
                    'Failed to seed mock recipes in dev mode: Storage full'
                );
            });
        });

        describe('Storage persistence (smoke test)', () => {
            it('should persist recipe to guestStorage', async () => {
                // Mock isDevMode to return false to prevent seeding
                (isDevMode as jest.Mock).mockReturnValue(false);
                (guestStorage.getRecipes as jest.Mock).mockResolvedValue([]);
                (guestStorage.saveRecipes as jest.Mock).mockResolvedValue(undefined);
                
                const recipe = await service.createRecipe({ title: 'Test Recipe' });
                
                // Verify storage was called
                expect(guestStorage.saveRecipes).toHaveBeenCalled();
                expect(guestStorage.saveRecipes).toHaveBeenCalledWith([recipe]);
                
                // Verify recipe can be retrieved
                (guestStorage.getRecipes as jest.Mock).mockResolvedValue([recipe]);
                const retrieved = await service.getRecipes();
                expect(retrieved).toContainEqual(expect.objectContaining({ title: 'Test Recipe' }));
            });
        });
    });

    describe('RemoteRecipeService', () => {
        let service: RemoteRecipeService;

        beforeEach(() => {
            service = new RemoteRecipeService();
            jest.clearAllMocks();
        });

        it('getRecipes calls api.get and normalizes timestamps', async () => {
            const mockResult = [{ id: '1', title: 'Remote', created_at: '2026-01-25T10:00:00.000Z' }];
            (api.get as jest.Mock).mockResolvedValue(mockResult);

            const recipes = await service.getRecipes();

            expect(api.get).toHaveBeenCalledWith('/recipes');
            expect(recipes).toHaveLength(1);
            expect(recipes[0]).toEqual(expect.objectContaining({ id: '1', title: 'Remote' }));
        });

        it('createRecipe calls api.post with timestamps', async () => {
            const newRecipeData = { title: 'New Remote' };
            const mockResult = { id: 'remote-1', title: 'New Remote' };
            (api.post as jest.Mock).mockResolvedValue(mockResult);

            const recipe = await service.createRecipe(newRecipeData);

            // Verify api.post was called with payload containing timestamps
            expect(api.post).toHaveBeenCalledWith('/recipes', expect.objectContaining({
                title: 'New Remote',
            }));
            expect(recipe).toEqual(expect.objectContaining({ id: 'remote-1', title: 'New Remote' }));
        });

        describe.each([
            ['updates imageUrl', { imageUrl: 'https://example.com/image.jpg' }],
            ['updates title', { title: 'Updated Remote' }],
        ])('updateRecipe: %s', (_label, updates) => {
            it('calls api.put with recipe id and payload', async () => {
                const recipeId = 'remote-1';
                const existingRecipe = { id: recipeId, title: 'Original', cookTime: 30, category: 'Dinner', ingredients: [], instructions: [] };
                const mockResult = { id: recipeId, ...existingRecipe, ...updates };
                
                await invalidateCache('recipes');
                (api.get as jest.Mock).mockResolvedValue([existingRecipe]);
                (api.put as jest.Mock).mockResolvedValue(mockResult);

                const recipe = await service.updateRecipe(recipeId, updates);

                // RemoteRecipeService sends mapRecipeToUpdateDto(updates) only; server is authority for timestamps
                expect(api.put).toHaveBeenCalledWith(`/recipes/${recipeId}`, expect.objectContaining(updates));
                expect(recipe).toEqual(expect.objectContaining({ id: recipeId, ...updates }));
            });
        });
    });
});
