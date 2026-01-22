import type { Recipe, Ingredient } from '../../../../mocks/recipes';

export interface RecipeContentWrapperProps {
  recipe: Recipe;
  completedSteps: Set<string>;
  onToggleStep: (stepId: string) => void;
  onAddIngredient: (ingredient: Ingredient) => void;
  onAddAllIngredients: () => void;
  renderHeaderOnly?: boolean;
  hideHeaderWhenSticky?: boolean;
  activeTab?: 'ingredients' | 'steps';
  onTabChange?: (tab: 'ingredients' | 'steps') => void;
  onHeaderLayout?: (height: number) => void;
}
