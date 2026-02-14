/**
 * Smoke tests for i18n namespace and key resolution.
 * Ensures registered namespaces and keys resolve to expected strings after init.
 */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('../localize', () => ({
  getLocales: jest.fn(() => [{ languageTag: 'en-US' }]),
}));

import { i18n } from '../index';

describe('namespace resolution', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('en');
  });

  it('resolves shopping namespace listPanel.title', () => {
    expect(i18n.t('shopping:listPanel.title')).toBe('Shopping Lists');
  });

  it('resolves shopping plural itemCount with count', () => {
    const singular = i18n.t('shopping:itemCount', { count: 1 });
    const plural = i18n.t('shopping:itemCount', { count: 2 });
    expect(singular).toContain('item');
    expect(plural).toContain('2');
    expect(plural).toContain('items');
  });
});
