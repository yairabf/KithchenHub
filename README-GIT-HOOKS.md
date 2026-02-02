# Git Hooks Setup

This repository uses git hooks to enforce code quality standards before commits.

## Pre-Commit Hook

The pre-commit hook automatically runs the following checks before allowing commits:

### Backend Checks (when `backend/` files are changed)
- ✅ **Build**: `npm run build` - Ensures TypeScript compiles without errors
- ✅ **Lint**: `npm run lint` - Ensures code follows ESLint rules
- ✅ **Tests**: `npm run test:unit` - Runs unit tests (excluding RLS integration tests)

### Mobile Checks (when `mobile/` files are changed)
- ✅ **Typecheck**: `npx tsc --noEmit` - Ensures TypeScript compiles without errors
- ✅ **Tests**: `npm test` - Runs Jest tests

## Setup

### For New Developers

Run the setup script to install the git hooks:

```bash
./scripts/setup-git-hooks.sh
```

This will:
1. Create the `.git/hooks/pre-commit` file
2. Make it executable
3. Verify the setup

### Manual Setup

If you prefer to set up manually:

```bash
chmod +x .git/hooks/pre-commit
```

## How It Works

1. When you run `git commit`, the pre-commit hook automatically runs
2. It checks which files are staged (backend or mobile)
3. Runs the appropriate checks for changed files
4. **If any check fails, the commit is blocked**
5. You must fix the errors before committing

## Bypassing the Hook (Not Recommended)

In exceptional circumstances (e.g., WIP commits), you can bypass the hook:

```bash
git commit --no-verify
```

**⚠️ Warning**: Only use `--no-verify` when absolutely necessary. Broken code should not be committed to the repository.

## Troubleshooting

### Hook Not Running

If the hook doesn't run:
1. Check if it's executable: `ls -l .git/hooks/pre-commit`
2. Re-run setup: `./scripts/setup-git-hooks.sh`
3. Verify git hooks are enabled: `git config core.hooksPath` (should be empty or `.git/hooks`)

### Checks Are Too Slow

The hook runs checks in the background. If it's too slow:
- Consider running checks manually before committing
- The hook only checks files that are actually staged
- Non-backend/mobile files skip checks automatically

### False Positives

If the hook fails but your code is correct:
1. Run the failing command manually to see the full error
2. Check if dependencies are installed: `npm install` in backend/ or mobile/
3. Ensure you're on the correct branch with latest changes

## Best Practices

1. **Run checks locally before committing** - Don't wait for the hook to catch errors
2. **Fix errors immediately** - Don't bypass the hook to commit broken code
3. **Keep tests passing** - Write tests that cover your changes
4. **Keep linting clean** - Fix linting issues as you code

## CI Integration

The same checks run in CI (GitHub Actions), so:
- ✅ Passing pre-commit hook = ✅ Passing CI (usually)
- ❌ Failing pre-commit hook = ❌ Will fail CI

This saves time by catching issues before pushing to the remote repository.
