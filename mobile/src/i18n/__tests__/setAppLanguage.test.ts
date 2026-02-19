/**
 * Tests for setAppLanguage: normalization, supportedLngs validation, persistence, and i18next update.
 */
import { setStoredLanguage } from '../storage';
import { setAppLanguage, i18n } from '../index';

jest.mock('../storage', () => ({
  getStoredLanguage: jest.fn().mockResolvedValue(null),
  setStoredLanguage: jest.fn().mockResolvedValue(undefined),
  LANGUAGE_STORAGE_KEY: '@kitchen_hub_language',
}));

jest.mock('../localize', () => ({
  getLocales: jest.fn().mockReturnValue([]),
}));

const mockSetStoredLanguage = setStoredLanguage as jest.MockedFunction<
  typeof setStoredLanguage
>;

describe('setAppLanguage', () => {
  const originalSupportedLngs = i18n.options.supportedLngs;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetStoredLanguage.mockResolvedValue(undefined);
    i18n.options.supportedLngs = ['en'];
  });

  afterEach(() => {
    i18n.options.supportedLngs = originalSupportedLngs;
  });

  describe.each([
    ['valid locale en', 'en', true],
    ['valid locale en-US (normalized to en)', 'en-US', true],
    ['valid locale en_US (normalized to en)', 'en_US', true],
    ['empty string', '', false],
    ['unsupported locale when only en allowed', 'zz', false],
    ['invalid locale when only en allowed', 'invalid', false],
  ] as const)('%s', (_label, locale, shouldUpdate) => {
    it(shouldUpdate ? 'persists and changes language' : 'does not persist or change language', async () => {
      const changeLanguageSpy = jest.spyOn(i18n, 'changeLanguage').mockResolvedValue(undefined as never);

      await setAppLanguage(locale);

      if (shouldUpdate) {
        expect(mockSetStoredLanguage).toHaveBeenCalledWith('en');
        expect(changeLanguageSpy).toHaveBeenCalledWith('en');
      } else {
        expect(mockSetStoredLanguage).not.toHaveBeenCalled();
        expect(changeLanguageSpy).not.toHaveBeenCalled();
      }

      changeLanguageSpy.mockRestore();
    });
  });

  describe('supportedLngs validation', () => {
    it('calls setStoredLanguage and changeLanguage when locale is in supportedLngs array', async () => {
      i18n.options.supportedLngs = ['en', 'es', 'he'];
      const changeLanguageSpy = jest.spyOn(i18n, 'changeLanguage').mockResolvedValue(undefined as never);

      await setAppLanguage('es');

      expect(mockSetStoredLanguage).toHaveBeenCalledWith('es');
      expect(changeLanguageSpy).toHaveBeenCalledWith('es');
      changeLanguageSpy.mockRestore();
    });

    it('allows any normalized locale when supportedLngs is true', async () => {
      i18n.options.supportedLngs = true as unknown as readonly string[];
      const changeLanguageSpy = jest.spyOn(i18n, 'changeLanguage').mockResolvedValue(undefined as never);

      await setAppLanguage('fr');

      expect(mockSetStoredLanguage).toHaveBeenCalledWith('fr');
      expect(changeLanguageSpy).toHaveBeenCalledWith('fr');
      changeLanguageSpy.mockRestore();
    });

    it('changes language even when persistence fails', async () => {
      const changeLanguageSpy = jest.spyOn(i18n, 'changeLanguage').mockResolvedValue(undefined as never);
      mockSetStoredLanguage.mockRejectedValueOnce(new Error('storage unavailable'));

      await expect(setAppLanguage('en')).resolves.toBeUndefined();

      expect(changeLanguageSpy).toHaveBeenCalledWith('en');
      expect(mockSetStoredLanguage).toHaveBeenCalledWith('en');
      changeLanguageSpy.mockRestore();
    });
  });
});
