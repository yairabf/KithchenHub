import * as Crypto from 'expo-crypto';
import type { Recipe } from '../../../mocks/recipes';
import type { NewRecipeData } from '../components/AddRecipeModal';
import { withCreatedAtAndUpdatedAt } from '../../../common/utils/timestamps';

export const createRecipe = (data: NewRecipeData): Recipe => {
    const recipe = {
        id: String(Date.now()),
        localId: Crypto.randomUUID(),
        title: data.title,
        cookTime: typeof data.cookTime === 'number' ? data.cookTime : undefined,
        prepTime: typeof data.prepTime === 'number' ? data.prepTime : undefined,
        category: data.category,
        description: data.description,
        ingredients: data.ingredients,
        instructions: data.instructions,
        imageUrl: data.imageUrl,
    };
    // Business rule: auto-populate createdAt and updatedAt on creation
    return withCreatedAtAndUpdatedAt(recipe);
};
