import * as Linking from 'expo-linking';

/**
 * Opens a legal document URL (e.g. privacy policy, terms) in the device browser.
 * Catches and logs failures; does not throw. Use for in-app legal links.
 *
 * @param url - Full URL to open (e.g. PRIVACY_POLICY_URL).
 */
export async function openLegalUrl(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch (e) {
    if (__DEV__ && typeof console !== 'undefined' && console.warn) {
      console.warn('[Legal] Failed to open URL:', url, e);
    }
  }
}
