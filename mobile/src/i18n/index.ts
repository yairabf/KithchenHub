/**
 * i18n configuration for React Native.
 * Uses custom language detector (AsyncStorage + react-native-localize).
 * No browser-based language detection. Rely on detector + fallbackLng; do not hardcode lng.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { createLanguageDetector } from './languageDetector';
import { setStoredLanguage } from './storage';
import { normalizeLocale } from './localeNormalization';

import enCommon from './locales/en/common.json';

const SUPPORTED_LANGS = ['en'] as const;

const resources = {
  en: {
    common: enCommon as Record<string, string>,
  },
};

const isDev = __DEV__;

i18n
  .use(createLanguageDetector())
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LANGS],
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    ...(isDev && {
      saveMissing: false,
      debug: false,
      missingKeyHandler: (_lngs: string[], _ns: string, key: string) => {
        if (isDev && typeof console !== 'undefined') {
          console.warn(`[i18n] missing key: ${key}`);
        }
      },
    }),
  });

export { i18n };

/**
 * Changes app language, persists to AsyncStorage, and updates i18next.
 * Validates against supportedLngs; if invalid, does not change.
 * Use this instead of ad-hoc i18n.changeLanguage().
 * When supportedLngs is true (i18next "all languages"), any normalized locale is allowed.
 */
export async function setAppLanguage(locale: string): Promise<void> {
  const normalized = normalizeLocale(locale);
  if (normalized === '') {
    return;
  }
  const supported = i18n.options.supportedLngs ?? SUPPORTED_LANGS;
  const list = Array.isArray(supported)
    ? supported
    : supported === true
      ? []
      : [supported];
  const isAllowed = list.length === 0 || list.includes(normalized);
  if (!isAllowed) {
    return;
  }
  await setStoredLanguage(normalized);
  await i18n.changeLanguage(normalized);
}
