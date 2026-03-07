/**
 * Validates if a string is a valid HTTP/HTTPS URL
 * Used to prevent XSS attacks from user-generated image URLs
 *
 * @param url - The URL string to validate
 * @returns true if the URL is valid and uses HTTP/HTTPS protocol, false otherwise
 *
 * @example
 * isValidImageUrl('https://example.com/image.jpg') // true
 * isValidImageUrl('http://example.com/image.jpg')  // true
 * isValidImageUrl('javascript:alert(1)')           // false
 * isValidImageUrl('file:///etc/passwd')            // false
 * isValidImageUrl('not a url')                      // false
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);
    // Only allow HTTP and HTTPS protocols
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    // URL parsing failed - invalid URL
    return false;
  }
}
