/**
 * i18n configuration for React Native.
 * Uses custom language detector (AsyncStorage + react-native-localize).
 * No browser-based language detection. Rely on detector + fallbackLng; do not hardcode lng.
 */
import { Alert, I18nManager } from 'react-native';
import * as Updates from 'expo-updates';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { createLanguageDetector } from './languageDetector';
import { setStoredLanguage } from './storage';
import { normalizeLocale } from './localeNormalization';
import { SUPPORTED_LANGUAGE_CODES } from './constants';
import { isRtlLanguage } from './rtl';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enShopping from './locales/en/shopping.json';
import enRecipes from './locales/en/recipes.json';
import enChores from './locales/en/chores.json';
import enSettings from './locales/en/settings.json';
import enCategories from './locales/en/categories.json';
import enErrors from './locales/en/errors.json';
import enValidation from './locales/en/validation.json';

import heCommon from './locales/he/common.json';
import heAuth from './locales/he/auth.json';
import heDashboard from './locales/he/dashboard.json';
import heShopping from './locales/he/shopping.json';
import heRecipes from './locales/he/recipes.json';
import heChores from './locales/he/chores.json';
import heSettings from './locales/he/settings.json';
import heCategories from './locales/he/categories.json';
import heErrors from './locales/he/errors.json';
import heValidation from './locales/he/validation.json';

import arCommon from './locales/ar/common.json';
import arAuth from './locales/ar/auth.json';
import arDashboard from './locales/ar/dashboard.json';
import arShopping from './locales/ar/shopping.json';
import arRecipes from './locales/ar/recipes.json';
import arChores from './locales/ar/chores.json';
import arSettings from './locales/ar/settings.json';
import arCategories from './locales/ar/categories.json';
import arErrors from './locales/ar/errors.json';
import arValidation from './locales/ar/validation.json';

/** Type for namespace JSON: nested key-value; i18next accepts Record<string, unknown>. */
type NamespaceResource = Record<string, unknown>;

const resources = {
  en: {
    common: enCommon as NamespaceResource,
    auth: enAuth as NamespaceResource,
    dashboard: enDashboard as NamespaceResource,
    shopping: enShopping as NamespaceResource,
    recipes: enRecipes as NamespaceResource,
    chores: enChores as NamespaceResource,
    settings: enSettings as NamespaceResource,
    categories: enCategories as NamespaceResource,
    errors: enErrors as NamespaceResource,
    validation: enValidation as NamespaceResource,
  },
  he: {
    common: heCommon as NamespaceResource,
    auth: heAuth as NamespaceResource,
    dashboard: heDashboard as NamespaceResource,
    shopping: heShopping as NamespaceResource,
    recipes: heRecipes as NamespaceResource,
    chores: heChores as NamespaceResource,
    settings: heSettings as NamespaceResource,
    categories: heCategories as NamespaceResource,
    errors: heErrors as NamespaceResource,
    validation: heValidation as NamespaceResource,
  },
  ar: {
    common: arCommon as NamespaceResource,
    auth: arAuth as NamespaceResource,
    dashboard: arDashboard as NamespaceResource,
    shopping: arShopping as NamespaceResource,
    recipes: arRecipes as NamespaceResource,
    chores: arChores as NamespaceResource,
    settings: arSettings as NamespaceResource,
    categories: arCategories as NamespaceResource,
    errors: arErrors as NamespaceResource,
    validation: arValidation as NamespaceResource,
  },
};

const isDev = __DEV__;

i18n
  .use(createLanguageDetector())
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: [...SUPPORTED_LANGUAGE_CODES],
    ns: [
      'common',
      'auth',
      'dashboard',
      'shopping',
      'recipes',
      'chores',
      'settings',
      'categories',
      'errors',
      'validation',
    ],
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
      missingKeyHandler: (
        _lngs: readonly string[],
        _ns: string,
        key: string,
        _fallbackValue: string,
        _updateMissing: boolean,
        _options: unknown,
      ) => {
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
  const supported = i18n.options.supportedLngs ?? SUPPORTED_LANGUAGE_CODES;
  // i18next types supportedLngs as (readonly string[] | false); runtime can also be true (allow all).
  const allowAllLngs = (supported as unknown) === true;
  const list = Array.isArray(supported)
    ? supported
    : allowAllLngs
      ? []
      : [supported as unknown as string];
  const isAllowed = list.length === 0 || list.includes(normalized);
  if (!isAllowed) {
    return;
  }
  await setStoredLanguage(normalized);
  await i18n.changeLanguage(normalized);

  const newIsRtl = isRtlLanguage(normalized);
  const currentIsRtl = I18nManager.isRTL;
  if (newIsRtl !== currentIsRtl) {
    I18nManager.forceRTL(newIsRtl);
    try {
      await Updates.reloadAsync();
    } catch {
      Alert.alert(
        'Direction Changed',
        'Please restart the app to apply the new text direction.',
        [{ text: 'OK' }],
      );
    }
  }
}
