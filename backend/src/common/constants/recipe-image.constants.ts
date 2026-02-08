export const RECIPE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const RECIPE_IMAGE_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export type RecipeImageAllowedMimeType =
  (typeof RECIPE_IMAGE_ALLOWED_MIME_TYPES)[number];
