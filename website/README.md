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

The landing page uses the live store listing URLs by default:

- iOS: `https://apps.apple.com/us/app/fullhouse-household-manager/id6761058717`
- Android: `https://play.google.com/store/apps/details?id=com.kitchenhub.app`

Do not ship placeholder `#TODO_*` badge links; if a store URL is unavailable in the future, render that badge as visibly disabled / coming soon instead of an active anchor.

When deployed through the backend Vercel build, these links can be overridden with Vercel environment variables:

- `FULLHOUSE_APP_STORE_URL` — must be an `https://apps.apple.com/...` URL
- `FULLHOUSE_GOOGLE_PLAY_URL` — must be an `https://play.google.com/...` URL

The build validates the URL scheme and host before writing `backend/public/index.html`.

## Same-site legal routes

The landing deployment serves the legal pages on same-site routes used by the footer:

- `/privacy`
- `/terms`
- `/support`
- `/delete-account`

The source files are copied into this directory from the shared `static-legal/` pages so the marketing site can be deployed as the public root without breaking store compliance links.

## Support intake

`support.html` is a mobile-first guided support ticket form. It collects issue topic, details, context, contact email, attachment notes, and privacy acknowledgment, then creates a `mailto:` draft addressed to `yair.solutions.19@gmail.com`.

Mobile app support submissions are backend-first via `POST /api/v1/support/tickets`. The backend forwards the ticket by Resend from configured `EMAIL_FROM` to `yair.solutions.19@gmail.com` with `reply_to` set to the submitter contact email. The mobile `Email support instead` fallback still opens the same `mailto:` draft.

Support ticket subjects use this shape:

```text
[FullHouse Support][{platform}][{category}] {summary}
```

Generated email bodies include the recommended Gmail routing label `KitchenHub/Support/Issues/New` so a future support agent can watch that label/folder and convert submissions into dev-team tasks. The static website support page currently remains mailto-backed; the mobile app posts to the backend support-intake endpoint first.

## Validation

Run this from the repository root after editing the static landing page:

```bash
node website/validate-landing.mjs
```

The validator also checks that the support form keeps hidden controls hidden and guards the static CSS/JS patterns used to avoid sticky action-button overlap across form steps.
