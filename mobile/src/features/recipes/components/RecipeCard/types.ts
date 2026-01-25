import { ViewStyle } from 'react-native';

export interface Recipe {
  id: string;
  localId?: string; // Optional for backward compatibility
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
