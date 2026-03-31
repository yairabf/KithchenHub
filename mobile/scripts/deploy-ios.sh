#!/usr/bin/env bash
# Deploys the iOS app from the main branch to the App Store.
#
# Workflow:
#   1. Verify the working tree is on main and is clean.
#   2. Pull the latest origin/main.
#   3. Validate all required environment variables.
#   4. Run `fastlane ios internal`  — builds an IPA and uploads it to TestFlight.
#   5. Run `fastlane ios prod`      — submits the build for App Store review.
#
# Required environment variables (export before running, or put in .env.local):
#   EXPO_PUBLIC_API_URL   — must point to the deployed backend (not localhost)
#   ASC_KEY_ID            — App Store Connect API key ID
#   ASC_ISSUER_ID         — App Store Connect issuer ID
#   ASC_KEY_PATH          — absolute path to the .p8 private key file
#
# Usage (from repo root or mobile/):
#   bash mobile/scripts/deploy-ios.sh
#
# To skip the prod (App Store review) step and only upload to TestFlight:
#   SKIP_PROD=1 bash mobile/scripts/deploy-ios.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="${SCRIPT_DIR}/.."
REPO_ROOT="${MOBILE_DIR}/.."

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[deploy-ios]${NC} $*"; }
success() { echo -e "${GREEN}[deploy-ios]${NC} $*"; }
warn()    { echo -e "${YELLOW}[deploy-ios]${NC} $*"; }
fail()    { echo -e "${RED}[deploy-ios] ERROR:${NC} $*" >&2; exit 1; }

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

required_vars=(EXPO_PUBLIC_API_URL ASC_KEY_ID ASC_ISSUER_ID ASC_KEY_PATH)
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

if [[ ! -f "$ASC_KEY_PATH" ]]; then
  fail "ASC_KEY_PATH does not exist: ${ASC_KEY_PATH}"
fi

success "Environment OK. API URL: ${EXPO_PUBLIC_API_URL}"

# ---------------------------------------------------------------------------
# 4. Build + upload to TestFlight (fastlane ios internal)
# ---------------------------------------------------------------------------
info "Starting iOS build and TestFlight upload..."
cd "$MOBILE_DIR"

rbenv exec bundle exec fastlane ios internal

success "TestFlight upload complete."

# ---------------------------------------------------------------------------
# 5. Submit for App Store review (fastlane ios prod)
# ---------------------------------------------------------------------------
if [[ "${SKIP_PROD:-0}" == "1" ]]; then
  warn "Skipping App Store review submission (SKIP_PROD=1)."
  warn "Run 'fastlane ios prod' manually when ready to submit."
else
  info "Submitting latest build for App Store review..."
  rbenv exec bundle exec fastlane ios prod
  success "App Store review submission complete."
fi

success "iOS deployment finished successfully."
