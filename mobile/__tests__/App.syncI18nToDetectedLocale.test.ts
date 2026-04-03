/**
 * Tests for syncI18nToDetectedLocale (App.tsx bootstrap helper).
 *
 * Verifies that the helper correctly forces i18n to the already-detected locale
 * before the app renders, preventing API calls from using the 'en' fallback while
 * the async language detector is still pending.
 */

import { syncI18nToDetectedLocale } from '../src/i18n/syncI18nToDetectedLocale';

function makeMockI18n(currentLanguage: string) {
  return {
    language: currentLanguage,
    changeLanguage: jest.fn().mockResolvedValue(undefined),
  };
}

describe('syncI18nToDetectedLocale', () => {
  describe.each([
    ['i18n on fallback en, detected he', 'en', 'he', true, 'he'],
    ['i18n on fallback en, detected ar', 'en', 'ar', true, 'ar'],
    ['i18n already matches detected he', 'he', 'he', false, undefined],
    ['i18n already matches detected en', 'en', 'en', false, undefined],
    ['i18n on fallback en, detected en (no-op)', 'en', 'en', false, undefined],
    ['i18n on he, detected ar (language switch)', 'he', 'ar', true, 'ar'],
  ])(
    '%s',
    (_label, currentLanguage, detectedLocale, shouldCallChangeLanguage, expectedArg) => {
      it(
        shouldCallChangeLanguage
          ? `calls changeLanguage('${expectedArg}')`
          : 'does not call changeLanguage',
        async () => {
          const mockI18n = makeMockI18n(currentLanguage);

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
    const mockI18n = {
      language: 'en',
      changeLanguage: jest.fn().mockImplementation(
        () => new Promise<void>((resolve) => setTimeout(() => { resolved = true; resolve(); }, 10)),
      ),
    };

    const promise = syncI18nToDetectedLocale(mockI18n, 'he');
    expect(resolved).toBe(false);
    await promise;
    expect(resolved).toBe(true);
  });
});
