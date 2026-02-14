/**
 * i18next language detector for React Native.
 * Detection order: (1) AsyncStorage (normalize + validate against supportedLngs),
 * (2) device locale (expo-localization on native, navigator on web), (3) fallbackLng.
 */
import { getStoredLanguage, setStoredLanguage } from './storage';
import { normalizeLocale } from './localeNormalization';
import { getLocales } from './localize';

type I18nextOptions = {
  supportedLngs?: string[] | false;
  fallbackLng?: string | string[] | false;
} | undefined;

type LanguageDetectorModule = {
  type: 'languageDetector';
  async: true;
  init: (services: unknown, options: I18nextOptions) => void;
  detect: (callback: (lng: string) => void) => void;
  cacheUserLanguage: (lng: string) => void;
};

function getSupportedLngs(options: I18nextOptions): string[] {
  if (options == null) {
    return ['en'];
  }
  const raw = options.supportedLngs;
  if (Array.isArray(raw)) {
    return raw;
  }
  return ['en'];
}

function getFallbackLng(options: I18nextOptions): string {
  if (options == null) {
    return 'en';
  }
  const raw = options.fallbackLng;
  if (typeof raw === 'string') {
    return raw;
  }
  if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string') {
    return raw[0];
  }
  return 'en';
}

function isSupported(normalized: string, supportedLngs: string[]): boolean {
  return supportedLngs.includes(normalized);
}

/** Sentinel: stored language was accepted; do not run device/fallback step. */
const STORED_ACCEPTED = Symbol('stored_accepted');

/**
 * Creates an i18next language detector for React Native.
 * Use with i18next.use(detector).init({ ... }).
 */
export function createLanguageDetector(): LanguageDetectorModule {
  let supportedLngs: string[] = ['en'];
  let fallbackLng = 'en';

  return {
    type: 'languageDetector',
    async: true,

    init(_services: unknown, options?: I18nextOptions): void {
      supportedLngs = getSupportedLngs(options);
      fallbackLng = getFallbackLng(options);
    },

    detect(callback: (lng: string) => void): void {
      const resolve = (lng: string): void => {
        callback(lng);
      };

      getStoredLanguage()
        .then((stored) => {
          if (stored != null && stored.trim() !== '') {
            const normalized = normalizeLocale(stored);
            if (normalized !== '' && isSupported(normalized, supportedLngs)) {
              resolve(normalized);
              return STORED_ACCEPTED;
            }
          }
          return getDeviceLocale();
        })
        .then((value) => {
          if (value === STORED_ACCEPTED) return;
          const deviceLng = value;
          if (deviceLng != null && isSupported(deviceLng, supportedLngs)) {
            resolve(deviceLng);
            return;
          }
          resolve(fallbackLng);
        })
        .catch(() => {
          resolve(fallbackLng);
        });
    },

    cacheUserLanguage(lng: string): void {
      setStoredLanguage(lng).catch((err) => {
        if (__DEV__ && typeof console !== 'undefined') {
          console.warn('[i18n] Failed to cache language:', err);
        }
      });
    },
  };
}

/**
 * Returns the first device locale that normalizes to a language code.
 * Uses getLocales() which handles platform differences internally.
 */
function getDeviceLocale(): Promise<string | null> {
  try {
    const locales = getLocales();
    
    if (!Array.isArray(locales) || locales.length === 0) {
      return Promise.resolve(null);
    }
    
    const first = locales[0];
    const tag = first?.languageTag ?? (first as { languageCode?: string })?.languageCode ?? '';
    if (typeof tag !== 'string' || tag === '') {
      return Promise.resolve(null);
    }
    
    const normalized = normalizeLocale(tag);
    return Promise.resolve(normalized === '' ? null : normalized);
  } catch (error) {
    // Fallback if locale detection fails
    if (__DEV__) {
      console.warn('[i18n] Failed to get device locale:', error);
    }
    return Promise.resolve(null);
  }
}
