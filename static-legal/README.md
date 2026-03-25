# Legal static pages (Vercel)

Static hosting for **Privacy Policy** (`privacy.html`) and **Terms of Service** (`terms.html`). Markdown sources: `legal/privacy-policy-v1.md` and `legal/terms-of-service-v1.md` — update the HTML when those change materially.

## Deploy on Vercel (recommended)

1. In [Vercel](https://vercel.com), create a **new project** and set the **root directory** to `static-legal` (monorepo import).
2. No build command is required; Vercel serves files from this folder.
3. After deploy, URLs are `https://<project>.vercel.app/privacy` and `https://<project>.vercel.app/terms` (and `.html` variants).
4. Optional: assign a custom domain (e.g. `legal.yourdomain.com` or a path on your main site via DNS/proxy).
5. Point the mobile app and store listings at that URL:
   - Set `EXPO_PUBLIC_PRIVACY_POLICY_URL` in EAS secrets / env to your deployed URL, **or**
   - Update `mobile/src/common/constants/legal.ts` default `PRIVACY_POLICY_URL`.

## Supabase Storage (alternative)

You can upload `privacy.html` to a **public** Storage bucket and use the object URL in store consoles. URLs are typically long (`…/storage/v1/object/public/...`); Vercel (or your own domain) is usually better for App Store / Play **Privacy Policy URL** fields.

## Backend API deployment

The backend `vercel-build` script still copies these files from `static-legal/` into `backend/public/` when present, so the Nest/Vercel API project can also serve `/privacy` if you keep that setup.
