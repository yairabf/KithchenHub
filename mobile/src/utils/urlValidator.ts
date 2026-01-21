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

/**
 * Validates multiple URLs at once
 *
 * @param urls - Array of URL strings to validate
 * @returns Object mapping each URL to its validation result
 *
 * @example
 * validateImageUrls(['https://example.com/img1.jpg', 'invalid'])
 * // Returns: { 'https://example.com/img1.jpg': true, 'invalid': false }
 */
export function validateImageUrls(urls: string[]): Record<string, boolean> {
  const result: Record<string, boolean> = {};

  for (const url of urls) {
    result[url] = isValidImageUrl(url);
  }

  return result;
}

/**
 * Filters an array of URLs to only include valid ones
 *
 * @param urls - Array of URL strings
 * @returns Array containing only valid HTTP/HTTPS URLs
 *
 * @example
 * filterValidImageUrls(['https://example.com/img.jpg', 'invalid', 'javascript:alert(1)'])
 * // Returns: ['https://example.com/img.jpg']
 */
export function filterValidImageUrls(urls: string[]): string[] {
  return urls.filter(isValidImageUrl);
}
