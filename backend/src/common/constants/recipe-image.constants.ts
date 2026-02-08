export const RECIPE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const RECIPE_IMAGE_MAX_INPUT_DIMENSION = 10000;
export const RECIPE_IMAGE_MAX_INPUT_PIXELS = 25_000_000;
export const RECIPE_IMAGE_UPLOADS_PER_HOUR = 60;
export const RECIPE_IMAGE_UPLOAD_BURST = 10;
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
