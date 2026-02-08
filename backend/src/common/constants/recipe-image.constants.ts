export const RECIPE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const RECIPE_IMAGE_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export type RecipeImageAllowedMimeType =
  (typeof RECIPE_IMAGE_ALLOWED_MIME_TYPES)[number];

export const RECIPE_IMAGE_MAIN_MAX_DIMENSION = 1600;
export const RECIPE_IMAGE_THUMB_SIZE = 400;
export const RECIPE_IMAGE_MAIN_WEBP_QUALITY = 80;
export const RECIPE_IMAGE_THUMB_WEBP_QUALITY = 75;
