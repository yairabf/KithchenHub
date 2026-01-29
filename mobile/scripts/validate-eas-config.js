/**
 * Validates mobile/eas.json for EAS Build and OTA channel requirements.
 * Used by verify-eas-config.sh and by unit tests.
 *
 * Requirements:
 * - cli.appVersionSource === "remote"
 * - build.production.autoIncrement === true
 * - build.preview.channel === "develop"
 * - build.production.channel === "main"
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
  if (config.build?.preview?.channel !== 'develop') {
    return {
      valid: false,
      error:
        'Error: eas.json must set build.preview.channel to "develop" for staging/testing OTA updates.',
    };
  }
  if (config.build?.production?.channel !== 'main') {
    return {
      valid: false,
      error:
        'Error: eas.json must set build.production.channel to "main" for production OTA updates.',
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
    'EAS config OK: cli.appVersionSource is remote; build.production.autoIncrement is true; channels develop (preview) and main (production)'
  );
  process.exit(0);
}

// Run when executed directly (node validate-eas-config.js [path])
if (require.main === module) {
  runFromCli(process.argv[2]);
}

module.exports = { validateEasConfig, runFromCli };
