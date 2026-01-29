#!/usr/bin/env bash
# Verifies that mobile/app.json contains required OTA updates configuration.
# Checks: updates block exists, runtimeVersion exists with policy "appVersion", and url does not contain [PROJECT_ID] placeholder.
# Exit 0 if all checks pass; exit 1 otherwise.
# Used by npm run verify:ota and can be wired into CI.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_JSON="${SCRIPT_DIR}/../app.json"
PLACEHOLDER="[PROJECT_ID]"

if [[ ! -f "$APP_JSON" ]]; then
  echo "Error: app.json not found at $APP_JSON"
  exit 1
fi

FAILED=0

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

echo "OTA config OK: updates and runtimeVersion (appVersion policy) present; url has no placeholder"
exit 0
