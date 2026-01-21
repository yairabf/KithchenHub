import type { Recipe } from '../../../mocks/recipes';

export interface RecipesScreenProps {
  onSelectRecipe?: (recipe: Recipe) => void;
}
