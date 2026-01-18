import type { Recipe, Ingredient } from '../../../../mocks/recipes';

export interface RecipeSidebarProps {
  recipe: Recipe;
  onAddIngredient?: (ingredient: Ingredient) => void;
  onAddAllIngredients?: () => void;
}
