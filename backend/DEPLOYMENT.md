# Backend Deployment Guide

Last updated: 2026-05-16

This guide covers the current backend deployment shape for KitchenHub / FullHouse.

## Current deployment target

The backend API is deployed as a **Vercel project** with:

- Root Directory: `backend`
- Config file: `backend/vercel.json`
- Build command: `npm run vercel-build`
- Output directory: `public`
- Serverless entrypoint: `backend/api/[...path].ts`

For the monorepo-level Vercel setup, see:

```text
docs/deployment/vercel-monorepo.md
```

## What the Vercel build does

`backend/package.json` defines:

```text
vercel-build = npm run prisma:generate && node scripts/create-vercel-output-dir.js
```

`backend/scripts/create-vercel-output-dir.js`:

- creates `backend/public/`
- writes a `.keep` sentinel
- copies tracked static legal assets from repo-root `static-legal/`
- falls back to `backend/static-web/` if `static-legal/` is missing

`backend/vercel.json` routes API traffic through:

```text
/api/[...path].ts
```

and rewrites legal paths such as:

```text
/privacy
/terms
/delete-account
```

to static HTML files in `public/`.

## Deployment paths

### Automatic Vercel Git deployment

Use the Vercel dashboard to confirm:

- production branch is the intended branch, normally `main`
- root directory is `backend`
- environment variables are configured in the backend Vercel project

### Manual redeploy from GitHub Actions

The current repo has a unified manual workflow:

```text
.github/workflows/manual-deploy.yml
```

To re-trigger a backend Vercel deploy hook:

1. Open GitHub Actions → **Manual deploy**.
2. Run workflow.
3. Set `redeploy_backend_vercel=true`.
4. Ensure GitHub secret `VERCEL_DEPLOY_HOOK_URL` is configured.

This triggers the Vercel deploy hook for the latest configured branch. It does not run a local deploy command from this repo.

## Environment variables

Use:

```text
backend/docs/ENV_VAR_CHECKLIST.md
```

as the current source-backed backend environment variable checklist.

Source validation lives in:

```text
backend/src/config/env.validation.ts
```

Do not commit real secrets.

## Verification after deploy

Check:

```bash
curl https://<backend-host>/api/version
curl https://<backend-host>/api/v1/health
curl https://<backend-host>/api/v1/deploy-info
curl https://<backend-host>/privacy
curl https://<backend-host>/terms
curl https://<backend-host>/delete-account
```

Expected behavior:

- `/api/version` reports API version support.
- `/api/v1/health` reports app/database health.
- `/api/v1/deploy-info` reports deployment metadata when Vercel system variables are available.
- legal paths return static HTML copied into `public/` during `vercel-build`.

## Rollback

Current Vercel rollback path:

1. Open the backend project in Vercel.
2. Go to Deployments.
3. Select the last known-good deployment.
4. Promote/restore it to production according to the Vercel dashboard controls.

Alternative: revert the bad commit on the production branch and let Vercel deploy the revert.

## Archived historical docs

Older GCP Cloud Run / AWS ECS deployment guides were moved to:

```text
docs/archive/deployment-docs-2026-05-16/backend-docs/
```

Those files are historical only and should not be used as current deployment instructions unless the project reintroduces those deployment targets.

## Sources

- `backend/vercel.json`
- `backend/package.json`
- `backend/scripts/create-vercel-output-dir.js`
- `.vercelignore`
- `.github/workflows/manual-deploy.yml`
- `backend/src/modules/health/controllers/deploy-info.controller.ts`
