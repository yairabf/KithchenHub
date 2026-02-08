export class RecipeIngredientDto {
  name: string;
  quantityAmount?: number;
  quantityUnit?: string;
  quantityUnitType?: string;
  quantityModifier?: string;
  /** @deprecated Use quantityAmount */
  quantity?: number;
  /** @deprecated Use quantityUnit */
  unit?: string;
}

export class RecipeInstructionDto {
  step: number;
  instruction: string;
}

export class RecipeDetailDto {
  id: string;
  title: string;
  category?: string;
  prepTime?: number;
  cookTime?: number;
  ingredients: RecipeIngredientDto[];
  instructions: RecipeInstructionDto[];
  imageUrl?: string;
  thumbUrl?: string | null;
  imageVersion?: number;
  imageUpdatedAt?: Date | null;
}
