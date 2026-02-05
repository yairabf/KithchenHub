import { ImportService } from './importService';
import { api } from '../../services/api';
import { mockRecipes } from '../../mocks/recipes';
import { mockShoppingLists, mockItems } from '../../mocks/shopping';
import { createRecipeService } from '../../features/recipes/services/recipeService';
import { createShoppingService } from '../../features/shopping/services/shoppingService';
import { config } from '../../config';
import { guestStorage } from '../../common/utils/guestStorage';

// Mock dependencies
jest.mock('../../services/api', () => ({
    api: {
        post: jest.fn(),
    },
}));

jest.mock('../../common/utils/guestStorage', () => ({
    guestStorage: {
        getRecipes: jest.fn().mockResolvedValue([]),
        getShoppingLists: jest.fn().mockResolvedValue([]),
        getShoppingItems: jest.fn().mockResolvedValue([]),
        saveRecipes: jest.fn(),
        saveShoppingLists: jest.fn(),
        saveShoppingItems: jest.fn(),
        clearAll: jest.fn(),
    },
}));

const mockRecipeService = {
    getRecipes: jest.fn().mockResolvedValue(mockRecipes),
};

const mockShoppingService = {
    getShoppingData: jest.fn().mockResolvedValue({
        shoppingLists: mockShoppingLists,
        shoppingItems: mockItems,
        categories: [],
        groceryItems: [],
        frequentlyAddedItems: [],
    }),
};

jest.mock('../../config', () => ({
    config: {
        mockData: { enabled: true },
    },
}));

jest.mock('../../features/recipes/services/recipeService', () => ({
    createRecipeService: jest.fn(() => mockRecipeService),
}));

jest.mock('../../features/shopping/services/shoppingService', () => ({
    createShoppingService: jest.fn(() => mockShoppingService),
}));

describe('ImportService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        config.mockData.enabled = true;
    });

    describe('gatherLocalData', () => {
        describe.each([
            { scenario: 'mock enabled', mockEnabled: true },
            { scenario: 'mock disabled', mockEnabled: false },
        ])('service selection (%s)', ({ mockEnabled }) => {
            it('should always use guest mode services for guest import', async () => {
                config.mockData.enabled = mockEnabled;

                // Mock empty arrays to avoid validation errors in service selection test
                (guestStorage.getRecipes as jest.Mock).mockResolvedValue([]);
                (guestStorage.getShoppingLists as jest.Mock).mockResolvedValue([]);
                (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([]);
                (mockRecipeService.getRecipes as jest.Mock).mockResolvedValue([]);
                (mockShoppingService.getShoppingData as jest.Mock).mockResolvedValue({
                    shoppingLists: [],
                    shoppingItems: [],
                    categories: [],
                    groceryItems: [],
                    frequentlyAddedItems: [],
                });

                await ImportService.gatherLocalData();

                expect(jest.mocked(createRecipeService)).toHaveBeenCalledWith('guest');
                expect(jest.mocked(createShoppingService)).toHaveBeenCalledWith('guest');
            });
        });

        it('should gather recipes and shopping lists from local sources', async () => {
            // Add mode field to mock data to pass validation
            const guestRecipes = mockRecipes.map(r => ({ ...r, mode: 'guest' as const }));
            const guestLists = mockShoppingLists.map(l => ({ ...l, mode: 'guest' as const }));
            const guestItems = mockItems.map(i => ({ ...i, mode: 'guest' as const }));

            // Mock guestStorage to return test data
            (guestStorage.getRecipes as jest.Mock).mockResolvedValue(guestRecipes);
            (guestStorage.getShoppingLists as jest.Mock).mockResolvedValue(guestLists);
            (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue(guestItems);

            // Update service mocks to return data from guestStorage
            (mockRecipeService.getRecipes as jest.Mock).mockResolvedValue(guestRecipes);
            (mockShoppingService.getShoppingData as jest.Mock).mockResolvedValue({
                shoppingLists: guestLists,
                shoppingItems: guestItems,
                categories: [],
                groceryItems: [],
                frequentlyAddedItems: [],
            });

            const data = await ImportService.gatherLocalData();

            expect(data.recipes).toBeDefined();
            expect(data.recipes?.length).toBe(mockRecipes.length);
            expect(data.recipes?.[0].title).toBe(mockRecipes[0].title);

            expect(data.shoppingLists).toBeDefined();
            expect(data.shoppingLists?.length).toBe(mockShoppingLists.length);

            // Verify items are nested in shopping lists
            const listId = mockShoppingLists[0].id;
            const itemsInList = mockItems.filter(i => i.listId === listId);
            expect(data.shoppingLists?.[0].items.length).toBe(itemsInList.length);
        });

        it('should map recipe fields correctly', async () => {
            // Add mode field to mock data to pass validation
            const guestRecipes = mockRecipes.map(r => ({ ...r, mode: 'guest' as const }));

            // Mock guestStorage to return test data
            (guestStorage.getRecipes as jest.Mock).mockResolvedValue(guestRecipes);
            (mockRecipeService.getRecipes as jest.Mock).mockResolvedValue(guestRecipes);

            const data = await ImportService.gatherLocalData();
            const firstRecipe = data.recipes?.[0];
            const mockRecipe = mockRecipes[0];

            expect(firstRecipe?.id).toBe(mockRecipe.localId);
            expect(firstRecipe?.title).toBe(mockRecipe.title);
            // Mock recipe has "20 min", we might map to undefined or try to parse if we added logic.
            // For now, key fields verification:
            expect(firstRecipe?.ingredients.length).toBe(mockRecipe.ingredients.length);
            expect(firstRecipe?.instructions.length).toBe(mockRecipe.instructions.length);
        });

        it('should return empty arrays when no guest data exists', async () => {
            // Mock guestStorage to return empty arrays
            (guestStorage.getRecipes as jest.Mock).mockResolvedValue([]);
            (guestStorage.getShoppingLists as jest.Mock).mockResolvedValue([]);
            (guestStorage.getShoppingItems as jest.Mock).mockResolvedValue([]);

            // Update service mocks to return empty arrays
            (mockRecipeService.getRecipes as jest.Mock).mockResolvedValue([]);
            (mockShoppingService.getShoppingData as jest.Mock).mockResolvedValue({
                shoppingLists: [],
                shoppingItems: [],
                categories: [],
                groceryItems: [],
                frequentlyAddedItems: [],
            });

            const data = await ImportService.gatherLocalData();

            expect(data.recipes).toBeDefined();
            expect(data.recipes?.length).toBe(0);
            expect(data.shoppingLists).toBeDefined();
            expect(data.shoppingLists?.length).toBe(0);
        });
    });

    describe('submitImport', () => {
        it('should call api.post with the gathered data', async () => {
            const mockData = {
                recipes: [],
                shoppingLists: [],
            };

            (api.post as jest.Mock).mockResolvedValue({
                created: 10,
                skipped: 0,
                mappings: {},
            });

            const response = await ImportService.submitImport(mockData);

            expect(api.post).toHaveBeenCalledWith('/import', mockData);
            expect(response).toEqual({
                created: 10,
                skipped: 0,
                mappings: {},
            });
        });

        it('should throw error if api call fails', async () => {
            (api.post as jest.Mock).mockRejectedValue(new Error('Network error'));

            await expect(ImportService.submitImport({})).rejects.toThrow('Network error');
        });
    });
});
