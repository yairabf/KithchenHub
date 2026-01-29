/**
 * Unit tests for EAS config validation (validate-eas-config.js).
 * Validates develop/main channel rules, preview internal distribution, Android APK,
 * production store distribution and Android app-bundle, and other EAS requirements.
 */

const { validateEasConfig } = require('../validate-eas-config');

const validConfig = {
  cli: { appVersionSource: 'remote' },
  build: {
    preview: { distribution: 'internal', channel: 'develop', android: { buildType: 'apk' } },
    production: {
      distribution: 'store',
      channel: 'main',
      autoIncrement: true,
      android: { buildType: 'app-bundle' },
    },
  },
};

describe('validateEasConfig', () => {
  it('returns valid: true for correct config with develop and main channels', () => {
    const result = validateEasConfig(validConfig);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  describe.each([
    [
      'missing appVersionSource',
      { build: validConfig.build },
      'cli.appVersionSource',
    ],
    [
      'appVersionSource not remote',
      { cli: { appVersionSource: 'local' }, build: validConfig.build },
      'remote',
    ],
    [
      'production autoIncrement false',
      {
        cli: validConfig.cli,
        build: { ...validConfig.build, production: { ...validConfig.build.production, autoIncrement: false } },
      },
      'autoIncrement',
    ],
    [
      'preview channel not develop',
      {
        cli: validConfig.cli,
        build: { ...validConfig.build, preview: { ...validConfig.build.preview, channel: 'preview' } },
      },
      'develop',
    ],
    [
      'production channel not main',
      {
        cli: validConfig.cli,
        build: { ...validConfig.build, production: { ...validConfig.build.production, channel: 'production' } },
      },
      'main',
    ],
    [
      'preview channel missing',
      {
        cli: validConfig.cli,
        build: { ...validConfig.build, preview: { distribution: 'internal' } },
      },
      'develop',
    ],
    [
      'preview distribution not internal',
      {
        cli: validConfig.cli,
        build: { ...validConfig.build, preview: { ...validConfig.build.preview, distribution: 'store' } },
      },
      'internal',
    ],
    [
      'preview android buildType not apk',
      {
        cli: validConfig.cli,
        build: {
          ...validConfig.build,
          preview: { ...validConfig.build.preview, android: { buildType: 'app-bundle' } },
        },
      },
      'apk',
    ],
    [
      'preview android missing',
      {
        cli: validConfig.cli,
        build: {
          ...validConfig.build,
          preview: { distribution: 'internal', channel: 'develop' },
        },
      },
      'apk',
    ],
    [
      'production channel missing',
      {
        cli: validConfig.cli,
        build: { ...validConfig.build, production: { distribution: 'store', autoIncrement: true, android: { buildType: 'app-bundle' } } },
      },
      'main',
    ],
    [
      'production distribution not store',
      {
        cli: validConfig.cli,
        build: { ...validConfig.build, production: { ...validConfig.build.production, distribution: 'internal' } },
      },
      'store',
    ],
    [
      'production android buildType not app-bundle',
      {
        cli: validConfig.cli,
        build: {
          ...validConfig.build,
          production: { ...validConfig.build.production, android: { buildType: 'apk' } },
        },
      },
      'app-bundle',
    ],
    [
      'production android missing',
      {
        cli: validConfig.cli,
        build: {
          ...validConfig.build,
          production: { distribution: 'store', channel: 'main', autoIncrement: true },
        },
      },
      'app-bundle',
    ],
    [
      'empty config',
      {},
      'remote',
    ],
    [
      'null/undefined build',
      { cli: { appVersionSource: 'remote' } },
      'autoIncrement',
    ],
  ])('invalid config: %s', (_, config, expectedErrorFragment) => {
    it('returns valid: false with error message', () => {
      const result = validateEasConfig(config);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
      expect(result.error.length).toBeGreaterThan(0);
      expect(result.error).toContain(expectedErrorFragment);
    });
  });
});
