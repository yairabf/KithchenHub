/**
 * Tests that app.config.js exposes expo.version from version.json (single source of truth)
 * and expo.updates.url from extra.eas.projectId when set (EAS init).
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

  describe('EAS project ID and updates.url', () => {
    it('sets expo.updates.url from extra.eas.projectId when present', () => {
      const projectId = config.expo?.extra?.eas?.projectId;
      if (typeof projectId !== 'string' || !projectId.trim()) {
        return; // Skip when project not linked (no extra.eas.projectId in app.json)
      }
      expect(config.expo.updates).toBeDefined();
      expect(config.expo.updates.url).toBe(`https://u.expo.dev/${projectId.trim()}`);
    });

    it('expo.extra.eas.projectId is present in merged config when set in app.json', () => {
      const appJson = require('../../app.json');
      const expectedId = appJson.expo?.extra?.eas?.projectId ?? appJson.extra?.eas?.projectId;
      if (expectedId == null) return;
      expect(config.expo.extra?.eas?.projectId).toBe(expectedId);
    });
  });
});
