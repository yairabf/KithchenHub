# Vercel — one repo, three projects (Kitchen Hub)

This monorepo is meant to use **three separate Vercel projects** connected to the **same GitHub repository**. Each project sets a different **Root Directory** so builds do not step on each other.

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
- **Legal links:** the app loads URLs from **`GET /api/v1/client-links`** on the API. Until that request succeeds, it uses **`{EXPO_PUBLIC_API_URL}/privacy`** and **`/terms`** as fallback. To point users elsewhere without a mobile release, set backend env **`LEGAL_PRIVACY_POLICY_URL`** / **`LEGAL_TERMS_OF_SERVICE_URL`** (or keep defaults derived from **`AUTH_BACKEND_BASE_URL`**).
- Optional: **`APP_VERSION`** if you do not rely on repo-root `version.json` (often omitted from the Vercel upload via `.vercelignore`; `app.config.js` falls back to `APP_VERSION` or `1.0.0`).

### Node version

Use **Node 20.x** (or the version your Expo SDK recommends) in Vercel → Project → Settings → General → Node.js Version.

## Project 3 — Marketing website (static)

| Vercel setting | Value |
|----------------|--------|
| **Root Directory** | `website` |
| **Framework Preset** | Other |
| **Build Command** | *(empty)* |
| **Output Directory** | *(empty or `.`)* |
| **Install Command** | *(empty; not required for static HTML/CSS)* |

This project serves the public landing page from `website/index.html` and keeps marketing content separate from API and mobile-web deployments.

## Checklist after errors

1. **Each project’s Root Directory** is exactly `backend`, `mobile`, or `website` (not `.`, not `static-legal`).
2. **Redeploy** after changing `.vercelignore` (e.g. `/mobile/` must stay removed).
3. **Branch** connected in Vercel includes `backend/`, `mobile/`, and `website/` (and `static-legal/` for backend legal copy).
4. **Separate env vars** per project — backend secrets must not be assumed on the mobile project.
5. **`Unable to resolve module … fullhouse_icon.png` (or any `assets/**/*.png`)** — the repo `.vercelignore` must **not** use a blanket `*.png` rule (that strips `mobile/assets/`). Use `/*.png` if you only want to ignore PNGs at the monorepo root.

## Related

- [vercel-mobile-web.md](./vercel-mobile-web.md) — Expo-specific troubleshooting (e.g. missing `mobile/package.json`).
