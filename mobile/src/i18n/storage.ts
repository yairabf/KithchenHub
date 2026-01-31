/**
 * i18n language persistence and app language helper.
 * Uses AsyncStorage under @kitchen_hub_language for user preference.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LANGUAGE_STORAGE_KEY = '@kitchen_hub_language';

/**
 * Reads the stored language code from AsyncStorage.
 * @returns Stored language code or null if none
 */
export async function getStoredLanguage(): Promise<string | null> {
  const raw = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (raw == null || raw === '') {
    return null;
  }
  return raw.trim();
}

/**
 * Persists the language code to AsyncStorage.
 * @param lng - Language code to store (e.g. en, es, he)
 */
export async function setStoredLanguage(lng: string): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng.trim());
}
