import type { Recipe, Ingredient } from '../../../../mocks/recipes';

export interface RecipeIngredientsProps {
  recipe: Recipe;
  onAddIngredient?: (ingredient: Ingredient) => void;
  onAddAllIngredients?: () => void;
}
