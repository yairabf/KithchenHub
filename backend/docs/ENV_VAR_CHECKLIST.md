# Backend Environment Variable Checklist

Last updated: 2026-05-16

Purpose: source-backed checklist for backend runtime and Vercel deployment variables. Source of truth for validation is `backend/src/config/env.validation.ts`; examples live in `backend/.env.example` and `backend/.env.production.example`.

Do not commit real secret values.

## Required runtime variables

These are required by backend environment validation unless a default is shown.

- `DATABASE_URL` — backend database connection URL.
- `JWT_SECRET` — JWT signing secret, minimum 32 characters.
- `JWT_REFRESH_SECRET` — refresh-token signing secret, minimum 32 characters.
- `AUTH_BACKEND_BASE_URL` — public backend base URL used for generated auth/legal links.
- `AUTH_STATE_SECRET` — OAuth state secret, minimum 32 characters.
- `SUPABASE_URL` — Supabase project URL.
- `SUPABASE_ANON_KEY` — Supabase anon key.

## Defaults / optional runtime variables

- `NODE_ENV` — default: `development`; valid values in source: `development`, `production`, `test`.
- `PORT` — default: `3000`; Vercel injects its own function runtime, local backend uses this value.
- `DIRECT_URL` — optional direct DB URL for migrations when `DATABASE_URL` is pooled.
- `JWT_EXPIRES_IN` — default: `15m`.
- `JWT_REFRESH_EXPIRES_IN` — default: `7d`.
- `AUTH_APP_SCHEME` — default: `kitchen-hub`.
- `AUTH_SKIP_EMAIL_VERIFICATION` — default: `false`; source rejects `true` when `NODE_ENV=production`.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — optional Google OAuth credentials.
- `PEXELS_API_KEY` — optional recipe image search key.
- `SUPABASE_SERVICE_ROLE_KEY` — optional admin/service role key; keep secret if set.
- `RECIPE_IMAGE_SIGNED_URL_TTL_SECONDS` — default: `604800`.
- `RECIPE_IMAGE_UPLOADS_PER_HOUR` — default: `60`.
- `RECIPE_IMAGE_UPLOAD_BURST` — default: `10`.
- `LOG_LEVEL` — default: `info`; valid values: `fatal`, `error`, `warn`, `info`, `debug`, `trace`.
- `LOG_FORMAT` — default: `json`; valid values: `json`, `pretty`.
- `SENTRY_DSN` / `SENTRY_ENVIRONMENT` / `SENTRY_TRACES_SAMPLE_RATE` — optional Sentry configuration; traces default: `0.1`.
- `CATALOG_ICONS_BASE_URL` — optional public base URL for relative catalog icon paths.
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` / `EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS` — optional email verification SMTP config; `SMTP_PORT` default: `587`, `EMAIL_FROM` default: `noreply@kitchenhub.app`, token expiry default: `24` hours.
- `LEGAL_PRIVACY_POLICY_URL` / `LEGAL_TERMS_OF_SERVICE_URL` — optional full legal-link overrides; if unset, links derive from `AUTH_BACKEND_BASE_URL`.
- `SUBSCRIPTIONS_REVENUECAT_WEBHOOK_AUTH_HEADER` / `SUBSCRIPTIONS_REVENUECAT_WEBHOOK_AUTH_SECRET` — optional RevenueCat webhook auth pair; source requires both or neither.

## Vercel deployment/project variables

Set runtime variables in the Vercel backend project, not in committed files.

Recommended Vercel-only/system variables to understand:

- `VERCEL_GIT_COMMIT_SHA` — used by `GET /api/v1/deploy-info` when present.
- `VERCEL_DEPLOYMENT_ID` — returned by deploy-info when present.
- `VERCEL_ENV` — returned by deploy-info when present.
- `APP_VERSION` — optional application version override returned by deploy-info.

For manual GitHub deploy-hook redeploys, `.github/workflows/manual-deploy.yml` expects this GitHub secret:

- `VERCEL_DEPLOY_HOOK_URL` — Vercel deploy hook URL; treat as secret.

## Production checklist

- [ ] Set `NODE_ENV=production`.
- [ ] Use production database URLs for `DATABASE_URL` and, if needed, `DIRECT_URL`.
- [ ] Use production-only values for `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `AUTH_STATE_SECRET`.
- [ ] Set `AUTH_BACKEND_BASE_URL` to the production backend URL.
- [ ] Ensure `AUTH_SKIP_EMAIL_VERIFICATION=false` or unset.
- [ ] Set Supabase production values.
- [ ] Set legal URL overrides if the legal pages are served from a different domain than `AUTH_BACKEND_BASE_URL`.
- [ ] Set RevenueCat webhook auth pair if the subscription webhook is exposed.
- [ ] Verify `GET /api/version`, `GET /api/v1/health`, and `GET /api/v1/deploy-info` after deployment.

## Sources

- `backend/src/config/env.validation.ts`
- `backend/src/config/configuration.ts`
- `backend/.env.example`
- `backend/.env.production.example`
- `.github/workflows/manual-deploy.yml`
