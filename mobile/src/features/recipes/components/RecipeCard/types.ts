import { ViewStyle } from 'react-native';

export interface Recipe {
  id: string;
  name: string;
  cookTime: string;
  category: string;
  imageUrl?: string;
}

export interface RecipeCardProps {
  recipe: Recipe;
  backgroundColor: string;
  onPress: () => void;
  width: number;
  style?: ViewStyle;
}
