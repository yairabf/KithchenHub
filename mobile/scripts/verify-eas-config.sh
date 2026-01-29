#!/usr/bin/env bash
# Verifies that mobile/eas.json has EAS Build config required for store submissions:
# cli.appVersionSource "remote", build.production.autoIncrement true, preview distribution
# "internal" and Android buildType "apk", and OTA channels develop (preview) and main (production).
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

export EAS_JSON_PATH="$EAS_JSON"
node "${SCRIPT_DIR}/validate-eas-config.js" "$EAS_JSON"
