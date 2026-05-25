#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const INITIAL_RELEASE_VERSION = '1.0.0';
const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function parseMarketingVersion(version) {
  if (typeof version !== 'string' || !VERSION_PATTERN.test(version.trim())) {
    throw new Error(
      `Invalid store marketing version "${version}". Expected MAJOR.MINOR.PATCH with numeric parts.`,
    );
  }

  return version
    .trim()
    .split('.')
    .map((part) => Number.parseInt(part, 10));
}

function compareMarketingVersions(left, right) {
  const leftParts = parseMarketingVersion(left);
  const rightParts = parseMarketingVersion(right);

  for (let index = 0; index < leftParts.length; index += 1) {
    if (leftParts[index] > rightParts[index]) return 1;
    if (leftParts[index] < rightParts[index]) return -1;
  }

  return 0;
}

function validateStoreReleaseVersion({ version, currentStoreVersion } = {}) {
  const normalizedVersion = typeof version === 'string' ? version.trim() : '';
  parseMarketingVersion(normalizedVersion);

  if (normalizedVersion === INITIAL_RELEASE_VERSION) {
    throw new Error(
      'version.json is still 1.0.0. Bump the store marketing version before uploading a production TestFlight/App Store build.',
    );
  }

  const normalizedCurrentStoreVersion =
    typeof currentStoreVersion === 'string' && currentStoreVersion.trim()
      ? currentStoreVersion.trim()
      : null;

  if (normalizedCurrentStoreVersion) {
    parseMarketingVersion(normalizedCurrentStoreVersion);
    if (compareMarketingVersions(normalizedVersion, normalizedCurrentStoreVersion) <= 0) {
      throw new Error(
        `Store release version ${normalizedVersion} must be greater than current store version ${normalizedCurrentStoreVersion}. Bump version.json before uploading.`,
      );
    }
  }

  return {
    version: normalizedVersion,
    currentStoreVersion: normalizedCurrentStoreVersion,
  };
}

function readRepoVersion(repoRoot = path.resolve(__dirname, '..', '..')) {
  const versionJsonPath = path.join(repoRoot, 'version.json');
  const versionData = JSON.parse(fs.readFileSync(versionJsonPath, 'utf8'));
  return versionData.version;
}

function main() {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const version = process.env.STORE_RELEASE_VERSION || readRepoVersion(repoRoot);
  const currentStoreVersion = process.env.STORE_CURRENT_VERSION || process.env.IOS_CURRENT_STORE_VERSION;
  const result = validateStoreReleaseVersion({ version, currentStoreVersion });

  if (result.currentStoreVersion) {
    console.log(
      `Store release version ${result.version} is greater than current store version ${result.currentStoreVersion}.`,
    );
  } else {
    console.log(`Store release version ${result.version} passed static validation.`);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  compareMarketingVersions,
  parseMarketingVersion,
  readRepoVersion,
  validateStoreReleaseVersion,
};
