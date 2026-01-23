import { ImportService } from './importService';
import { api } from '../../services/api';
import { mockRecipes } from '../../mocks/recipes';
import { mockShoppingLists, mockItems } from '../../mocks/shopping';

// Mock dependencies
jest.mock('../../services/api', () => ({
    api: {
        post: jest.fn(),
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
    });

    describe('gatherLocalData', () => {
        it('should gather recipes and shopping lists from local sources', async () => {
            const data = await ImportService.gatherLocalData();

            expect(data.recipes).toBeDefined();
            expect(data.recipes?.length).toBe(mockRecipes.length);
            expect(data.recipes?.[0].title).toBe(mockRecipes[0].name);

            expect(data.shoppingLists).toBeDefined();
            expect(data.shoppingLists?.length).toBe(mockShoppingLists.length);

            // Verify items are nested in shopping lists
            const listId = mockShoppingLists[0].id;
            const itemsInList = mockItems.filter(i => i.listId === listId);
            expect(data.shoppingLists?.[0].items.length).toBe(itemsInList.length);
        });

        it('should map recipe fields correctly', async () => {
            const data = await ImportService.gatherLocalData();
            const firstRecipe = data.recipes?.[0];
            const mockRecipe = mockRecipes[0];

            expect(firstRecipe?.id).toBe(mockRecipe.localId);
            expect(firstRecipe?.title).toBe(mockRecipe.name);
            // Mock recipe has "20 min", we might map to undefined or try to parse if we added logic.
            // For now, key fields verification:
            expect(firstRecipe?.ingredients.length).toBe(mockRecipe.ingredients.length);
            expect(firstRecipe?.instructions.length).toBe(mockRecipe.instructions.length);
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
