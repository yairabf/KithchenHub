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
  description?: string;
  category?: string;
  prepTime?: number;
  ingredients: RecipeIngredientDto[];
  instructions: RecipeInstructionDto[];
  hasImage: boolean;
  imageUrl?: string;
  thumbUrl?: string | null;
  /** Storage object keys for cache busting and display; stable identifiers for the current image version */
  imageKey?: string | null;
  /** Storage object key for thumbnail; stable identifier for the current thumb version */
  thumbKey?: string | null;
  imageVersion?: number;
  imageUpdatedAt?: Date | null;
}
