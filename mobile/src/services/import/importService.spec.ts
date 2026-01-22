import { ImportService } from './importService';
import { api } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mockRecipes } from '../../mocks/recipes';
import { mockShoppingLists, mockItems } from '../../mocks/shopping';
import { mockChores } from '../../mocks/chores';

// Mock dependencies
jest.mock('../../services/api', () => ({
    api: {
        post: jest.fn(),
    },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
}));

jest.mock('../../features/recipes/services/recipeService', () => ({
    LocalRecipeService: jest.fn().mockImplementation(() => ({
        getRecipes: jest.fn().mockResolvedValue(mockRecipes),
    })),
}));

describe('ImportService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    });

    describe('gatherLocalData', () => {
        it('should gather recipes, shopping lists, and chores from mocks/local sources', async () => {
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
