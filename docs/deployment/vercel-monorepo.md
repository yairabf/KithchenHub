# Vercel — one repo, two projects (Kitchen Hub)

This monorepo uses **two separate Vercel projects** connected to the **same GitHub repository**. Each project sets a different **Root Directory** so builds do not step on each other.

Mobile is **not** deployed to Vercel — it ships to the App Store and Google Play via Fastlane. See `.github/workflows/mobile-native-store-release.yml`.

Current backend deployment guide: [`backend/DEPLOYMENT.md`](../../backend/DEPLOYMENT.md).

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

For the source-backed environment checklist, see [`backend/docs/ENV_VAR_CHECKLIST.md`](../../backend/docs/ENV_VAR_CHECKLIST.md).

Manual backend redeploys can be triggered from `.github/workflows/manual-deploy.yml` by setting `redeploy_backend_vercel=true`; that path requires the GitHub secret `VERCEL_DEPLOY_HOOK_URL`.

## Project 2 — Marketing website (static)

| Vercel setting | Value |
|----------------|--------|
| **Root Directory** | `website` |
| **Framework Preset** | Other |
| **Build Command** | *(empty)* |
| **Output Directory** | *(empty or `.`)* |
| **Install Command** | *(empty; not required for static HTML/CSS)* |

This project serves the public landing page from `website/index.html` and keeps marketing content separate from the API deployment.

## Checklist after errors

1. **Each project's Root Directory** is exactly `backend` or `website` (not `.`, not `static-legal`, not `mobile`).
2. **Redeploy** after changing `.vercelignore`.
3. **Branch** connected in Vercel includes `backend/` and `website/` (and `static-legal/` for backend legal copy).
4. **Separate env vars** per project — backend secrets must not be assumed on the website project.
