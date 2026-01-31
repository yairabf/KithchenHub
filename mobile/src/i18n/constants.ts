/**
 * Single source of truth for supported languages and their display names.
 * Add new languages here and in i18n resources; index.ts uses SUPPORTED_LANGUAGE_CODES for supportedLngs.
 */

export const SUPPORTED_LANGUAGE_CODES = ['en'] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];

export interface AvailableLanguage {
  code: string;
  nativeName: string;
}

/** One entry per SUPPORTED_LANGUAGE_CODES with native display name for the language selector. */
export const AVAILABLE_LANGUAGES: readonly AvailableLanguage[] = [
  { code: 'en', nativeName: 'English' },
] as const;

/**
 * Returns the native name for a language code, or a defensive fallback so UI is never blank.
 * Preferred: match in AVAILABLE_LANGUAGES. Fallback: first entry's native name. Last resort: the code.
 *
 * @param code - Language code (e.g. 'en', 'en-US'). May be empty; normalized via trim and lowercase.
 * @returns Native display name, or fallback name, or the code string.
 */
export function getNativeNameForCode(code: string): string {
  if (code == null || code === '') {
    return AVAILABLE_LANGUAGES[0]?.nativeName ?? 'en';
  }
  const trimmed = code.trim().toLowerCase();
  const found = AVAILABLE_LANGUAGES.find((entry) => entry.code === trimmed);
  if (found != null) {
    return found.nativeName;
  }
  const fallbackName = AVAILABLE_LANGUAGES[0]?.nativeName;
  return (fallbackName ?? trimmed) || 'en';
}
