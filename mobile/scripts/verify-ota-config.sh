#!/usr/bin/env bash
# Verifies that mobile/app.json contains required OTA updates configuration and version source of truth.
# Checks: updates block exists, runtimeVersion exists with policy "appVersion", url has no [PROJECT_ID],
# version.json exists at repo root with valid "version", and app.json does not define expo.version (set by app.config.js).
# Exit 0 if all checks pass; exit 1 otherwise.
# Used by npm run verify:ota and can be wired into CI.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="${SCRIPT_DIR}/.."
REPO_ROOT="${MOBILE_DIR}/.."
APP_JSON="${MOBILE_DIR}/app.json"
VERSION_JSON="${REPO_ROOT}/version.json"
PLACEHOLDER="[PROJECT_ID]"

if [[ ! -f "$APP_JSON" ]]; then
  echo "Error: app.json not found at $APP_JSON"
  exit 1
fi

FAILED=0

# Version source of truth: version.json at repo root must exist and have a non-empty "version" string
if [[ ! -f "$VERSION_JSON" ]]; then
  echo "Error: version.json not found at $VERSION_JSON (repo root). Product version must be defined there."
  FAILED=1
else
  if ! node -e "const v = require('$VERSION_JSON'); if (typeof v.version !== 'string' || !v.version.trim()) throw new Error('missing or invalid version');"; then
    echo "Error: version.json must contain a non-empty \"version\" string."
    FAILED=1
  fi
fi

# app.json must not define expo.version; it is set by app.config.js from version.json
if grep -qE '"version"\s*:' "$APP_JSON"; then
  echo "Error: app.json must not contain a \"version\" field. expo.version is set from version.json via app.config.js."
  FAILED=1
fi

if ! grep -q '"updates"' "$APP_JSON"; then
  echo "Error: app.json is missing the \"updates\" configuration block"
  FAILED=1
fi

if ! grep -q '"runtimeVersion"' "$APP_JSON"; then
  echo "Error: app.json is missing the \"runtimeVersion\" configuration"
  FAILED=1
fi

if ! grep -q '"policy": "appVersion"' "$APP_JSON"; then
  echo "Error: app.json runtimeVersion must use policy \"appVersion\". Do not switch to nativeVersion, fingerprint, or a custom string without an explicit product/engineering decision."
  FAILED=1
fi

if grep -q "$PLACEHOLDER" "$APP_JSON"; then
  echo "Warning: app.json updates.url still contains the placeholder \"$PLACEHOLDER\". Replace it with your EAS project ID before shipping production builds."
  FAILED=1
fi

if [[ $FAILED -eq 1 ]]; then
  exit 1
fi

echo "OTA config OK: updates and runtimeVersion (appVersion policy) present; url has no placeholder; version from version.json; app.json has no version field"
exit 0
