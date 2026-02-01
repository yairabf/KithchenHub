import type { GroceryItem } from '../../../shopping/components/GrocerySearchBar';

export interface Ingredient {
  id: string;
  quantity: string;
  unit: string;
  name: string;
}

export interface Instruction {
  id: string;
  text: string;
}

export interface NewRecipeData {
  title: string;
  category: string;
  prepTime: string;
  description: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  imageLocalUri?: string;
  imageUrl?: string;
}

export interface AddRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (recipe: NewRecipeData) => void;
  isSaving?: boolean;
  categories?: string[];
  groceryItems?: GroceryItem[];
}
