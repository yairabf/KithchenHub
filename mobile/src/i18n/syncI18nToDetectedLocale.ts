/**
 * Forces i18n to the already-detected locale before the app renders.
 *
 * The async language detector inside i18n.init() reads AsyncStorage independently.
 * It may not resolve until after the first render, leaving i18n.language as the
 * 'en' fallback and causing every API call to send lang=en.
 * Since the bootstrap has already read the stored/device locale, we apply it here
 * immediately so all downstream API calls use the correct language from the start.
 *
 * The detected locale is validated against i18n's configured supportedLngs before
 * being applied. If the locale is not supported (e.g. device is set to 'fr' but the
 * app only supports 'en', 'he', 'ar'), we fall back to i18n's configured fallbackLng
 * rather than setting an unsupported code in i18n.language and leaking it to API calls.
 */

import type { InitOptions } from 'i18next';

/**
 * The exact type i18next uses for fallbackLng, re-exported for test ergonomics.
 * Covers: false | string | string[] | FallbackLngObjList | function
 */
export type FallbackLngConfig = NonNullable<InitOptions['fallbackLng']>;

export interface I18nInstance {
  language: string;
  changeLanguage(lng: string): Promise<unknown>;
  options: Pick<InitOptions, 'supportedLngs' | 'fallbackLng'>;
}

/**
 * Extracts the primary fallback language from i18next's fallbackLng config.
 * Handles all shapes i18next allows: string, string[], FallbackLngObjList,
 * function, false, and undefined. Non-extractable shapes (object map, function,
 * false) safely default to 'en'.
 *
 * @param fallbackLng - Raw fallbackLng value from i18next options
 * @returns A single language code to fall back to, defaulting to 'en'
 */
export function resolveFallbackLng(fallbackLng: FallbackLngConfig | false | undefined): string {
  if (typeof fallbackLng === 'string' && fallbackLng !== '') return fallbackLng;
  if (Array.isArray(fallbackLng) && fallbackLng.length > 0) return fallbackLng[0] as string;
  return 'en';
}

/**
 * Returns the locale if it is in supportedLngs, otherwise returns the fallback.
 * When supportedLngs is false (allow all), any non-empty locale is accepted.
 *
 * @param locale - Normalized locale code to validate (e.g. 'fr', 'he')
 * @param options - Subset of i18next options containing supportedLngs and fallbackLng
 * @returns A supported locale code safe to pass to i18n.changeLanguage()
 */
export function resolveSupportedLocale(
  locale: string,
  options: Pick<InitOptions, 'supportedLngs' | 'fallbackLng'>,
): string {
  const fallback = resolveFallbackLng(options.fallbackLng);
  const { supportedLngs } = options;

  if (supportedLngs === false || supportedLngs == null) {
    return locale || fallback;
  }

  return (supportedLngs as readonly string[]).includes(locale) ? locale : fallback;
}

/**
 * Forces i18n to the already-detected locale before the app renders, validating
 * the locale against i18n's own supportedLngs to mirror the language detector's
 * support check and avoid leaking unsupported codes to downstream API calls.
 *
 * @param i18n - The initialised i18next instance
 * @param detectedLocale - Locale resolved by the App bootstrap (storage → device → 'en')
 */
export async function syncI18nToDetectedLocale(
  i18n: I18nInstance,
  detectedLocale: string,
): Promise<void> {
  const supportedLocale = resolveSupportedLocale(detectedLocale, i18n.options);
  if (i18n.language !== supportedLocale) {
    await i18n.changeLanguage(supportedLocale);
  }
}
