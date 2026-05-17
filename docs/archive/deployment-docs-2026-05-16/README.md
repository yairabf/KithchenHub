# Deployment Docs Archive — 2026-05-16

This archive contains deployment/ops documents moved out of active backend doc paths during the source-backed deployment documentation cleanup.

## Why archived

Current repo configuration indicates the active backend deployment path is Vercel:

- `backend/vercel.json`
- `backend/package.json` script `vercel-build`
- `backend/scripts/create-vercel-output-dir.js`
- `.github/workflows/manual-deploy.yml` deploy-hook path
- `docs/deployment/vercel-monorepo.md`
- `backend/DEPLOYMENT.md`

The archived files primarily describe older GCP Cloud Run / AWS ECS / GHCR workflows and workflow files that are not present in the current `.github/workflows/` directory, such as `build.yml`, `_deploy.yml`, `deploy-staging.yml`, and `deploy-production.yml`.

## Archived files

Moved from `backend/docs/`:

- `DEPLOYMENT_COMPREHENSIVE.md`
- `DEPLOYMENT_COMPREHENSIVE 2.md` — duplicate of `DEPLOYMENT_COMPREHENSIVE.md`
- `ROLLBACK_GUIDE.md`
- `ROLLBACK_GUIDE 2.md`
- `ENV_VAR_CHECKLIST.md`
- `ENV_VAR_CHECKLIST 2.md`
- `PLATFORM_MIGRATION.md`
- `PLATFORM_MIGRATION 2.md`

## Current replacements

Use these active docs instead:

- `backend/DEPLOYMENT.md` — current backend Vercel deployment and rollback guide
- `backend/docs/ENV_VAR_CHECKLIST.md` — current source-backed backend env var checklist
- `docs/deployment/vercel-monorepo.md` — Vercel monorepo project settings
- `docs/implementation/deploy-version-pipeline.md` — deploy status/version comparison notes

Do not use archived files as current deployment instructions unless the project intentionally reintroduces GCP Cloud Run, AWS ECS, or GHCR deployment workflows and updates source/config accordingly.
