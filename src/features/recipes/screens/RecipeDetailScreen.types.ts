import type { Recipe, Ingredient } from '../../../mocks/recipes';

export interface RecipeDetailScreenProps {
  recipe: Recipe;
  onBack: () => void;
  onAddToShoppingList?: (ingredients: Ingredient[]) => void;
}
