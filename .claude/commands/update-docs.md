---
description: Update feature documentation based on recent code changes
argument-hint: "[--features <names>] [--commits <N>] [--skip-screenshots] [--all]"
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - mcp__playwright__browser_navigate
  - mcp__playwright__browser_snapshot
  - mcp__playwright__browser_take_screenshot
  - mcp__playwright__browser_click
  - mcp__playwright__browser_type
  - mcp__playwright__browser_resize
  - mcp__playwright__browser_close
  - mcp__playwright__browser_wait_for
---

# Update Documentation Command

This command automatically updates feature documentation in `docs/features/` based on recent code changes in `src/features/`.

## Workflow

### Phase 1: Parse Arguments and Detect Changes

Parse command arguments:
- `--features <name1,name2>`: Update specific features only
- `--commits <N>`: Analyze last N commits (default: 10)
- `--skip-screenshots`: Skip screenshot capture
- `--all`: Force update all features

Detect changed features:
1. If `--features` specified: use those features
2. If `--all` specified: list all features in `src/features/`
3. Otherwise: analyze git log for last N commits to find changed features

Validate that features exist in the filesystem.

### Phase 2: Analyze Code for Each Feature

For each feature, extract metadata:

**Components**:
- Scan `src/features/<feature>/components/` directory
- For each `.tsx` file, extract:
  - Component name
  - File path
  - Props interface (from types.ts or inline)
  - Key features from code

**Screens**:
- Scan `src/features/<feature>/screens/` directory
- Extract state management, key functionality, and modals

**Types**:
- Read all `types.ts` files
- Extract interface/type definitions

**Dependencies**:
- Parse imports from all feature files
- List external libraries

### Phase 3: Update Documentation

Use intelligent merge strategy:
- **PRESERVE**: Overview, UI Flow, Styling Notes (user-written content)
- **UPDATE**: Components, Key Types, State Management, Key Dependencies (code-derived)
- **ENHANCE**: Screenshots (add new, keep existing)

Parse existing doc into sections, apply update rules, write back.

### Phase 4: Capture Screenshots (if not --skip-screenshots)

1. Check if app is running at `http://localhost:8081`
2. If running:
   - Initialize Playwright (1024x768 resolution)
   - Navigate to app
   - Handle auth if needed (click "Skip for now")
   - Navigate to feature tab using BottomPillNav
   - Capture main screenshot
   - Detect and capture modal screenshots
   - Update screenshot references in docs
3. If not running: warn and skip

### Phase 5: Generate Summary Report

Display:
- Features updated
- Changes made (components added/removed/updated)
- Manual review items
- Errors encountered
- Files modified

## Implementation Notes

When implementing this command:

1. **Argument Validation**: Check for conflicting arguments (e.g., `--features` with `--all`)
2. **Error Handling**: Continue on failures, report at the end
3. **Section Parsing**: Use regex to identify markdown sections (## headers)
4. **Code Analysis**: Use AST parsing or regex to extract imports, interfaces, and component structures
5. **Screenshot Navigation**: Refer to `src/navigation/MainTabsScreen.tsx` for tab order: Dashboard → Shopping → Chores → Recipes → Settings
6. **Modal Detection**: Find components ending with "Modal" suffix, determine triggers from screen code
7. **File Organization**: Create screenshot directories if they don't exist

### Execution Steps

**Step 1: Parse Arguments**
```bash
# Extract arguments from command invocation
# Example: /update-docs --features shopping,recipes --skip-screenshots
FEATURES=""
COMMITS=10
SKIP_SCREENSHOTS=false
ALL=false

# Parse each argument
# Set flags accordingly
```

**Step 2: Detect Changed Features**
```bash
# If --all specified
if [ "$ALL" = true ]; then
  ls -1 src/features/

# If --features specified
elif [ -n "$FEATURES" ]; then
  echo "$FEATURES" | tr ',' '\n'

# Otherwise analyze git log
else
  git log --pretty=format:"%h %s" --name-only -${COMMITS} | \
    grep "src/features/" | \
    cut -d'/' -f3 | \
    sort | uniq
fi
```

**Step 3: For Each Feature, Analyze Code**

For feature in detected features:
1. List all `.tsx` files in `src/features/<feature>/components/`
2. Read each component file to extract:
   - Component name (from filename or export)
   - Props interface (from `types.ts` or inline)
   - Key functionality (from JSX and handlers)
3. List screens in `src/features/<feature>/screens/`
4. Extract state hooks and key functionality
5. Read `types.ts` files to get type definitions
6. Parse imports to identify dependencies

**Step 4: Update Documentation**

For each feature:
1. Read existing `docs/features/<feature>.md`
2. Parse into sections (split by ## headers)
3. For each section:
   - If section is "Overview", "UI Flow", "Styling Notes": PRESERVE
   - If section is "Screenshots": ENHANCE (add new, keep existing)
   - If section is "Components", "Key Types", "State Management", "Key Dependencies": UPDATE
   - If section is "Screens": HYBRID (update code snippets, preserve descriptions)
4. Write updated content back to file

**Step 5: Capture Screenshots (if enabled)**

1. Check if app is running: `curl -s http://localhost:8081 > /dev/null`
2. If running:
   - Use Playwright to navigate and capture screenshots
   - Save to `docs/screenshots/<feature>/`
   - Update markdown image references
3. If not running: warn and skip

**Step 6: Generate Report**

Collect statistics:
- Features updated
- Components added/removed/updated
- Screenshots captured
- Errors encountered
Display formatted summary

## Expected Output Format

```
✅ Documentation Update Complete

📝 Features Updated: 2
• shopping: 7 components, 1 screen
• recipes: 2 components, 2 screens

📦 Changes:
✓ Updated 5 prop interfaces
✓ Captured 8 screenshots

⚠ Manual Review Needed:
• shopping: New modal detected (AddItemModal)

📂 Files Modified:
• docs/features/shopping.md
• docs/features/recipes.md
• docs/screenshots/shopping/*.png (4 files)
```

## Usage Examples

### Example 1: Auto-detect changes from recent commits
```bash
/update-docs
```
Analyzes the last 10 commits, finds changed features (shopping, recipes, chores, dashboard), and updates their documentation with screenshots.

### Example 2: Update specific features without screenshots
```bash
/update-docs --features shopping --skip-screenshots
```
Updates only the shopping feature documentation. Useful for quick doc updates without needing the app running.

### Example 3: Update all features
```bash
/update-docs --all --skip-screenshots
```
Updates all 6 features (auth, dashboard, shopping, recipes, chores, settings) regardless of git history. Fast with screenshots disabled.

### Example 4: Analyze more commits
```bash
/update-docs --commits 20
```
Looks at the last 20 commits to detect changed features, useful after a large refactor.

### Example 5: Update multiple specific features with screenshots
```bash
/update-docs --features shopping,recipes
```
Updates shopping and recipes with full screenshot capture. Requires app running at localhost:8081.

## Test Results

The command has been tested and verified with the following results:

### Test 1: Shopping Feature Update
- ✅ Detected shopping feature from git log
- ✅ Analyzed 7 components (added FrequentlyAddedGrid, removed SwipeableShoppingItem)
- ✅ Preserved Overview and UI Flow sections (user-written content)
- ✅ Updated Components section with new component details
- ✅ Captured 2 screenshots (main view, quick add modal)
- ✅ Generated summary report

### Available Features
All features available for documentation updates:
- auth
- chores
- dashboard
- recipes
- settings
- shopping
