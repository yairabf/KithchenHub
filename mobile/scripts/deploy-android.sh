#!/usr/bin/env bash
# Deploys the Android app from the main branch to Google Play.
#
# Workflow:
#   1. Verify the working tree is on main and is clean.
#   2. Pull the latest origin/main.
#   3. Validate all required environment variables.
#   4. Run `fastlane android internal` — builds a signed AAB and uploads it
#      to the Google Play internal testing track.
#   5. Run `fastlane android prod`    — promotes the internal release to the
#      production track as a draft (requires manual release in Play Console).
#
# Required environment variables (export before running, or put in .env.local):
#   EXPO_PUBLIC_API_URL       — must point to the deployed backend (not localhost)
#   SUPPLY_JSON_KEY           — path to the Google Play service-account JSON key
#   ANDROID_KEYSTORE_PATH     — absolute path to the release keystore file
#   ANDROID_KEYSTORE_PASSWORD — keystore password
#   ANDROID_KEY_ALIAS         — key alias inside the keystore
#   ANDROID_KEY_PASSWORD      — key password
#
# Usage (from repo root or mobile/):
#   bash mobile/scripts/deploy-android.sh
#
# To skip the prod promotion step and only upload to the internal track:
#   SKIP_PROD=1 bash mobile/scripts/deploy-android.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="${SCRIPT_DIR}/.."
REPO_ROOT="${MOBILE_DIR}/.."

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[deploy-android]${NC} $*"; }
success() { echo -e "${GREEN}[deploy-android]${NC} $*"; }
warn()    { echo -e "${YELLOW}[deploy-android]${NC} $*"; }
fail()    { echo -e "${RED}[deploy-android] ERROR:${NC} $*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# 1. Branch and working-tree checks
# ---------------------------------------------------------------------------
info "Checking git branch..."
cd "$REPO_ROOT"

current_branch="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$current_branch" != "main" ]]; then
  fail "Must be on the 'main' branch to deploy. Currently on: ${current_branch}"
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  fail "Working tree has uncommitted changes. Commit or stash them before deploying."
fi

# ---------------------------------------------------------------------------
# 2. Pull latest
# ---------------------------------------------------------------------------
info "Pulling latest origin/main..."
git pull --ff-only origin main

# ---------------------------------------------------------------------------
# 3. Environment variable validation
# ---------------------------------------------------------------------------
info "Validating environment variables..."

required_vars=(
  EXPO_PUBLIC_API_URL
  SUPPLY_JSON_KEY
  ANDROID_KEYSTORE_PATH
  ANDROID_KEYSTORE_PASSWORD
  ANDROID_KEY_ALIAS
  ANDROID_KEY_PASSWORD
)
missing=()
for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    missing+=("$var")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  fail "Missing required environment variables:\n$(printf '  %s\n' "${missing[@]}")"
fi

if echo "$EXPO_PUBLIC_API_URL" | grep -qiE 'localhost|127\.0\.0\.1|10\.0\.2\.2'; then
  fail "EXPO_PUBLIC_API_URL must point to the deployed backend, got: ${EXPO_PUBLIC_API_URL}"
fi

if [[ ! -f "$SUPPLY_JSON_KEY" ]]; then
  fail "SUPPLY_JSON_KEY file does not exist: ${SUPPLY_JSON_KEY}"
fi

if [[ ! -f "$ANDROID_KEYSTORE_PATH" ]]; then
  fail "ANDROID_KEYSTORE_PATH file does not exist: ${ANDROID_KEYSTORE_PATH}"
fi

success "Environment OK. API URL: ${EXPO_PUBLIC_API_URL}"

# ---------------------------------------------------------------------------
# 4. Build + upload to Google Play internal track (fastlane android internal)
# ---------------------------------------------------------------------------
info "Starting Android build and Google Play internal upload..."
cd "$MOBILE_DIR"

rbenv exec bundle exec fastlane android internal

success "Google Play internal upload complete."

# ---------------------------------------------------------------------------
# 5. Promote to production track as draft (fastlane android prod)
# ---------------------------------------------------------------------------
if [[ "${SKIP_PROD:-0}" == "1" ]]; then
  warn "Skipping production promotion (SKIP_PROD=1)."
  warn "Run 'fastlane android prod' manually when ready to promote."
else
  info "Promoting internal release to production track (draft)..."
  rbenv exec bundle exec fastlane android prod
  success "Production promotion complete. Remember to release the draft in Google Play Console."
fi

success "Android deployment finished successfully."
