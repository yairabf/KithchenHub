# Website (Marketing Landing Page)

This folder contains the static marketing site for FullHouse (Kitchen Hub).

## Deploy on Vercel

1. Create a new Vercel project from this repository.
2. Set **Root Directory** to `website`.
3. Use **Framework Preset**: `Other`.
4. Leave **Build Command** empty.
5. Leave **Output Directory** empty (or set to `.`).

The entry page is `index.html` and styles are in `styles.css`.

## Store links

The landing page uses the live store listing URLs:

- iOS: `https://apps.apple.com/us/app/fullhouse-household-manager/id6761058717`
- Android: `https://play.google.com/store/apps/details?id=com.kitchenhub.app`

Do not ship placeholder `#TODO_*` badge links; if a store URL is unavailable in the future, render that badge as visibly disabled / coming soon instead of an active anchor.

## Same-site legal routes

The landing deployment serves the legal pages on same-site routes used by the footer:

- `/privacy`
- `/terms`
- `/delete-account`

The source files are copied into this directory from the shared `static-legal/` pages so the marketing site can be deployed as the public root without breaking store compliance links.

## Validation

Run this from the repository root after editing the static landing page:

```bash
node website/validate-landing.mjs
```
