/**
 * Tests for locale normalization used by i18n language detection.
 * Rules: normalize separator (en_US → en-US), take language part (en-US → en), lowercase; Hebrew: he not iw.
 */
import { normalizeLocale } from '../localeNormalization';

describe('normalizeLocale', () => {
  describe.each([
    ['en-US', 'en'],
    ['en_US', 'en'],
    ['EN-us', 'en'],
    ['en-us', 'en'],
    ['es-ES', 'es'],
    ['es_ES', 'es'],
    ['fr-FR', 'fr'],
    ['he-IL', 'he'],
    ['ar-SA', 'ar'],
    ['en', 'en'],
    ['es', 'es'],
    ['he', 'he'],
    ['ar', 'ar'],
  ] as const)('normalizes %s to %s', (input, expected) => {
    it(`returns "${expected}" for "${input}"`, () => {
      expect(normalizeLocale(input)).toBe(expected);
    });
  });

  describe('legacy Hebrew code iw', () => {
    it('maps iw to he', () => {
      expect(normalizeLocale('iw')).toBe('he');
      expect(normalizeLocale('iw-IL')).toBe('he');
      expect(normalizeLocale('IW')).toBe('he');
    });
  });

  describe('edge cases', () => {
    it('handles empty string by returning empty string', () => {
      expect(normalizeLocale('')).toBe('');
    });

    it('handles locale with only language code (lowercased)', () => {
      expect(normalizeLocale('EN')).toBe('en');
      expect(normalizeLocale('ES')).toBe('es');
    });
  });
});
