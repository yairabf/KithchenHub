import { api } from '../../services/api';
import { createRecipeService } from '../../features/recipes/services/recipeService';
import { createShoppingService } from '../../features/shopping/services/shoppingService';
import {
    ImportRequestDto,
    ImportRecipeDto,
    ImportShoppingListDto,
    ShoppingItemInputDto,
    ImportResponseDto
} from './types';

// Helper to safely parse strings to numbers
const safeParseInt = (value: string | undefined): number => {
    if (!value) return 0;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? 0 : parsed;
};

const safeParseFloat = (value: string | undefined): number => {
    if (!value) return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
};

export class ImportService {
    /**
     * Gathers all guest local data using local services and constructs
     * the payload for the import API.
     *
     * Note: Always uses local services to avoid remote API data.
     */
    static async gatherLocalData(): Promise<ImportRequestDto> {
        // 1. Recipes
        // Always use local services for guest imports.
        const recipeService = createRecipeService(true);
        const recipes = await recipeService.getRecipes();

        const importRecipes: ImportRecipeDto[] = recipes.map(recipe => ({
            id: recipe.localId,
            title: recipe.name,
            prepTime: safeParseInt(recipe.prepTime),
            imageUrl: recipe.imageUrl,
            ingredients: recipe.ingredients.map(ing => ({
                name: ing.name,
                quantity: safeParseFloat(ing.quantity),
                unit: ing.unit,
            })),
            instructions: recipe.instructions.map((inst, index) => ({
                step: index + 1,
                instruction: inst.text,
            })),
        }));

        // 2. Shopping Lists
        const shoppingService = createShoppingService(true);
        const shoppingData = await shoppingService.getShoppingData();
        const importShoppingLists: ImportShoppingListDto[] = shoppingData.shoppingLists.map(list => {
            const listItems = shoppingData.shoppingItems.filter(item => item.listId === list.id);
            const importItems: ShoppingItemInputDto[] = listItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                category: item.category,
                // We don't have unit in ShoppingItem mock, but DTO supports it.
            }));

            return {
                id: list.localId,
                name: list.name,
                color: list.color,
                items: importItems,
            };
        });

        // 3. Chores (Not yet in DTO? Wait. The task only checks recipes and lists in standard import DTO usually?)
        // Let's check ImportRequestDto again. All we defined was Recipes and Shopping Lists.
        // If Chores are needed, we need to add them to types.ts and DTOs.
        // The ImportRequestDto I defined in types.ts only had recipes and shoppingLists.
        // If backend supports chores, I should have added it.
        // I checked backend import.dto.ts in step 138 and it ONLY had recipes and shoppingLists!
        // So I will skip chores for now or verify if I missed it.
        // import.dto.ts: 
        // export class ImportRequestDto { ... recipes?; ... shoppingLists?; }
        // No chores. So I will skip chores.

        return {
            recipes: importRecipes,
            shoppingLists: importShoppingLists,
        };
    }

    /**
     * Submits the gathered data to the backend import endpoint.
     */
    static async submitImport(data: ImportRequestDto): Promise<ImportResponseDto> {
        return api.post<ImportResponseDto>('/import', data);
    }
}
