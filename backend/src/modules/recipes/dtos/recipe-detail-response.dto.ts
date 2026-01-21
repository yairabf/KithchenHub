export class RecipeIngredientDto {
  name: string;
  quantity?: number;
  unit?: string;
}

export class RecipeInstructionDto {
  step: number;
  instruction: string;
}

export class RecipeDetailDto {
  id: string;
  title: string;
  prepTime?: number;
  ingredients: RecipeIngredientDto[];
  instructions: RecipeInstructionDto[];
  imageUrl?: string;
}
