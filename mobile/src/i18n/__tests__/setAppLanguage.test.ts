/**
 * Tests for setAppLanguage: normalization, supportedLngs validation, persistence,
 * language update, and RTL direction updates without reload.
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

jest.mock('react-native', () => {
  const rtlState = { isRTL: false };
  return {
    I18nManager: {
      forceRTL: jest.fn(),
      swapLeftAndRightInRTL: jest.fn(),
      get isRTL() {
        return rtlState.isRTL;
      },
      allowRTL: jest.fn(),
      __testSetIsRTL: (v: boolean) => {
        rtlState.isRTL = v;
      },
    },
  };
});

const mockSetStoredLanguage = setStoredLanguage as jest.MockedFunction<typeof setStoredLanguage>;

const getRN = () => require('react-native') as {
  I18nManager: { forceRTL: jest.Mock; swapLeftAndRightInRTL: jest.Mock; __testSetIsRTL: (v: boolean) => void };
};

describe('setAppLanguage', () => {
  const originalSupportedLngs = i18n.options.supportedLngs;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetStoredLanguage.mockResolvedValue(undefined);
    getRN().I18nManager.__testSetIsRTL(false);
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
      i18n.options.supportedLngs = true;
      const changeLanguageSpy = jest.spyOn(i18n, 'changeLanguage').mockResolvedValue(undefined as never);

      await setAppLanguage('fr');

      expect(mockSetStoredLanguage).toHaveBeenCalledWith('fr');
      expect(changeLanguageSpy).toHaveBeenCalledWith('fr');
      changeLanguageSpy.mockRestore();
    });
  });

  describe('RTL direction change', () => {
    beforeEach(() => {
      i18n.options.supportedLngs = ['en', 'he', 'ar', 'es'];
    });

    it('calls forceRTL(true) when switching from en to he', async () => {
      const RN = getRN();
      const changeLanguageSpy = jest.spyOn(i18n, 'changeLanguage').mockResolvedValue(undefined as never);

      await setAppLanguage('he');

      expect(mockSetStoredLanguage).toHaveBeenCalledWith('he');
      expect(changeLanguageSpy).toHaveBeenCalledWith('he');
      expect(RN.I18nManager.forceRTL).toHaveBeenCalledWith(true);
      changeLanguageSpy.mockRestore();
    });

    it('calls forceRTL(false) when switching from he to en', async () => {
      const RN = getRN();
      RN.I18nManager.__testSetIsRTL(true);
      const changeLanguageSpy = jest.spyOn(i18n, 'changeLanguage').mockResolvedValue(undefined as never);

      await setAppLanguage('en');

      expect(mockSetStoredLanguage).toHaveBeenCalledWith('en');
      expect(changeLanguageSpy).toHaveBeenCalledWith('en');
      expect(RN.I18nManager.forceRTL).toHaveBeenCalledWith(false);
      changeLanguageSpy.mockRestore();
    });

    it('does not call forceRTL when switching between LTR languages (en to es)', async () => {
      const RN = getRN();
      const changeLanguageSpy = jest.spyOn(i18n, 'changeLanguage').mockResolvedValue(undefined as never);

      await setAppLanguage('es');

      expect(mockSetStoredLanguage).toHaveBeenCalledWith('es');
      expect(changeLanguageSpy).toHaveBeenCalledWith('es');
      expect(RN.I18nManager.forceRTL).not.toHaveBeenCalled();
      changeLanguageSpy.mockRestore();
    });
  });
});
