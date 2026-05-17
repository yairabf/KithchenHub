# Docs refresh final verification — 2026-05-17

## Scope

Final documentation verification pass after refreshing feature, screenshot, i18n/localization, and deployment/environment docs.

## Sources inspected

Feature/source docs:

- `docs/features/shopping.md`
- `docs/features/recipes.md`
- `docs/features/mobile-ui-map.md`
- `mobile/src/features/shopping/screens/ShoppingListsScreen.tsx`
- `mobile/src/features/recipes/screens/RecipesScreen.tsx`
- `mobile/src/features/recipes/screens/RecipeDetailScreen.tsx`
- `mobile/src/features/recipes/hooks/useRecipes.ts`
- `mobile/src/features/recipes/services/recipeService.ts`
- `mobile/src/features/recipes/services/recipeImageSearchService.ts`

Screenshot docs:

- `docs/screenshots/**/*.png`
- `docs/screenshots/README.md`
- `docs/project/STORE_COMPLIANCE.md`
- `docs/project/RELEASE_STATUS.md`

Localization docs/source:

- `mobile/src/i18n/README.md`
- `mobile/src/i18n/index.ts`
- `mobile/src/i18n/constants.ts`
- `mobile/src/i18n/languageDetector.ts`
- `mobile/src/i18n/rtl.ts`
- `mobile/src/i18n/locales/*.json`

Deployment/environment docs/source:

- `docs/deployment/environment.md`
- `docs/deployment/vercel-monorepo.md`
- `backend/DEPLOYMENT.md`
- `backend/docs/ENV_VAR_CHECKLIST.md`
- `backend/src/config/env.validation.ts`
- `backend/vercel.json`
- `backend/package.json`
- `mobile/src/config/index.ts`
- `mobile/src/config/apiBaseUrl.ts`
- `mobile/.env.final.example`
- `mobile/eas.json`
- `mobile/app.config.js`
- `.github/workflows/manual-deploy.yml`

## Updates made

- Added source-backed current behavior sections to `docs/features/shopping.md` and `docs/features/recipes.md`.
- Added `docs/screenshots/README.md` with screenshot inventory, dimensions, and freshness limitations.
- Updated `mobile/src/i18n/README.md` for current supported languages (`en`, `he`, `ar`), namespaces, and test coverage.
- Added `docs/deployment/environment.md` for backend/mobile/deployment env-var sources and safety rules.
- Updated `docs/project/DOCUMENTATION_MAP.md` to include screenshot and environment references.
- Updated `docs/project/RECENT_CHANGES.md` with the latest docs-refresh notes.
- Patched the root `README.md` settings feature summary and docs map links away from older/stale references.

## Verification performed

- Searched active markdown for known stale phrases from prior cleanup work.
- Verified new referenced docs exist.
- Verified screenshot PNG dimensions with a direct PNG IHDR parser.
- Checked working-tree status for changed docs.

## Remaining open questions / known limits

- Screenshot docs inventory verifies files and dimensions only; screenshots were not re-captured from a running app in this pass.
- `docs/project/RELEASE_STATUS.md` still says Apple review was pending as of 2026-05-15; update it only when the review outcome is known.
- `backend/docs/MONITORING_SETUP.md` contains generic external monitoring text about notification preferences; that is not a Settings feature claim, but could be reviewed in a future monitoring-doc pass.
- Archived docs still contain historical stale claims by design. Active docs should remain the source of truth.
