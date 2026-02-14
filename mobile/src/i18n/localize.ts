/**
 * Platform-specific locale detection for React Native (native platforms).
 * Uses expo-localization for iOS and Android.
 * 
 * Note: Metro bundler will automatically use localize.web.ts on web platforms
 * and this file on native platforms (iOS/Android).
 */
import * as ExpoLocalization from 'expo-localization';

type Locale = {
  languageTag: string;
  languageCode: string;
  isRTL: boolean;
};

/**
 * Returns device locales using expo-localization.
 * Converts expo-localization format to match react-native-localize interface.
 */
export function getLocales(): Locale[] {
  const locales = ExpoLocalization.getLocales();
  
  if (!Array.isArray(locales) || locales.length === 0) {
    return [];
  }
  
  return locales.map((locale) => ({
    languageTag: locale.languageTag || locale.languageCode || 'en',
    languageCode: locale.languageCode || 'en',
    isRTL: locale.textDirection === 'rtl',
  }));
}
