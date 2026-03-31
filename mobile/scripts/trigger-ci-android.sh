#!/usr/bin/env bash
# Triggers GitHub Actions mobile release workflow for Android.
# This path uses EAS cloud build/submit from CI (not local fastlane).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="${SCRIPT_DIR}/.."
REPO_ROOT="${MOBILE_DIR}/.."

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[ci-deploy-android]${NC} $*"; }
success() { echo -e "${GREEN}[ci-deploy-android]${NC} $*"; }
warn()    { echo -e "${YELLOW}[ci-deploy-android]${NC} $*"; }
fail()    { echo -e "${RED}[ci-deploy-android] ERROR:${NC} $*" >&2; exit 1; }

cd "$REPO_ROOT"

info "Checking git branch..."
current_branch="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$current_branch" != "main" ]]; then
  fail "Must be on the 'main' branch. Currently on: ${current_branch}"
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  fail "Working tree has uncommitted changes. Commit or stash before triggering CI deploy."
fi

info "Checking GitHub CLI authentication..."
if ! gh auth status >/dev/null 2>&1; then
  fail "gh is not authenticated. Run: gh auth login"
fi

info "Pulling latest origin/main..."
git pull --ff-only origin main

info "Triggering GitHub Actions Android release workflow..."
gh workflow run mobile-release.yml --ref main -f platform=android -f submit=true

actions_url="$(gh repo view --json url -q '.url')/actions/workflows/mobile-release.yml"
success "Workflow triggered."
warn "Monitor progress at: ${actions_url}"
