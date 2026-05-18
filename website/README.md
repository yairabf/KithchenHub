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

The landing page currently uses clearly named placeholder anchors:

- `#TODO_APP_STORE_URL`
- `#TODO_GOOGLE_PLAY_URL`

Replace both occurrences in `index.html` after the final App Store and Google Play listing URLs are available.

## Validation

Run this from the repository root after editing the static landing page:

```bash
node website/validate-landing.mjs
```
