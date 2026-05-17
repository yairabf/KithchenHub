# Environment Configuration Reference

Last updated: 2026-05-17

This document summarizes the current source-backed environment variables for KitchenHub / FullHouse. It does not contain secret values.

## Sources of truth

Backend:

- `backend/src/config/env.validation.ts` — runtime validation and defaults
- `backend/docs/ENV_VAR_CHECKLIST.md` — backend checklist
- `backend/.env.example`
- `backend/.env.production.example`

Mobile:

- `mobile/src/config/index.ts`
- `mobile/src/config/apiBaseUrl.ts`
- `mobile/.env.final.example`
- `mobile/eas.json`
- `mobile/app.config.js`

Deployment/release:

- `backend/vercel.json`
- `docs/deployment/vercel-monorepo.md`
- `backend/DEPLOYMENT.md`
- `.github/workflows/manual-deploy.yml`
- `.github/workflows/mobile-native-store-release.yml`

## Backend runtime variables

Required by `backend/src/config/env.validation.ts` unless a default is listed in source:

- `DATABASE_URL`
- `JWT_SECRET` — minimum 32 characters
- `JWT_REFRESH_SECRET` — minimum 32 characters
- `AUTH_BACKEND_BASE_URL`
- `AUTH_STATE_SECRET` — minimum 32 characters
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Optional/defaulted backend variables include:

- `NODE_ENV` — default `development`; valid: `development`, `production`, `test`
- `PORT` — default `3000`
- `DIRECT_URL`
- `JWT_EXPIRES_IN` — default `15m`
- `JWT_REFRESH_EXPIRES_IN` — default `7d`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `PEXELS_API_KEY`
- `AUTH_APP_SCHEME` — default `kitchen-hub`
- `AUTH_SKIP_EMAIL_VERIFICATION` — default `false`; rejected when `NODE_ENV=production` and set true
- `SUPABASE_SERVICE_ROLE_KEY`
- `RECIPE_IMAGE_SIGNED_URL_TTL_SECONDS` — default `604800`
- `RECIPE_IMAGE_UPLOADS_PER_HOUR` — default `60`
- `RECIPE_IMAGE_UPLOAD_BURST` — default `10`
- `LOG_LEVEL` — default `info`
- `LOG_FORMAT` — default `json`
- `SENTRY_DSN` / `SENTRY_ENVIRONMENT` / `SENTRY_TRACES_SAMPLE_RATE`
- `CATALOG_ICONS_BASE_URL`
- SMTP/email verification variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS`
- `LEGAL_PRIVACY_POLICY_URL` / `LEGAL_TERMS_OF_SERVICE_URL`
- `SUBSCRIPTIONS_REVENUECAT_WEBHOOK_AUTH_HEADER` / `SUBSCRIPTIONS_REVENUECAT_WEBHOOK_AUTH_SECRET` — must be set together if used

## Mobile runtime variables

Read by current mobile source:

- `EXPO_PUBLIC_API_URL`
  - Source: `mobile/src/config/apiBaseUrl.ts`
  - Default: `http://localhost:3000`
  - Behavior: trims whitespace and removes one trailing slash.
- `EXPO_PUBLIC_API_VERSION`
  - Source: `mobile/src/config/index.ts`
  - Default: `1`
- `EXPO_PUBLIC_USE_MOCK_DATA`
  - Source: `mobile/src/config/index.ts` via `isMockDataEnabled()`
  - Used to force guest/mock data behavior.

`mobile/.env.final.example` also documents release/test helper variables for Fastlane and E2E flows, including App Store Connect, Android keystore, Google Play, and E2E URLs.

## Expo/EAS configuration

- Product version is read from repo-root `version.json` by `mobile/app.config.js`.
- `APP_VERSION` is only a fallback when `version.json` is unavailable.
- `app.config.js` derives `updates.url` from `expo.extra.eas.projectId` when present.
- OTA updates are disabled when `NODE_ENV=development`.
- `mobile/eas.json` profiles:
  - `preview`: internal distribution, channel `develop`, Android APK
  - `production`: store distribution, channel `main`, remote credentials, Android app bundle, auto-increment enabled

## Vercel/backend deployment

Backend deployment is documented in `backend/DEPLOYMENT.md` and `docs/deployment/vercel-monorepo.md`.

Current backend Vercel settings from source:

- Root Directory: `backend`
- Config: `backend/vercel.json`
- Build command: `npm run vercel-build`
- Output directory: `public`
- Serverless route: `/api/[...path].ts`
- Legal rewrites: `/privacy`, `/terms`, `/delete-account`
- Function max duration: 30 seconds for `api/[...path].ts`

Manual backend redeploys use `.github/workflows/manual-deploy.yml` with `redeploy_backend_vercel=true` and require GitHub secret `VERCEL_DEPLOY_HOOK_URL`.

## Safety rules

- Do not commit real `.env` files or secret values.
- Configure backend production runtime variables in the backend Vercel project.
- Keep mobile `EXPO_PUBLIC_*` values non-secret: Expo public variables are bundled into the client.
- Do not change app IDs, OTA channels, EAS runtime/update policy, or store release credentials without explicit approval.
