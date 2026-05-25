const {
  compareMarketingVersions,
  validateStoreReleaseVersion,
} = require('../store-release-version');

describe('store release version validation', () => {
  it('orders semantic marketing versions numerically', () => {
    expect(compareMarketingVersions('1.0.10', '1.0.2')).toBe(1);
    expect(compareMarketingVersions('1.2.0', '1.10.0')).toBe(-1);
    expect(compareMarketingVersions('2.0.0', '2.0.0')).toBe(0);
  });

  it('rejects the stale initial 1.0.0 release version for store uploads', () => {
    expect(() => validateStoreReleaseVersion({ version: '1.0.0' })).toThrow(
      /version\.json is still 1\.0\.0/,
    );
  });

  it('rejects a version that is not greater than the current store version', () => {
    expect(() =>
      validateStoreReleaseVersion({ version: '1.0.1', currentStoreVersion: '1.0.1' }),
    ).toThrow(/must be greater than current store version 1\.0\.1/);
  });

  it('accepts App Store current versions that omit the patch segment', () => {
    expect(
      validateStoreReleaseVersion({ version: '1.0.1', currentStoreVersion: '1.0' }),
    ).toEqual({ version: '1.0.1', currentStoreVersion: '1.0' });
  });

  it('accepts a patched release version greater than the current store version', () => {
    expect(
      validateStoreReleaseVersion({ version: '1.0.2', currentStoreVersion: '1.0.1' }),
    ).toEqual({ version: '1.0.2', currentStoreVersion: '1.0.1' });
  });
});
