/**
 * Image Utilities
 * 
 * Shared utilities for image URL validation and manipulation.
 * Used across components and services to validate image URLs before rendering.
 */

/**
 * Validates if an image URL string is valid and non-empty.
 * 
 * Handles edge cases:
 * - Empty strings ('')
 * - Whitespace-only strings ('   ')
 * - Null or undefined values
 * - Valid image URLs
 * 
 * @param image - Image URL string to validate (can be null, undefined, or string)
 * @returns True if image is a non-empty, non-whitespace string
 * 
 * @example
 * ```typescript
 * isValidImageUrl('https://example.com/image.jpg') // true
 * isValidImageUrl('') // false
 * isValidImageUrl('   ') // false
 * isValidImageUrl(null) // false
 * isValidImageUrl(undefined) // false
 * ```
 */
export function isValidImageUrl(image: string | null | undefined): boolean {
  return Boolean(image && typeof image === 'string' && image.trim().length > 0);
}
