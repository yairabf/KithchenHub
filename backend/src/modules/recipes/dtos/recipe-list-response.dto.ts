export class RecipeListItemDto {
  id: string;
  title: string;
  category?: string;
  prepTime?: number;
  cookTime?: number;
  imageUrl?: string;
  thumbUrl?: string | null;
  imageVersion?: number;
  imageUpdatedAt?: Date | null;
}
