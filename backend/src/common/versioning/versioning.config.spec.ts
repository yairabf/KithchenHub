import {
  isVersionSupported,
  isVersionDeprecated,
  isVersionSunset,
  getVersionMetadata,
  getAllVersionMetadata,
} from './versioning.config';
import {
  CURRENT_API_VERSION,
  SUPPORTED_API_VERSIONS,
  DEPRECATED_API_VERSIONS,
  SUNSET_API_VERSIONS,
} from './api-version.constants';

describe('Versioning Config', () => {
  describe('isVersionSupported', () => {
    it.each([
      ['1', true],
      ['2', false],
      ['0', false],
      ['invalid', false],
    ])('should return %s for version %s', (version, expected) => {
      expect(isVersionSupported(version)).toBe(expected);
    });

    it('should return true for current API version', () => {
      expect(isVersionSupported(CURRENT_API_VERSION)).toBe(true);
    });

    it('should return true for all supported versions', () => {
      SUPPORTED_API_VERSIONS.forEach((version) => {
        expect(isVersionSupported(version)).toBe(true);
      });
    });
  });

  describe('isVersionDeprecated', () => {
    it.each([
      ['1', false], // Current version is not deprecated
      ['2', false], // Not in deprecated list
      ...DEPRECATED_API_VERSIONS.map((v) => [v, true] as [string, boolean]),
    ])('should return %s for version %s', (version: string, expected: boolean) => {
      expect(isVersionDeprecated(version)).toBe(expected);
    });
  });

  describe('isVersionSunset', () => {
    it.each([
      ['1', false], // Current version is not sunset
      ['2', false], // Not in sunset list
      ...SUNSET_API_VERSIONS.map((v) => [v, true] as [string, boolean]),
    ])('should return %s for version %s', (version: string, expected: boolean) => {
      expect(isVersionSunset(version)).toBe(expected);
    });
  });

  describe('getVersionMetadata', () => {
    it('should return current status for current version', () => {
      const metadata = getVersionMetadata(CURRENT_API_VERSION);
      expect(metadata).not.toBeNull();
      expect(metadata?.status).toBe('current');
      expect(metadata?.version).toBe(CURRENT_API_VERSION);
    });

    it('should return deprecated status for deprecated versions', () => {
      DEPRECATED_API_VERSIONS.forEach((version) => {
        const metadata = getVersionMetadata(version);
        expect(metadata).not.toBeNull();
        expect(metadata?.status).toBe('deprecated');
        expect(metadata?.version).toBe(version);
      });
    });

    it('should return sunset status for sunset versions', () => {
      SUNSET_API_VERSIONS.forEach((version) => {
        const metadata = getVersionMetadata(version);
        expect(metadata).not.toBeNull();
        expect(metadata?.status).toBe('sunset');
        expect(metadata?.version).toBe(version);
      });
    });

    it('should return null for unknown versions', () => {
      expect(getVersionMetadata('999')).toBeNull();
      expect(getVersionMetadata('invalid')).toBeNull();
    });
  });

  describe('getAllVersionMetadata', () => {
    it('should return metadata for all known versions', () => {
      const allMetadata = getAllVersionMetadata();
      const allVersions = [
        ...SUPPORTED_API_VERSIONS,
        ...DEPRECATED_API_VERSIONS,
        ...SUNSET_API_VERSIONS,
      ];

      expect(allMetadata.length).toBeGreaterThan(0);
      expect(allMetadata.length).toBe(allVersions.length);

      allVersions.forEach((version) => {
        const metadata = allMetadata.find((m) => m.version === version);
        expect(metadata).toBeDefined();
        expect(metadata?.version).toBe(version);
      });
    });

    it('should not return null metadata entries', () => {
      const allMetadata = getAllVersionMetadata();
      allMetadata.forEach((metadata) => {
        expect(metadata).not.toBeNull();
        expect(metadata.version).toBeDefined();
        expect(metadata.status).toBeDefined();
      });
    });
  });
});
