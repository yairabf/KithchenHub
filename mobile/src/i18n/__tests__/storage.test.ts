/**
 * Tests for i18n language storage (AsyncStorage persistence).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getStoredLanguage,
  setStoredLanguage,
  LANGUAGE_STORAGE_KEY,
} from '../storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('i18n storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('getStoredLanguage', () => {
    describe.each([
      ['nothing stored', null, null],
      ['stored language present', 'es', 'es'],
      ['stored value has whitespace', '  en  ', 'en'],
    ] as const)('when %s', (_label, storageValue, expected) => {
      it(`returns ${expected}`, async () => {
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storageValue);
        const result = await getStoredLanguage();
        expect(result).toBe(expected);
        expect(AsyncStorage.getItem).toHaveBeenCalledWith(LANGUAGE_STORAGE_KEY);
      });
    });
  });

  describe('setStoredLanguage', () => {
    describe.each([
      ['en', 'en'],
      ['es', 'es'],
      ['he', 'he'],
      ['ar', 'ar'],
    ] as const)('with locale %s', (locale, expectedStored) => {
      it(`writes "${expectedStored}" to AsyncStorage under LANGUAGE_STORAGE_KEY`, async () => {
        await setStoredLanguage(locale);
        expect(AsyncStorage.setItem).toHaveBeenCalledWith(
          LANGUAGE_STORAGE_KEY,
          expectedStored
        );
      });
    });
  });
});
