import {
  CURRENT_API_VERSION,
  SUPPORTED_API_VERSIONS,
  DEPRECATED_API_VERSIONS,
  SUNSET_API_VERSIONS,
} from './api-version.constants';

/**
 * Version status types
 */
export type VersionStatus = 'current' | 'deprecated' | 'sunset';

/**
 * Metadata for an API version
 */
export interface VersionMetadata {
  version: string;
  status: VersionStatus;
  deprecatedAt?: Date;
  sunsetAt?: Date;
  migrationGuide?: string;
}

/**
 * Checks if a version is supported (not sunset)
 */
export function isVersionSupported(version: string): boolean {
  return SUPPORTED_API_VERSIONS.includes(version);
}

/**
 * Checks if a version is deprecated
 */
export function isVersionDeprecated(version: string): boolean {
  return DEPRECATED_API_VERSIONS.includes(version);
}

/**
 * Checks if a version is sunset (no longer available)
 */
export function isVersionSunset(version: string): boolean {
  return SUNSET_API_VERSIONS.includes(version);
}

/**
 * Gets metadata for a specific version
 */
export function getVersionMetadata(version: string): VersionMetadata | null {
  if (isVersionSunset(version)) {
    return {
      version,
      status: 'sunset',
    };
  }

  if (isVersionDeprecated(version)) {
    return {
      version,
      status: 'deprecated',
      // TODO: Add actual deprecation dates when versions are deprecated
      // deprecatedAt: new Date('2026-07-01'),
      // migrationGuide: 'https://docs.kitchenhub.com/api/migration/v1-to-v2',
    };
  }

  if (version === CURRENT_API_VERSION) {
    return {
      version,
      status: 'current',
    };
  }

  return null;
}

/**
 * Gets all version metadata
 */
export function getAllVersionMetadata(): VersionMetadata[] {
  const allVersions = [
    ...SUPPORTED_API_VERSIONS,
    ...DEPRECATED_API_VERSIONS,
    ...SUNSET_API_VERSIONS,
  ];

  return allVersions
    .map((version) => getVersionMetadata(version))
    .filter((metadata): metadata is VersionMetadata => metadata !== null);
}
