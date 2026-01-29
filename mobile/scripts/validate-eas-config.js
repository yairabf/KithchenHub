/**
 * Validates mobile/eas.json for EAS Build and OTA channel requirements.
 * Used by verify-eas-config.sh and by unit tests.
 *
 * Requirements:
 * - cli.appVersionSource === "remote"
 * - build.production.autoIncrement === true
 * - build.production.distribution === "store"
 * - build.production.channel === "main"
 * - build.production.android.buildType === "app-bundle"
 * - build.preview.channel === "develop"
 * - build.preview.distribution === "internal"
 * - build.preview.android.buildType === "apk"
 *
 * @param {object} config - Parsed eas.json object
 * @returns {{ valid: boolean, error?: string }} Result; if valid is false, error contains the message
 */
function validateEasConfig(config) {
  if (config.cli?.appVersionSource !== 'remote') {
    return {
      valid: false,
      error:
        'Error: eas.json must set cli.appVersionSource to "remote" so EAS manages build numbers.',
    };
  }
  if (config.build?.production?.autoIncrement !== true) {
    return {
      valid: false,
      error:
        'Error: eas.json must set build.production.autoIncrement to true to avoid store submission failures from duplicate versionCode/buildNumber.',
    };
  }
  if (config.build?.production?.distribution !== 'store') {
    return {
      valid: false,
      error:
        'Error: eas.json must set build.production.distribution to "store" for App Store and Play Store submissions.',
    };
  }
  if (config.build?.production?.channel !== 'main') {
    return {
      valid: false,
      error:
        'Error: eas.json must set build.production.channel to "main" for production OTA updates.',
    };
  }
  if (config.build?.production?.android?.buildType !== 'app-bundle') {
    return {
      valid: false,
      error:
        'Error: eas.json must set build.production.android.buildType to "app-bundle" for Google Play Store submission.',
    };
  }
  if (config.build?.preview?.channel !== 'develop') {
    return {
      valid: false,
      error:
        'Error: eas.json must set build.preview.channel to "develop" for staging/testing OTA updates.',
    };
  }
  if (config.build?.preview?.distribution !== 'internal') {
    return {
      valid: false,
      error:
        'Error: eas.json must set build.preview.distribution to "internal" for staging/real-device installs.',
    };
  }
  if (config.build?.preview?.android?.buildType !== 'apk') {
    return {
      valid: false,
      error:
        'Error: eas.json must set build.preview.android.buildType to "apk" for direct install on real Android devices.',
    };
  }
  return { valid: true };
}

/**
 * Loads eas.json from path and runs validation. Exits process with 0 or 1.
 * Called by verify-eas-config.sh when run as main script.
 *
 * @param {string} easJsonPath - Path to eas.json
 */
function runFromCli(easJsonPath) {
  const fs = require('fs');
  const path = easJsonPath ?? process.env.EAS_JSON_PATH;

  if (!path || typeof path !== 'string' || !path.trim()) {
    console.error('Error: EAS_JSON_PATH environment variable is not set or path argument is missing.');
    process.exit(1);
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (e) {
    console.error('Error: eas.json is not valid JSON:', e.message);
    process.exit(1);
  }

  const result = validateEasConfig(config);
  if (!result.valid) {
    console.error(result.error);
    process.exit(1);
  }

  console.log(
    'EAS config OK: cli.appVersionSource is remote; production store distribution and Android app-bundle; production autoIncrement; preview internal distribution and Android APK; channels develop (preview) and main (production)'
  );
  process.exit(0);
}

// Run when executed directly (node validate-eas-config.js [path])
if (require.main === module) {
  runFromCli(process.argv[2]);
}

module.exports = { validateEasConfig, runFromCli };
