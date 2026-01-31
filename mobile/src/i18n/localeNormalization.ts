/**
 * Normalizes a locale string to a language code for i18n matching.
 * Rules: normalize separator (en_US → en-US), take language part (en-US → en), lowercase.
 * Hebrew: use he, not legacy iw (consistent with supportedLngs and RTL later).
 */
const LEGACY_HEBREW_CODE = 'iw';
const HEBREW_CODE = 'he';

/**
 * Normalizes a locale (e.g. en-US, en_US, EN-us) to a language code (e.g. en).
 * - Replaces underscore with hyphen, then takes the segment before the first hyphen.
 * - Lowercases the result.
 * - Maps legacy Hebrew code iw to he.
 *
 * @param locale - Raw locale string from device or storage (e.g. en-US, en_US)
 * @returns Normalized language code (e.g. en, es, he, ar)
 */
export function normalizeLocale(locale: string): string {
  if (locale == null || locale === '') {
    return '';
  }
  const normalized = locale.trim().replace(/_/g, '-');
  const languagePart = normalized.split('-')[0] ?? normalized;
  const lowercased = languagePart.toLowerCase();
  if (lowercased === LEGACY_HEBREW_CODE) {
    return HEBREW_CODE;
  }
  return lowercased;
}
