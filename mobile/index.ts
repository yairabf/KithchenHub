import { I18nManager } from 'react-native';
import { getLocales } from 'react-native-localize';
import { registerRootComponent } from 'expo';

import { getStoredLanguage } from './src/i18n/storage';
import { normalizeLocale } from './src/i18n/localeNormalization';
import { isRtlLanguage } from './src/i18n/rtl';

import App from './App';

async function bootstrap(): Promise<void> {
  const stored = await getStoredLanguage();
  const deviceLocale = getLocales()[0]?.languageTag ?? null;
  const locale = stored ?? deviceLocale ?? 'en';
  const normalized = normalizeLocale(locale);
  const initialLocale = normalized !== '' ? normalized : 'en';

  const isRTL = isRtlLanguage(initialLocale);
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(isRTL);

  await import('./src/i18n');
  registerRootComponent(App);
}

bootstrap().catch(async (err) => {
  if (typeof console !== 'undefined' && console.warn) {
    console.warn('[bootstrap] RTL/locale init failed, falling back to default i18n', err);
  }
  await import('./src/i18n');
  registerRootComponent(App);
});
