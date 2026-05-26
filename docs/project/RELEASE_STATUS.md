# KitchenHub Release Status

Use this file as the current release/review status snapshot for agents. Update it when store status, build status, review state, or release blockers change.

## Current status

As of 2026-05-25:

- Android / Google Play: accepted and live in the store.
- iOS / Apple App Review: prior status was submitted/pending; the latest known store-upload issue was a failed Fastlane/TestFlight upload caused by stale iOS marketing version `1.0.0`.
- Branch `fix/store-release-versioning` / commit `b06a087` contains a QA-passed fix that bumps `version.json` to `1.0.1`, fails early on stale store versions, validates iOS against App Store Connect before TestFlight/App Store paths, aligns Android `versionName`, and keeps production listing asset upload manual-only.

Live Fastlane/App Store Connect/Google Play execution was not run in the local docs/review/QA environment because Ruby/Fastlane and approved store side effects were unavailable. Treat the branch as QA-passed for local/static validation, not as a confirmed store upload.

## Recent release/compliance work completed

- Added store release versioning automation after an iOS upload failure reused stale marketing version `1.0.0`: `npm run verify:store-version`, Fastlane iOS live-version validation, iOS build-number incrementing from TestFlight, Android `versionName` alignment from repo-root `version.json`, and Android `versionCode` calculation from Google Play tracks.
- Added manual production store listing asset automation: `.github/workflows/mobile-store-assets.yml`, Fastlane `store_assets` lanes, npm `release:*:store-assets` scripts, and metadata/screenshot scaffolding under `mobile/fastlane/`. These upload listing assets only; they do not upload binaries, submit App Store review, or roll out Google Play production.
- Created App Store screenshot sets for:
  - 6.5-inch iPhone display
  - 13-inch iPad portrait display
  - 13-inch iPad landscape display
- Used separate demo review user, not Yair's personal account.
- Ensured recipe screenshots show a real recipe image/header image.
- Resolved Google Play Data Safety rejection by declaring Device or other IDs and related user data categories.
- Added public account deletion page required by Google Play.
- Restored support-page rewrites while adding delete-account routes.
- Added QA-passed support intake surfaces: public `website/support.html` / `static-legal/support.html`, mobile Settings → Help & Support → `SupportTicket`, support email migration to `yair.solutions.19@gmail.com`, and signed-in backend-first support ticket submission through protected/rate-limited `POST /api/v1/support/tickets`.

## Public URLs to keep verified

- `https://kithchensync1.vercel.app/privacy`
- `https://kithchensync1.vercel.app/terms`
- `https://kithchensync1.vercel.app/support`
- `https://kithchensync1.vercel.app/delete-account`

Support URL note: source now includes `static-legal/support.html`, `website/support.html`, and `/support` + `/support/` rewrites in `backend/vercel.json`. Verify the deployed route before updating store metadata.

Current support intake note: signed-in mobile support submissions are backend-first via protected `POST /api/v1/support/tickets`; the backend sends the ticket through Resend/`EMAIL_FROM` to `yair.solutions.19@gmail.com` and uses the submitter contact email as `reply_to`. The mobile screen keeps `Email support instead` as the `mailto:` fallback to `yair.solutions.19@gmail.com` with subject format `[FullHouse Support][{platform}][{category}] {summary}` for backend/offline/unauthenticated fallback. Public static support pages remain mailto-backed unless/until they are wired to the backend endpoint.

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

## Store versioning and manual asset automation

Current source of truth and safeguards:

- Store marketing version: repo-root `version.json` (`1.0.1` on the QA-passed branch).
- Local/CI validation: `npm --prefix mobile run verify:store-version` or `npm run verify:store-version` from `mobile/`.
- Optional comparison env vars: `STORE_CURRENT_VERSION` or `IOS_CURRENT_STORE_VERSION`.
- iOS Fastlane internal/prod lanes read `version.json`, reject `1.0.0`, require the marketing version to be greater than the live App Store version when App Store Connect returns one, and patch `CFBundleShortVersionString` / build number before upload or submission.
- Android Fastlane internal lane reads the same `version.json` for `versionName`, computes a monotonic `versionCode` from Play tracks, then patches the generated Gradle project before building the AAB.
- Store listing assets are uploaded only by manual npm commands (`release:ios:store-assets`, `release:android:store-assets`, `release:stores:store-assets`) or the workflow-dispatched **Mobile store listing assets (manual)** workflow.

## Protected release settings

Do not change without explicit approval:

- Android package: `com.kitchenhub.app`
- iOS bundle identifier: `com.kitchenhub.app`
- Expo runtime version policy: `appVersion`
- EAS preview channel: `develop`
- EAS production channel: `main`
- Product version source of truth: repo-root `version.json`
