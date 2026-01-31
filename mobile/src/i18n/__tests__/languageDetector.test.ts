/**
 * Tests for i18n language detector (AsyncStorage + react-native-localize, supportedLngs validation).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNLocalize from 'react-native-localize';
import { createLanguageDetector } from '../languageDetector';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-localize', () => ({
  getLocales: jest.fn(),
}));

const mockGetLocales = RNLocalize.getLocales as jest.MockedFunction<
  typeof RNLocalize.getLocales
>;

function detectAsPromise(
  detector: ReturnType<typeof createLanguageDetector>,
  options: { supportedLngs?: string[]; fallbackLng?: string } = {}
): Promise<string> {
  return new Promise((resolve) => {
    detector.init(undefined as never, {
      supportedLngs: options.supportedLngs ?? ['en'],
      fallbackLng: options.fallbackLng ?? 'en',
    });
    detector.detect((lng: string) => resolve(lng));
  });
}

describe('language detector', () => {
  const supportedLngs = ['en', 'es', 'he', 'ar'];

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    mockGetLocales.mockReturnValue([]);
  });

  describe('detection order', () => {
    it('uses stored language when valid and in supportedLngs', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
        key === '@kitchen_hub_language' ? Promise.resolve('es') : Promise.resolve(null)
      );
      const detector = createLanguageDetector();
      const lng = await detectAsPromise(detector, { supportedLngs });
      expect(lng).toBe('es');
      expect(mockGetLocales).not.toHaveBeenCalled();
    });

    it('ignores stored language when not in supportedLngs and falls back to device', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
        key === '@kitchen_hub_language' ? Promise.resolve('zz') : Promise.resolve(null)
      );
      mockGetLocales.mockReturnValue([{ languageTag: 'en-US' } as never]);
      const detector = createLanguageDetector();
      const lng = await detectAsPromise(detector, { supportedLngs });
      expect(lng).toBe('en');
      expect(mockGetLocales).toHaveBeenCalled();
    });

    it('uses device locale when no stored language and device locale is supported', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      mockGetLocales.mockReturnValue([{ languageTag: 'es-ES' } as never]);
      const detector = createLanguageDetector();
      const lng = await detectAsPromise(detector, { supportedLngs });
      expect(lng).toBe('es');
    });

    it('falls back to fallbackLng when no stored language and device locale not supported', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      mockGetLocales.mockReturnValue([{ languageTag: 'ja-JP' } as never]);
      const detector = createLanguageDetector();
      const lng = await detectAsPromise(detector, { supportedLngs });
      expect(lng).toBe('en');
    });

    it('falls back to fallbackLng when no stored language and no device locales', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      mockGetLocales.mockReturnValue([]);
      const detector = createLanguageDetector();
      const lng = await detectAsPromise(detector, { supportedLngs });
      expect(lng).toBe('en');
    });
  });

  describe('locale normalization', () => {
    it('normalizes stored en-US to en', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
        key === '@kitchen_hub_language' ? Promise.resolve('en-US') : Promise.resolve(null)
      );
      const detector = createLanguageDetector();
      const lng = await detectAsPromise(detector, { supportedLngs });
      expect(lng).toBe('en');
    });

    it('normalizes stored en_US to en', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
        key === '@kitchen_hub_language' ? Promise.resolve('en_US') : Promise.resolve(null)
      );
      const detector = createLanguageDetector();
      const lng = await detectAsPromise(detector, { supportedLngs });
      expect(lng).toBe('en');
    });

    it('maps device en-US to en', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      mockGetLocales.mockReturnValue([{ languageTag: 'en-US' } as never]);
      const detector = createLanguageDetector();
      const lng = await detectAsPromise(detector, { supportedLngs });
      expect(lng).toBe('en');
    });
  });

  describe('supportedLngs validation', () => {
    it('ignores invalid stored value and uses device locale', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
        key === '@kitchen_hub_language' ? Promise.resolve('invalid') : Promise.resolve(null)
      );
      mockGetLocales.mockReturnValue([{ languageTag: 'es-ES' } as never]);
      const detector = createLanguageDetector();
      const lng = await detectAsPromise(detector, { supportedLngs });
      expect(lng).toBe('es');
    });

    it('uses fallback when stored value is empty string', async () => {
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
        key === '@kitchen_hub_language' ? Promise.resolve('') : Promise.resolve(null)
      );
      mockGetLocales.mockReturnValue([{ languageTag: 'he-IL' } as never]);
      const detector = createLanguageDetector();
      const lng = await detectAsPromise(detector, { supportedLngs });
      expect(lng).toBe('he');
    });
  });
});
