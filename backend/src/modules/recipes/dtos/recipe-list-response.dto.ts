export class RecipeListItemDto {
  id: string;
  title: string;
  description?: string;
  category?: string;
  prepTime?: number;
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
