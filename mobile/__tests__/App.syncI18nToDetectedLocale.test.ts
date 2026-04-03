/**
 * Tests for syncI18nToDetectedLocale and its helpers (App.tsx bootstrap utility).
 *
 * Verifies that the helper:
 * - Forces i18n to the already-detected locale before the app renders
 * - Validates the locale against i18n's supportedLngs before applying it
 * - Falls back to fallbackLng when the detected locale is unsupported
 * - Is a no-op when i18n.language already matches the resolved locale
 */

import {
  syncI18nToDetectedLocale,
  resolveFallbackLng,
  resolveSupportedLocale,
} from '../src/i18n/syncI18nToDetectedLocale';
import type { I18nInstance, FallbackLngConfig } from '../src/i18n/syncI18nToDetectedLocale';

const SUPPORTED_LANGS = ['en', 'he', 'ar'] as const;

function makeMockI18n(
  currentLanguage: string,
  options: I18nInstance['options'] = {
    supportedLngs: SUPPORTED_LANGS,
    fallbackLng: 'en',
  },
): I18nInstance & { changeLanguage: jest.Mock } {
  return {
    language: currentLanguage,
    options,
    changeLanguage: jest.fn().mockResolvedValue(undefined),
  };
}

// ---------------------------------------------------------------------------
// resolveFallbackLng
// ---------------------------------------------------------------------------

describe('resolveFallbackLng', () => {
  describe.each([
    ['string "en"', 'en', 'en'],
    ['string "he"', 'he', 'he'],
    ['array ["en", "he"]', ['en', 'he'], 'en'],
    ['array ["he"]', ['he'], 'he'],
    ['false', false as false, 'en'],
    ['undefined', undefined as undefined, 'en'],
    ['empty string', '' as FallbackLngConfig, 'en'],
    ['empty array', [] as FallbackLngConfig, 'en'],
    ['object map (FallbackLngObjList)', { de: ['en'] } as FallbackLngConfig, 'en'],
    ['function shape → en', (() => 'he') as FallbackLngConfig, 'en'],
  ])('with %s', (_label, input, expected) => {
    it(`returns '${expected}'`, () => {
      expect(resolveFallbackLng(input)).toBe(expected);
    });
  });
});

// ---------------------------------------------------------------------------
// resolveSupportedLocale
// ---------------------------------------------------------------------------

describe('resolveSupportedLocale', () => {
  describe.each([
    // [description, locale, supportedLngs, fallbackLng, expected]
    ['supported locale he', 'he', SUPPORTED_LANGS, 'en', 'he'],
    ['supported locale ar', 'ar', SUPPORTED_LANGS, 'en', 'ar'],
    ['supported locale en', 'en', SUPPORTED_LANGS, 'en', 'en'],
    ['unsupported locale fr → fallback en', 'fr', SUPPORTED_LANGS, 'en', 'en'],
    ['unsupported locale de → fallback en', 'de', SUPPORTED_LANGS, 'en', 'en'],
    ['unsupported locale ja → fallback he', 'ja', SUPPORTED_LANGS, 'he', 'he'],
    ['supportedLngs false (allow all) → accepts fr', 'fr', false, 'en', 'fr'],
    ['supportedLngs null (allow all) → accepts fr', 'fr', null, 'en', 'fr'],
    ['empty locale → fallback en', '', SUPPORTED_LANGS, 'en', 'en'],
    ['empty locale, supportedLngs false → fallback en', '', false, 'en', 'en'],
  ])(
    '%s',
    (_label, locale, supportedLngs, fallbackLng, expected) => {
      it(`returns '${expected}'`, () => {
        const result = resolveSupportedLocale(locale, {
          supportedLngs: supportedLngs as I18nInstance['options']['supportedLngs'],
          fallbackLng,
        });
        expect(result).toBe(expected);
      });
    },
  );
});

// ---------------------------------------------------------------------------
// syncI18nToDetectedLocale
// ---------------------------------------------------------------------------

describe('syncI18nToDetectedLocale', () => {
  describe.each([
    // [description, currentLang, detectedLocale, supportedLngs, fallbackLng, shouldCallChangeLanguage, expectedArg]
    ['fallback en → detected he (supported)', 'en', 'he', SUPPORTED_LANGS, 'en', true, 'he'],
    ['fallback en → detected ar (supported)', 'en', 'ar', SUPPORTED_LANGS, 'en', true, 'ar'],
    ['already on he, detected he (no-op)', 'he', 'he', SUPPORTED_LANGS, 'en', false, undefined],
    ['already on en, detected en (no-op)', 'en', 'en', SUPPORTED_LANGS, 'en', false, undefined],
    ['detected fr (unsupported) → fallback en (no-op, already en)', 'en', 'fr', SUPPORTED_LANGS, 'en', false, undefined],
    ['detected fr (unsupported) → fallback en, was he', 'he', 'fr', SUPPORTED_LANGS, 'en', true, 'en'],
    ['detected fr, supportedLngs false → applies fr', 'en', 'fr', false, 'en', true, 'fr'],
  ])(
    '%s',
    (_label, currentLang, detectedLocale, supportedLngs, fallbackLng, shouldCallChangeLanguage, expectedArg) => {
      it(
        shouldCallChangeLanguage
          ? `calls changeLanguage('${expectedArg}')`
          : 'does not call changeLanguage',
        async () => {
          const mockI18n = makeMockI18n(currentLang, {
            supportedLngs: supportedLngs as I18nInstance['options']['supportedLngs'],
            fallbackLng,
          });

          await syncI18nToDetectedLocale(mockI18n, detectedLocale);

          if (shouldCallChangeLanguage) {
            expect(mockI18n.changeLanguage).toHaveBeenCalledTimes(1);
            expect(mockI18n.changeLanguage).toHaveBeenCalledWith(expectedArg);
          } else {
            expect(mockI18n.changeLanguage).not.toHaveBeenCalled();
          }
        },
      );
    },
  );

  it('awaits changeLanguage before resolving', async () => {
    let resolved = false;
    const mockI18n = makeMockI18n('en');
    mockI18n.changeLanguage.mockImplementation(
      () => new Promise<void>((resolve) => setTimeout(() => { resolved = true; resolve(); }, 10)),
    );

    const promise = syncI18nToDetectedLocale(mockI18n, 'he');
    expect(resolved).toBe(false);
    await promise;
    expect(resolved).toBe(true);
  });
});
