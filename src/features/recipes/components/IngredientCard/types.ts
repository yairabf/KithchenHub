import type { Ingredient } from '../../../../mocks/recipes';

export interface IngredientCardProps {
  ingredient: Ingredient;
  backgroundColor: string;
  onAddToList: () => void;
}
