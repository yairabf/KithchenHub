/**
 * RTL (Right-to-Left) language detection for layout direction.
 * Used at bootstrap and when changing language to set I18nManager.forceRTL.
 */
import { normalizeLocale } from './localeNormalization';

export const RTL_LANGUAGE_CODES = ['he', 'ar'] as const;

/**
 * Returns true if the given locale is a right-to-left language (Hebrew or Arabic).
 * Normalizes the locale (e.g. he-IL, ar-SA) to language code before checking.
 *
 * @param locale - Raw locale string (e.g. 'he', 'he-IL', 'ar', 'ar-SA')
 * @returns true if RTL, false otherwise (including empty/invalid)
 */
export function isRtlLanguage(locale: string): boolean {
  if (locale == null || locale === '') {
    return false;
  }
  const normalized = normalizeLocale(locale);
  if (normalized === '') {
    return false;
  }
  return (RTL_LANGUAGE_CODES as readonly string[]).includes(normalized);
}
