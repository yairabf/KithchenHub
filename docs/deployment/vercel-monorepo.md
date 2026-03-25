# Vercel — one repo, two projects (Kitchen Hub)

This monorepo is meant to use **two separate Vercel projects** connected to the **same GitHub repository**. Each project sets a different **Root Directory** so builds do not step on each other.

## Project 1 — Backend API (Nest + serverless)

| Vercel setting | Value |
|----------------|--------|
| **Root Directory** | `backend` |
| **Framework Preset** | Other (or N/A) |
| **Build Command** | *(from `backend/vercel.json`)* `npm run vercel-build` |
| **Output Directory** | *(from `backend/vercel.json`)* `public` |
| **Install Command** | Default (`npm install` in `backend/`) or `npm ci` if you prefer |

**Important:** `vercel-build` copies `*.html` from the repo root folder **`static-legal/`** into `backend/public/`. That folder must **not** be listed in **`.vercelignore`** (it is not ignored today). Vercel clones the full repo; with Root Directory `backend`, the build script still resolves `../static-legal` from `backend/scripts`.

Configure production env vars in the Vercel dashboard (database, JWT, etc.) — do not commit `.env`.

## Project 2 — Mobile web (Expo export)

| Vercel setting | Value |
|----------------|--------|
| **Root Directory** | `mobile` |
| **Framework Preset** | Other |
| **Build Command** | *(from `mobile/vercel.json`)* `npm run build:web` |
| **Output Directory** | `dist` |
| **Install Command** | *(from `mobile/vercel.json`)* `npm ci` |

**Why Root Directory must be `mobile`:** The app’s `package.json` and Expo config live there. Using the monorepo root without this setting often triggers tools that look for `mobile/package.json` and fail.

**Why `framework` is unset in `mobile/vercel.json`:** Avoids Vercel’s Expo auto-detection fighting monorepo layout. The explicit `buildCommand` runs `expo export --platform web`.

### Environment variables (mobile on Vercel)

- Set **`EXPO_PUBLIC_*`** values your app needs (API URL, Supabase, etc.) in the **mobile** Vercel project.
- Optional: **`APP_VERSION`** if you do not rely on repo-root `version.json` (often omitted from the Vercel upload via `.vercelignore`; `app.config.js` falls back to `APP_VERSION` or `1.0.0`).

### Node version

Use **Node 20.x** (or the version your Expo SDK recommends) in Vercel → Project → Settings → General → Node.js Version.

## Checklist after errors

1. **Each project’s Root Directory** is exactly `backend` or `mobile` (not `.`, not `static-legal`).
2. **Redeploy** after changing `.vercelignore` (e.g. `/mobile/` must stay removed).
3. **Branch** connected in Vercel includes both `backend/` and `mobile/` (and `static-legal/` for backend).
4. **Separate env vars** per project — backend secrets must not be assumed on the mobile project.

## Related

- [vercel-mobile-web.md](./vercel-mobile-web.md) — Expo-specific troubleshooting (e.g. missing `mobile/package.json`).
