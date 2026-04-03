/**
 * Forces i18n to the already-detected locale before the app renders.
 *
 * The async language detector inside i18n.init() reads AsyncStorage independently.
 * It may not resolve until after the first render, leaving i18n.language as the
 * 'en' fallback and causing every API call to send lang=en.
 * Since the bootstrap has already read the stored/device locale, we apply it here
 * immediately so all downstream API calls use the correct language from the start.
 *
 * @param i18n - The initialised i18next instance
 * @param detectedLocale - Locale resolved by the App bootstrap (storage → device → 'en')
 */

export interface I18nInstance {
  language: string;
  changeLanguage(lng: string): Promise<unknown>;
}

export async function syncI18nToDetectedLocale(
  i18n: I18nInstance,
  detectedLocale: string,
): Promise<void> {
  if (i18n.language !== detectedLocale) {
    await i18n.changeLanguage(detectedLocale);
  }
}
