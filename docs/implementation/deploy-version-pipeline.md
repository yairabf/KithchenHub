# Deploy / Version Pipeline (Vercel backend + EAS mobile)

This document defines how Kitchen Hub compares what is in `main` vs what is deployed, how to trigger releases, and how to roll back safely.

## Backend (Vercel) — “What is deployed?”

### Deploy metadata endpoint

The backend exposes a public endpoint that reports deployment metadata:

- `GET /api/v1/deploy-info`

It returns:

- `gitSha`: prefers `VERCEL_GIT_COMMIT_SHA`, falls back to `GITHUB_SHA` / `GIT_SHA`
- `deploymentId`: `VERCEL_DEPLOYMENT_ID` (if present)
- `environment`: `VERCEL_ENV` (or `NODE_ENV`)
- `appVersion`: `APP_VERSION` if set, otherwise best-effort read of repo-root `version.json` in local environments

Notes:

- On Vercel, `gitSha` should be present via Vercel system environment variables.
- `appVersion` is optional. If you want it to match `version.json` on Vercel, set a Vercel project env var `APP_VERSION` during releases.

## Compare `main` vs deployed

### Deploy status workflow status

The older planned workflow `.github/workflows/deploy-status.yml` is **not present in the current repo**. Treat the comparison below as the intended/manual comparison logic unless that workflow is reintroduced.

It compares:

1. `main` git SHA + repo-root `version.json`
2. Vercel backend via `GET <VERCEL_API_BASE_URL>/api/v1/deploy-info`
3. Latest EAS production builds via `eas build:list` (requires `EXPO_TOKEN`)

#### Required secrets

- `VERCEL_API_BASE_URL`: base URL of your Vercel production backend (example: `https://api.example.com`)
- `EXPO_TOKEN`: Expo personal access token with access to the `@yairabc/kitchen_hub` project

#### How to run manually

- Compare the current `main` SHA/version from git and `version.json`.
- Query the backend: `GET <VERCEL_API_BASE_URL>/api/v1/deploy-info`.
- Compare with latest mobile store/Fastlane build metadata as needed.
- If a GitHub status workflow is reintroduced, document its exact file path and secrets here.

## Deploy latest version

### Backend (Vercel)

Vercel production should be configured to auto-deploy from:

- branch: `main`
- root directory: `backend`

Verify in Vercel dashboard:

Project → Settings → Git → Production Branch / Root Directory.

### Mobile (EAS)

Workflow: `.github/workflows/manual-deploy.yml` delegates store delivery to `.github/workflows/mobile-native-store-release.yml` when one of the store-delivery inputs is selected.

- Builds `production` profile for iOS, Android, or both (manual dispatch).
- Optional submission is supported, but requires EAS Submit credentials and submit profiles to be configured.

#### Required secrets

- Mobile store delivery uses Fastlane and the secrets referenced by `.github/workflows/manual-deploy.yml` and `.github/workflows/mobile-native-store-release.yml`.
- Backend deploy-hook redeploys require `VERCEL_DEPLOY_HOOK_URL`.

#### Store submission (optional)

For CI submission, follow Expo docs and configure:

- App Store Connect API key + `submit.production.ios.ascAppId` in `mobile/eas.json`
- Google Play service account + `submit.production.android` in `mobile/eas.json`

Reference: Expo “Submit to the Apple App Store” docs.

## Rollback strategy

### Backend (Vercel)

Fast rollback path:

1. Vercel Project → Deployments
2. Pick the last known-good deployment
3. “Promote to Production” (or equivalent)

Alternative rollback: revert the bad commit on `main` (new deploy will follow).

### Mobile (stores)

You cannot downgrade an installed store binary. Rollback is “fix-forward”:

- Stop/slow any staged rollout (Play Console / App Store phased release)
- Submit a new build that restores last known-good behavior

### Mobile (EAS Update / OTA)

If the issue is JS-only and runtime-compatible, you can republish a prior update to the `main` branch/channel.

### Legacy GCP / Docker path

Older GCP/Docker rollback docs were archived under `docs/archive/deployment-docs-2026-05-16/`. The current `.github/workflows/` directory does not include `deploy-production.yml`, so do not document that workflow as an active rollback path unless it is reintroduced in source.

