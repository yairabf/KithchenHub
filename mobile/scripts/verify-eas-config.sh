#!/usr/bin/env bash
# Verifies that mobile/eas.json has EAS Build config required for store submissions:
# cli.appVersionSource "remote" and build.production.autoIncrement true.
# Exit 0 if all checks pass; exit 1 otherwise.
# Used by npm run verify:eas and can be wired into CI.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="${SCRIPT_DIR}/.."
EAS_JSON="${MOBILE_DIR}/eas.json"

if [[ ! -f "$EAS_JSON" ]]; then
  echo "Error: eas.json not found at $EAS_JSON"
  exit 1
fi

FAILED=0

# Validate JSON and required fields using Node (path via env to avoid interpolation issues)
export EAS_JSON_PATH="$EAS_JSON"
if ! node -e "
  const fs = require('fs');
  const easJsonPath = process.env.EAS_JSON_PATH;
  if (!easJsonPath) {
    console.error('Error: EAS_JSON_PATH environment variable is not set.');
    process.exit(1);
  }
  let config;
  try {
    config = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
  } catch (e) {
    console.error('Error: eas.json is not valid JSON:', e.message);
    process.exit(1);
  }
  if (config.cli?.appVersionSource !== 'remote') {
    console.error('Error: eas.json must set cli.appVersionSource to \"remote\" so EAS manages build numbers.');
    process.exit(1);
  }
  if (config.build?.production?.autoIncrement !== true) {
    console.error('Error: eas.json must set build.production.autoIncrement to true to avoid store submission failures from duplicate versionCode/buildNumber.');
    process.exit(1);
  }
"; then
  FAILED=1
fi

if [[ $FAILED -eq 1 ]]; then
  exit 1
fi

echo "EAS config OK: cli.appVersionSource is remote; build.production.autoIncrement is true"
exit 0
