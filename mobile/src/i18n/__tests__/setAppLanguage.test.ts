/**
 * Tests for setAppLanguage: normalization, supportedLngs validation, persistence, changeLanguage, and RTL restart.
 */
import { setStoredLanguage } from '../storage';
import { setAppLanguage, i18n } from '../index';

jest.mock('../storage', () => ({
  getStoredLanguage: jest.fn().mockResolvedValue(null),
  setStoredLanguage: jest.fn().mockResolvedValue(undefined),
  LANGUAGE_STORAGE_KEY: '@kitchen_hub_language',
}));

jest.mock('react-native-localize', () => ({
  getLocales: jest.fn().mockReturnValue([]),
}));

/**
 * Minimal react-native mock to avoid loading native modules (e.g. TurboModuleRegistry).
 * __testSetIsRTL simulates the current RTL state for RTL-direction-change tests.
 */
jest.mock('react-native', () => {
  const rtlState = { isRTL: false };
  return {
    Alert: { alert: jest.fn() },
    I18nManager: {
      forceRTL: jest.fn(),
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

jest.mock('expo-updates', () => ({
  reloadAsync: jest.fn(),
}));

const mockSetStoredLanguage = setStoredLanguage as jest.MockedFunction<
  typeof setStoredLanguage
>;

/** Returns the mocked react-native module for assertions on I18nManager and Alert. */
const getRN = () => require('react-native') as {
  I18nManager: { forceRTL: jest.Mock; __testSetIsRTL: (v: boolean) => void };
  Alert: { alert: jest.Mock };
};

describe('setAppLanguage', () => {
  const originalSupportedLngs = i18n.options.supportedLngs;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetStoredLanguage.mockResolvedValue(undefined);
    const Updates = require('expo-updates') as { reloadAsync: jest.Mock };
    Updates.reloadAsync.mockResolvedValue(undefined);
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

  describe('RTL direction change and restart', () => {
    beforeEach(() => {
      i18n.options.supportedLngs = ['en', 'he', 'ar', 'es'];
    });

    it('calls forceRTL(true) and reloadAsync when switching from en to he', async () => {
      const RN = getRN();
      const changeLanguageSpy = jest.spyOn(i18n, 'changeLanguage').mockResolvedValue(undefined as never);

      await setAppLanguage('he');

      expect(mockSetStoredLanguage).toHaveBeenCalledWith('he');
      expect(changeLanguageSpy).toHaveBeenCalledWith('he');
      expect(RN.I18nManager.forceRTL).toHaveBeenCalledWith(true);
      const Updates = require('expo-updates') as { reloadAsync: jest.Mock };
      expect(Updates.reloadAsync).toHaveBeenCalled();
      changeLanguageSpy.mockRestore();
    });

    it('calls forceRTL(false) and reloadAsync when switching from he to en', async () => {
      const RN = getRN();
      RN.I18nManager.__testSetIsRTL(true);
      const changeLanguageSpy = jest.spyOn(i18n, 'changeLanguage').mockResolvedValue(undefined as never);

      await setAppLanguage('en');

      expect(mockSetStoredLanguage).toHaveBeenCalledWith('en');
      expect(changeLanguageSpy).toHaveBeenCalledWith('en');
      expect(RN.I18nManager.forceRTL).toHaveBeenCalledWith(false);
      const Updates = require('expo-updates') as { reloadAsync: jest.Mock };
      expect(Updates.reloadAsync).toHaveBeenCalled();
      changeLanguageSpy.mockRestore();
    });

    it('does not call forceRTL or reloadAsync when switching between LTR languages (en to es)', async () => {
      const RN = getRN();
      const changeLanguageSpy = jest.spyOn(i18n, 'changeLanguage').mockResolvedValue(undefined as never);

      await setAppLanguage('es');

      expect(mockSetStoredLanguage).toHaveBeenCalledWith('es');
      expect(changeLanguageSpy).toHaveBeenCalledWith('es');
      expect(RN.I18nManager.forceRTL).not.toHaveBeenCalled();
      const Updates = require('expo-updates') as { reloadAsync: jest.Mock };
      expect(Updates.reloadAsync).not.toHaveBeenCalled();
      changeLanguageSpy.mockRestore();
    });

    it('shows Alert when reloadAsync fails', async () => {
      const RN = getRN();
      const Updates = require('expo-updates') as { reloadAsync: jest.Mock };
      Updates.reloadAsync.mockRejectedValueOnce(new Error('Reload failed'));
      const changeLanguageSpy = jest.spyOn(i18n, 'changeLanguage').mockResolvedValue(undefined as never);

      await setAppLanguage('he');

      expect(RN.I18nManager.forceRTL).toHaveBeenCalledWith(true);
      expect(Updates.reloadAsync).toHaveBeenCalled();
      expect(RN.Alert.alert).toHaveBeenCalledWith(
        'Direction Changed',
        'Please restart the app to apply the new text direction.',
        [{ text: 'OK' }],
      );
      changeLanguageSpy.mockRestore();
    });
  });
});
