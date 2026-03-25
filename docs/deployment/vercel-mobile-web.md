# Vercel — Expo web (Kitchen Hub mobile)

See also **[vercel-monorepo.md](./vercel-monorepo.md)** for the full two-project setup (backend + mobile).

## Recommended project settings

| Setting | Value |
|--------|--------|
| **Root Directory** | `mobile` |
| **Framework Preset** | Expo (or Other) |
| **Build Command** | `npx expo export --platform web` (default from `mobile/vercel.json`) |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` or `npm ci` (runs inside Root Directory) |

Using **`mobile`** as the root keeps `package.json` and Expo config at the top of the deployed tree and avoids monorepo path confusion.

## `ConfigError: …/mobile/package.json does not exist`

Common causes:

1. **`.vercelignore` excluded `/mobile/`** — fixed in-repo so `mobile/` is no longer ignored. Redeploy.
2. **Wrong Root Directory** — If the project root is the monorepo root, either set **Root Directory** to `mobile` in Vercel → Project → Settings → General, or ensure the repo upload actually contains `mobile/` (see above).
3. **Wrong branch / repo** — Confirm the connected Git branch includes the `mobile` folder.

## Backend vs mobile

Use **separate Vercel projects**:

- **API / Nest:** Root Directory **`backend`** (see `backend/vercel.json`).
- **Expo web:** Root Directory **`mobile`** (see `mobile/vercel.json`).

Do not point the Expo project at `backend` or `static-legal`.
