/**
 * Tests for i18n constants: single source of truth, AVAILABLE_LANGUAGES matches SUPPORTED_LANGUAGE_CODES.
 */
import {
  SUPPORTED_LANGUAGE_CODES,
  AVAILABLE_LANGUAGES,
  getNativeNameForCode,
} from '../constants';

describe('i18n constants', () => {
  describe('single source of truth', () => {
    it('every code in SUPPORTED_LANGUAGE_CODES has exactly one entry in AVAILABLE_LANGUAGES with non-empty nativeName', () => {
      for (const code of SUPPORTED_LANGUAGE_CODES) {
        const entry = AVAILABLE_LANGUAGES.find((e) => e.code === code);
        expect(entry).toBeDefined();
        expect(entry?.nativeName).toBeDefined();
        expect(typeof entry?.nativeName).toBe('string');
        expect(entry!.nativeName.trim().length).toBeGreaterThan(0);
      }
    });

    it('AVAILABLE_LANGUAGES has no extra codes beyond SUPPORTED_LANGUAGE_CODES', () => {
      const supportedSet = new Set(SUPPORTED_LANGUAGE_CODES);
      for (const entry of AVAILABLE_LANGUAGES) {
        expect(supportedSet.has(entry.code)).toBe(true);
      }
      expect(AVAILABLE_LANGUAGES.length).toBe(SUPPORTED_LANGUAGE_CODES.length);
    });
  });

  describe('getNativeNameForCode', () => {
    it.each([
      ['en', 'English'],
      ['', 'English'],
      ['zz', 'English'],
      ['en-US', 'English'],
    ])('returns expected display for code %s', (code, expected) => {
      expect(getNativeNameForCode(code)).toBe(expected);
    });

    it('returns fallback native name for unknown code when no match in AVAILABLE_LANGUAGES', () => {
      expect(getNativeNameForCode('xx')).toBe('English');
    });
  });
});
