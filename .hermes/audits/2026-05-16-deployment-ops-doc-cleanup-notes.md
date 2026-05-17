# Deployment / Ops Documentation Cleanup Notes

Date: 2026-05-16

## Source inspected

Current source/config:

- `backend/vercel.json`
- `backend/package.json`
- `backend/scripts/create-vercel-output-dir.js`
- `.vercelignore`
- `.github/workflows/manual-deploy.yml`
- `.github/workflows/mobile-native-store-release.yml`
- `backend/src/config/env.validation.ts`
- `backend/src/config/configuration.ts`
- `backend/src/modules/health/controllers/deploy-info.controller.ts`
- `backend/.env.example`
- `backend/.env.production.example`

Docs reviewed:

- `docs/deployment/vercel-monorepo.md`
- `backend/DEPLOYMENT.md`
- `backend/docs/DEPLOYMENT_COMPREHENSIVE.md`
- `backend/docs/ROLLBACK_GUIDE.md`
- `backend/docs/ENV_VAR_CHECKLIST.md`
- `docs/implementation/deploy-version-pipeline.md`
- `backend/README.md`
- `docs/project/DOCUMENTATION_MAP.md`

## What changed

### Current deployment source of truth

Confirmed active backend deployment path is Vercel, not the older GCP Cloud Run / AWS ECS workflow set.

Current active docs:

- `backend/DEPLOYMENT.md`
- `backend/docs/ENV_VAR_CHECKLIST.md`
- `docs/deployment/vercel-monorepo.md`
- `docs/implementation/deploy-version-pipeline.md`

### Archived stale deployment docs

Moved older GCP/AWS/GHCR deployment docs from active backend docs into:

- `docs/archive/deployment-docs-2026-05-16/backend-docs/`

Archived files:

- `DEPLOYMENT_COMPREHENSIVE.md`
- `DEPLOYMENT_COMPREHENSIVE 2.md` — duplicate of original
- `ROLLBACK_GUIDE.md`
- `ROLLBACK_GUIDE 2.md`
- `ENV_VAR_CHECKLIST.md`
- `ENV_VAR_CHECKLIST 2.md`
- `PLATFORM_MIGRATION.md`
- `PLATFORM_MIGRATION 2.md`

Reason: these docs reference workflow files not present in current `.github/workflows/`, including `build.yml`, `_deploy.yml`, `deploy-staging.yml`, and `deploy-production.yml`.

### Rewrote backend deployment guide

`backend/DEPLOYMENT.md` now describes:

- Vercel backend project with root directory `backend`
- `backend/vercel.json`
- `npm run vercel-build`
- `backend/api/[...path].ts` serverless entrypoint
- static legal page copying from `static-legal/`
- manual GitHub deploy-hook redeploy path via `.github/workflows/manual-deploy.yml`
- Vercel rollback path

### Rebuilt environment checklist

`backend/docs/ENV_VAR_CHECKLIST.md` now matches source validation in:

- `backend/src/config/env.validation.ts`
- `backend/src/config/configuration.ts`

It documents current required/default/optional runtime variables and the Vercel/GitHub deploy-hook variables.

### Updated references

Updated:

- `docs/deployment/vercel-monorepo.md`
- `docs/implementation/deploy-version-pipeline.md`
- `docs/project/DOCUMENTATION_MAP.md`
- `backend/README.md`

to avoid sending future agents to archived GCP/AWS docs as current instructions.

## Preserve decisions

Preserve as active:

- `backend/DEPLOYMENT.md`
- `backend/docs/ENV_VAR_CHECKLIST.md`
- `docs/deployment/vercel-monorepo.md`
- `docs/implementation/deploy-version-pipeline.md`

Preserve as historical archive:

- `docs/archive/deployment-docs-2026-05-16/backend-docs/*`

## Open questions

- Whether `APP_VERSION` should be set automatically during Vercel releases or remain a manually managed project env var.
- Whether a new `deploy-status.yml` workflow should be reintroduced; current docs now mark it absent.
- Whether old GHCR docs should be archived too in a separate ops cleanup pass if no active workflow uses GHCR.
