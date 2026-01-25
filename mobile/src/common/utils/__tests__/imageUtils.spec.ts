/**
 * Image Utils Tests
 * 
 * Parameterized tests for image URL validation.
 */

import { isValidImageUrl } from '../imageUtils';

describe('isValidImageUrl', () => {
  describe.each([
    ['valid URL', 'https://images.unsplash.com/photo-123.jpg', true],
    ['valid URL with query params', 'https://example.com/image.jpg?w=100&h=100', true],
    ['valid relative URL', '/images/photo.jpg', true],
    ['valid data URL', 'data:image/jpeg;base64,/9j/4AAQSkZJRg==', true],
    ['empty string', '', false],
    ['whitespace only', '   ', false],
    ['whitespace with tabs', '\t\n\r', false],
    ['null value', null, false],
    ['undefined value', undefined, false],
    ['string with leading whitespace', '  https://example.com/image.jpg', true],
    ['string with trailing whitespace', 'https://example.com/image.jpg  ', true],
    ['string with both leading and trailing whitespace', '  https://example.com/image.jpg  ', true],
  ])('with %s', (description, input, expected) => {
    it(`should return ${expected}`, () => {
      expect(isValidImageUrl(input as string | null | undefined)).toBe(expected);
    });
  });
});
