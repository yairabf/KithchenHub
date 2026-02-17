import type { GroceryItem } from '../../../shopping/components/GrocerySearchBar';

export interface Ingredient {
  id: string;
  quantityAmount: string;
  quantityUnit: string;
  quantityUnitType?: string;
  quantityModifier?: string;
  name: string;
}

export interface Instruction {
  id: string;
  instruction: string;
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
  removeImage?: boolean;
}

export interface AddRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (recipe: NewRecipeData) => void;
  isSaving?: boolean;
  categories?: readonly string[];
  groceryItems?: GroceryItem[];
  mode?: 'create' | 'edit';
  initialRecipe?: NewRecipeData;
  searchGroceries?: (query: string) => Promise<GroceryItem[]>;
}
