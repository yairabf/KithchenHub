#!/usr/bin/env bash
# Verifies that mobile/app.json contains the locked app identifiers.
# Exit 0 if both iOS bundleIdentifier and Android package are "com.kitchenhub.app"; exit 1 otherwise.
# Used by npm run verify:identifiers and can be wired into CI.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_JSON="${SCRIPT_DIR}/../app.json"
EXPECTED_ID="com.kitchenhub.app"

if [[ ! -f "$APP_JSON" ]]; then
  echo "Error: app.json not found at $APP_JSON"
  exit 1
fi

MISSING=0
if ! grep -q "\"bundleIdentifier\": \"${EXPECTED_ID}\"" "$APP_JSON"; then
  echo "Error: iOS bundleIdentifier in app.json is not \"${EXPECTED_ID}\""
  MISSING=1
fi
if ! grep -q "\"package\": \"${EXPECTED_ID}\"" "$APP_JSON"; then
  echo "Error: Android package in app.json is not \"${EXPECTED_ID}\""
  MISSING=1
fi

if [[ $MISSING -eq 1 ]]; then
  exit 1
fi

echo "App identifiers OK: iOS and Android both use ${EXPECTED_ID}"
exit 0
