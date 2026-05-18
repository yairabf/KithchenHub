import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  DEFAULT_STORE_URLS,
  STORE_URL_ENV_KEYS,
  getPublicStoreUrls,
} = require('./store-links.cjs');

describe('getPublicStoreUrls', () => {
  it('uses default live store URLs when Vercel env vars are unset', () => {
    assert.deepEqual(getPublicStoreUrls({}), DEFAULT_STORE_URLS);
  });

  it('accepts HTTPS URLs from the expected App Store and Google Play hosts', () => {
    const urls = getPublicStoreUrls({
      [STORE_URL_ENV_KEYS.appStore]: 'https://apps.apple.com/us/app/example/id123',
      [STORE_URL_ENV_KEYS.googlePlay]: 'https://play.google.com/store/apps/details?id=com.example.app',
    });

    assert.equal(urls.appStore, 'https://apps.apple.com/us/app/example/id123');
    assert.equal(urls.googlePlay, 'https://play.google.com/store/apps/details?id=com.example.app');
  });

  it('rejects non-HTTPS and unexpected-host store URLs', () => {
    assert.throws(
      () => getPublicStoreUrls({ [STORE_URL_ENV_KEYS.appStore]: 'http://apps.apple.com/us/app/example/id123' }),
      /must use https:/,
    );

    assert.throws(
      () => getPublicStoreUrls({ [STORE_URL_ENV_KEYS.googlePlay]: 'https://evil.example/store/apps/details?id=com.example.app' }),
      /must use host play\.google\.com/,
    );
  });
});
