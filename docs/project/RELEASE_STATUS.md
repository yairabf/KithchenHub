# KitchenHub Release Status

Use this file as the current release/review status snapshot for agents. Update it when store status, build status, review state, or release blockers change.

## Current status

As of 2026-05-17:

- Android / Google Play: accepted and live in the store.
- iOS / Apple App Review: rejected for Guideline 3.1.2(c) because App Store metadata did not include a functional Terms of Use/EULA link for auto-renewable subscriptions.
- Resubmission prerequisites:
  - Merge/deploy PR #221's Premium paywall subscription disclosure/legal-link fix.
  - In App Store Connect, keep Privacy Policy URL as `https://kithchensync1.vercel.app/privacy`.
  - Add `Terms of Use (EULA): https://kithchensync1.vercel.app/terms` to the App Description or configure the EULA/License Agreement field.
  - Attach/provide review notes and screen recording that show Premium screen title, duration, price/free-trial info, auto-renewal disclosure, Privacy Policy link, Terms of Use/EULA link, and Restore Purchases.

## Recent release/compliance work completed

- Created App Store screenshot sets for:
  - 6.5-inch iPhone display
  - 13-inch iPad portrait display
  - 13-inch iPad landscape display
- Used separate demo review user, not Yair's personal account.
- Ensured recipe screenshots show a real recipe image/header image.
- Resolved Google Play Data Safety rejection by declaring Device or other IDs and related user data categories.
- Added public account deletion page required by Google Play.
- Restored support-page rewrites while adding delete-account routes.
- Prepared App Store Guideline 3.1.2(c) resubmission docs for PR #221 and the required App Store Connect metadata update.

## Public URLs to keep verified

- `https://kithchensync1.vercel.app/privacy`
- `https://kithchensync1.vercel.app/terms`
- `https://kithchensync1.vercel.app/delete-account`
- `https://kithchensync1.vercel.app/support`

Support URL note: current source includes `static-legal/support.html` and `/support` + `/support/` rewrites in `backend/vercel.json`. Keep this URL in store metadata only while both remain present and verified.

## Screenshot locations

```text
mobile/store-screenshots/app-store-6.5-display/live-test-user/
mobile/store-screenshots/app-store-ipad-13-display/live-test-user/
mobile/store-screenshots/app-store-ipad-13-landscape-display/live-test-user/
```

## If Apple rejects the app

When Apple returns a message:

1. Save/paste the exact rejection text into the active working session.
2. Identify whether it is a metadata, screenshots, legal URL, auth, privacy, or binary issue.
3. Check `docs/project/STORE_COMPLIANCE.md` first.
4. Load the relevant Hermes skill before acting.
5. Make the smallest correction that directly addresses the rejection.
6. Verify any public URLs or screenshots before resubmission.
7. Update this file and `docs/project/RECENT_CHANGES.md` after resolution.

## If Android gets a follow-up warning

Likely areas to check first:

- Google Play Data Safety declarations
- Device or other IDs
- Account deletion URL
- target age / Families policy answers
- SDK Index guidance for RevenueCat / Expo / Play Billing

Current accepted Data Safety baseline is documented in `docs/project/STORE_COMPLIANCE.md`.

## Protected release settings

Do not change without explicit approval:

- Android package: `com.kitchenhub.app`
- iOS bundle identifier: `com.kitchenhub.app`
- Expo runtime version policy: `appVersion`
- EAS preview channel: `develop`
- EAS production channel: `main`
- Product version source of truth: repo-root `version.json`
