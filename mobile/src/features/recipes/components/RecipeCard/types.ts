import { ViewStyle } from 'react-native';

import { Recipe as CoreRecipe } from '../../../../mocks/recipes';

// Using local interface for card props to allow partial recipes or simplified models if needed,
// but extending the core definition for stability.
export interface Recipe extends Partial<CoreRecipe> {
  id: string;
  title: string;
}

export interface RecipeCardProps {
  recipe: Recipe;
  backgroundColor: string;
  onPress: () => void;
  width: number;
  style?: ViewStyle;
  onEdit?: () => void;
}
