#!/bin/bash

# Setup script to install git hooks
# This makes the pre-commit hook executable and ensures it's set up correctly

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"
PRE_COMMIT_HOOK="$HOOKS_DIR/pre-commit"

echo "🔧 Setting up git hooks..."

# Check if we're in a git repository
if [ ! -d "$REPO_ROOT/.git" ]; then
  echo "❌ Error: Not in a git repository"
  exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

# Check if pre-commit hook already exists
if [ -f "$PRE_COMMIT_HOOK" ]; then
  echo "⚠️  Pre-commit hook already exists"
  read -p "   Overwrite? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "   Skipping..."
    exit 0
  fi
fi

# Copy the hook from scripts directory if it exists there
if [ -f "$SCRIPT_DIR/pre-commit" ]; then
  cp "$SCRIPT_DIR/pre-commit" "$PRE_COMMIT_HOOK"
  echo "✓ Copied pre-commit hook from scripts/"
else
  # Create the hook inline (same as .git/hooks/pre-commit)
  cat > "$PRE_COMMIT_HOOK" << 'HOOK_EOF'
#!/bin/bash

# Pre-commit hook to ensure code quality
# Runs build, lint, and tests before allowing commits

set -e

echo "🔍 Running pre-commit checks..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get list of staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

# Check if any backend files are staged
BACKEND_CHANGED=false
if echo "$STAGED_FILES" | grep -q "^backend/"; then
  BACKEND_CHANGED=true
fi

# Check if any mobile files are staged
MOBILE_CHANGED=false
if echo "$STAGED_FILES" | grep -q "^mobile/"; then
  MOBILE_CHANGED=true
fi

# If no backend or mobile files changed, skip checks
if [ "$BACKEND_CHANGED" = false ] && [ "$MOBILE_CHANGED" = false ]; then
  echo "✅ No backend or mobile files changed, skipping checks"
  exit 0
fi

# Track failures
FAILED=false

# Backend checks
if [ "$BACKEND_CHANGED" = true ]; then
  echo ""
  echo "${YELLOW}📦 Checking backend code...${NC}"
  cd backend
  
  echo "  → Running build..."
  if ! npm run build > /dev/null 2>&1; then
    echo "${RED}❌ Backend build failed${NC}"
    echo "   Run 'cd backend && npm run build' to see errors"
    FAILED=true
  else
    echo "  ${GREEN}✓${NC} Build passed"
  fi
  
  echo "  → Running lint..."
  if ! npm run lint > /dev/null 2>&1; then
    echo "${RED}❌ Backend lint failed${NC}"
    echo "   Run 'cd backend && npm run lint' to see errors"
    FAILED=true
  else
    echo "  ${GREEN}✓${NC} Lint passed"
  fi
  
  echo "  → Running tests..."
  if ! npm run test:unit > /dev/null 2>&1; then
    echo "${RED}❌ Backend tests failed${NC}"
    echo "   Run 'cd backend && npm run test:unit' to see errors"
    FAILED=true
  else
    echo "  ${GREEN}✓${NC} Tests passed"
  fi
  
  cd ..
fi

# Mobile checks
if [ "$MOBILE_CHANGED" = true ]; then
  echo ""
  echo "${YELLOW}📱 Checking mobile code...${NC}"
  cd mobile
  
  echo "  → Running typecheck..."
  if ! npx tsc --noEmit > /dev/null 2>&1; then
    echo "${RED}❌ Mobile typecheck failed${NC}"
    echo "   Run 'cd mobile && npx tsc --noEmit' to see errors"
    FAILED=true
  else
    echo "  ${GREEN}✓${NC} Typecheck passed"
  fi
  
  echo "  → Running tests..."
  if ! npm test -- --passWithNoTests > /dev/null 2>&1; then
    echo "${RED}❌ Mobile tests failed${NC}"
    echo "   Run 'cd mobile && npm test' to see errors"
    FAILED=true
  else
    echo "  ${GREEN}✓${NC} Tests passed"
  fi
  
  cd ..
fi

# Exit with error if any checks failed
if [ "$FAILED" = true ]; then
  echo ""
  echo "${RED}❌ Pre-commit checks failed!${NC}"
  echo "   Please fix the errors above before committing."
  echo "   To bypass this hook (not recommended), use: git commit --no-verify"
  exit 1
fi

echo ""
echo "${GREEN}✅ All pre-commit checks passed!${NC}"
exit 0
HOOK_EOF
fi

# Make the hook executable
chmod +x "$PRE_COMMIT_HOOK"

echo "✅ Git hooks setup complete!"
echo ""
echo "The pre-commit hook will now run automatically on every commit."
echo "It will check:"
echo "  - Backend: build, lint, and unit tests"
echo "  - Mobile: typecheck and tests"
echo ""
echo "To bypass the hook (not recommended): git commit --no-verify"
