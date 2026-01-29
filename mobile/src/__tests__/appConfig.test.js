/**
 * Tests that app.config.js exposes expo.version from version.json (single source of truth).
 * Ensures the merged Expo config has a non-empty version and that it matches repo root version.json.
 */
const path = require('path');
const fs = require('fs');

describe('app.config.js', () => {
  let config;

  beforeAll(() => {
    config = require('../../app.config.js');
  });

  it('exports an expo object', () => {
    expect(config).toBeDefined();
    expect(config.expo).toBeDefined();
  });

  it('sets expo.version from version.json as a non-empty string', () => {
    expect(config.expo.version).toBeDefined();
    expect(typeof config.expo.version).toBe('string');
    expect(config.expo.version.trim()).not.toBe('');
  });

  it('expo.version matches version.json at repo root', () => {
    const versionJsonPath = path.resolve(__dirname, '..', '..', '..', 'version.json');
    expect(fs.existsSync(versionJsonPath)).toBe(true);
    const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
    expect(versionData.version).toBeDefined();
    expect(config.expo.version).toBe(versionData.version);
  });
});
