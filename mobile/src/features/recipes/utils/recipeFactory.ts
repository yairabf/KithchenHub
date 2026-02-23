import * as Crypto from 'expo-crypto';
import type { Recipe, Ingredient, Instruction } from '../../../mocks/recipes';
import type { NewRecipeData } from '../components/AddRecipeModal';
import { withCreatedAtAndUpdatedAt } from '../../../common/utils/timestamps';
import { UNITS_BY_TYPE } from '../constants';

/** Unit codes are string arrays in UNITS_BY_TYPE; used for type-safe find. */
const findQuantityUnitType = (quantityUnit: string | undefined): string | undefined =>
    quantityUnit == null || quantityUnit === ''
        ? undefined
        : Object.entries(UNITS_BY_TYPE).find(([, codes]: [string, readonly string[]]) =>
              codes.includes(quantityUnit)
          )?.[0];

const parseNumber = (value: unknown): number | undefined => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined;
    }
    const parsed = parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : undefined;
};

const generateId = () => Crypto.randomUUID();

export const createRecipe = (data: NewRecipeData): Recipe => {
    const prepTime = parseNumber(data.prepTime);
    const ingredients = (data.ingredients || []).map((ing) => {
        const quantityAmount = parseNumber(ing.quantityAmount);
        const quantityUnitType = findQuantityUnitType(ing.quantityUnit);
        return {
            name: ing.name,
            quantityAmount: quantityAmount ?? 1,
            quantityUnit: ing.quantityUnit || undefined,
            quantityUnitType,
            quantityModifier: ing.quantityModifier,
        };
    });
    const instructions = (data.instructions || []).map((inst, index) => ({
        step: index + 1,
        instruction: inst.instruction,
    }));
    const recipe = {
        id: String(Date.now()),
        localId: Crypto.randomUUID(),
        title: data.title.trim(),
        prepTime,
        category: data.category,
        description: data.description?.trim() || undefined,
        ingredients,
        instructions,
        imageUrl: data.imageUrl,
    };
    // Business rule: auto-populate createdAt and updatedAt on creation
    return withCreatedAtAndUpdatedAt(recipe);
};

export const mapRecipeToFormData = (recipe: Recipe): NewRecipeData => {
    const ingredients = (recipe.ingredients || []).map((ing: Ingredient) => ({
        id: generateId(),
        quantityAmount: ing.quantityAmount != null ? String(ing.quantityAmount) : ing.quantity != null ? String(ing.quantity) : '',
        quantityUnit: ing.quantityUnit ?? ing.unit ?? '',
        quantityUnitType: ing.quantityUnitType,
        quantityModifier: ing.quantityModifier,
        name: ing.name ?? '',
    }));
    const instructions = (recipe.instructions || []).map((inst: Instruction) => ({
        id: generateId(),
        instruction: inst.instruction ?? '',
    }));

    return {
        title: recipe.title ?? recipe.name ?? '',
        category: recipe.category ?? '',
        prepTime: recipe.prepTime != null ? String(recipe.prepTime) : '',
        description: recipe.description ?? '',
        ingredients,
        instructions,
        imageUrl: recipe.imageUrl,
    };
};

export const mapFormDataToRecipeUpdates = (data: NewRecipeData): Partial<Recipe> => {
    const prepTime = parseNumber(data.prepTime);
    const ingredients = (data.ingredients || []).map((ing) => {
        const quantityAmount = parseNumber(ing.quantityAmount);
        const quantityUnitType = findQuantityUnitType(ing.quantityUnit);
        return {
            name: ing.name,
            quantityAmount: quantityAmount ?? 1,
            quantityUnit: ing.quantityUnit || undefined,
            quantityUnitType,
            quantityModifier: ing.quantityModifier,
        };
    });
    const instructions = (data.instructions || []).map((inst, index) => ({
        step: index + 1,
        instruction: inst.instruction,
    }));

    return {
        title: data.title.trim(),
        category: data.category || undefined,
        prepTime,
        description: data.description?.trim() || undefined,
        ingredients,
        instructions,
    };
};
