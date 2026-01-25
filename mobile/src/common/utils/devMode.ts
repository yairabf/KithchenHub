/**
 * Development mode detection utility.
 * Separated for easy mocking in tests.
 * 
 * @returns True if the app is running in development mode, false otherwise
 */
export function isDevMode(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__ === true;
}
