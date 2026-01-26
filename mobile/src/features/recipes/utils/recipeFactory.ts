import * as Crypto from 'expo-crypto';
import type { Recipe } from '../../../mocks/recipes';
import type { NewRecipeData } from '../components/AddRecipeModal';
import { withCreatedAtAndUpdatedAt } from '../../../common/utils/timestamps';

export const createRecipe = (data: NewRecipeData): Recipe => {
    const recipe = {
        id: String(Date.now()),
        localId: Crypto.randomUUID(),
        name: data.title,
        cookTime: data.prepTime || 'N/A',
        category: data.category || 'Dinner',
        description: data.description,
        ingredients: data.ingredients,
        instructions: data.instructions,
        imageUrl: data.imageUrl,
    };
    // Business rule: auto-populate createdAt and updatedAt on creation
    return withCreatedAtAndUpdatedAt(recipe);
};
