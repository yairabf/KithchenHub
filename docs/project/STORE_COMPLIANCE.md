# KitchenHub Store Compliance

Use this file as the project-local reference for App Store / Google Play compliance work. Keep it practical and update it whenever review status, legal URLs, screenshots, or data-safety declarations change.

## Current store status

As of 2026-05-15:

- Google Play / Android: accepted and live in the store.
- Apple App Review / iOS: submitted and waiting for review result.

If a review rejection arrives, paste the exact message into the working session and update this file after the issue is resolved.

## App identity

Public product naming may use KitchenHub / FullHouse depending on store copy and legacy context. Be careful to preserve the current store-facing name in metadata and legal pages.

Protected mobile identifiers:

- Android package: `com.kitchenhub.app`
- iOS bundle identifier: `com.kitchenhub.app`

Do not change app identifiers without explicit approval.

## Store release versioning

As of the QA-passed `fix/store-release-versioning` branch (commit `b06a087`), store uploads use repo-root `version.json` as the canonical marketing version. This was added after a failed iOS Fastlane/TestFlight upload reused `1.0.0` and App Store Connect rejected it as a closed pre-release train.

Current safeguards:

- `version.json` is `1.0.1` on the branch and should be bumped for future store releases.
- `npm --prefix mobile run verify:store-version` rejects stale `1.0.0`, validates `MAJOR.MINOR.PATCH`, and can compare against `STORE_CURRENT_VERSION` / `IOS_CURRENT_STORE_VERSION`.
- `.github/workflows/mobile-native-store-release.yml` runs `npm run verify:store-version` before Android and iOS Fastlane upload paths.
- iOS Fastlane validates `version.json` against the live App Store version via App Store Connect when available, then patches `CFBundleShortVersionString` and the build number before TestFlight/App Store operations.
- Android Fastlane uses `version.json` as `versionName`, computes the next `versionCode` from Play tracks, and patches generated Gradle config before building the release AAB.

Live Fastlane/store API execution still requires a credentialed runner and explicit approval before producing store side effects.

## Public legal/support URLs

Production Vercel alias:

```text
https://kithchensync1.vercel.app
```

Important public pages:

- Privacy: `https://kithchensync1.vercel.app/privacy`
- Terms / Terms of Use (EULA): `https://kithchensync1.vercel.app/terms`
- Support: `https://kithchensync1.vercel.app/support` (verify after deployment before using in store metadata)
- Account deletion: `https://kithchensync1.vercel.app/delete-account`

Support URL status: `static-legal/support.html`, `website/support.html`, and `/support` rewrites now exist in source. Verify the deployed route after release before using `/support` in store metadata.

Static source files:

```text
static-legal/privacy.html
static-legal/support.html
static-legal/terms.html
static-legal/delete-account.html
static-legal/assets/delete-account/
```

Vercel/backend routing and copy behavior:

```text
backend/vercel.json
backend/scripts/create-vercel-output-dir.js
```

Important pitfall: source now includes the support page and route references, but store listings should still use `https://kithchensync1.vercel.app/support` only after the deployed route is verified with HTTP 200. Until then, use email/support metadata rather than assuming the public route is live.

## Support intake

Current support email:

```text
yair.solutions.19@gmail.com
```

Current support intake surfaces:

- Public/static support pages: `website/support.html` and `static-legal/support.html`.
- Mobile app entry point: Settings → Help & Support → `SupportTicket` screen.
- Submission handoff: mobile app submits backend-first to `POST /api/v1/support/tickets`; backend forwards through Resend/`EMAIL_FROM` to `yair.solutions.19@gmail.com` with `reply_to` set to the submitter contact email. Public/static support pages and the mobile fallback remain `mailto:`-backed.
- Subject format: `[FullHouse Support][{platform}][{category}] {summary}`.
- Recommended Gmail label/folder for future support-agent routing: `KitchenHub/Support/Issues/New`.

## Account deletion URL

Google Play requires a public Delete account URL when the app supports account creation/OAuth.

Current URL:

```text
https://kithchensync1.vercel.app/delete-account
```

The page documents:

- in-app deletion path through settings/profile
- permanent deletion confirmation
- fallback email request path: `yair.solutions.19@gmail.com`
- data deleted
- data that may be retained for legal/security/payment requirements
- approximate processing period

The app also has an in-app delete account flow; the public page exists because Google Play requires an externally accessible deletion request/instruction URL.

## Google Play Data Safety declaration

Latest resolved issue:

- Google flagged missing **Device or other IDs** declaration.
- Data safety form was updated and Android was accepted.

Data types that should remain declared unless the app materially changes:

### Personal info

- Name
- Email address

Recommended settings:

- Collected: Yes
- Shared: No
- Required: Yes
- Linked to user: Yes
- Purposes: App functionality, Account management
- Advertising/tracking: No

### Financial info

- Purchase history

Recommended settings:

- Collected: Yes
- Shared: No
- Required: Optional
- Linked to user: Yes
- Purposes: App functionality, Account management
- Advertising/tracking: No

### Photos and videos

- Photos

Recommended settings:

- Collected: Yes
- Shared: No
- Required: Optional
- Linked to user: Yes
- Purpose: App functionality
- Advertising/tracking: No

### App activity

- App interactions

Recommended settings:

- Collected: Yes
- Shared: No
- Required: Required
- Linked to user: Yes
- Purposes: App functionality, Analytics
- Advertising/tracking: No

### Device or other IDs

- Device or other IDs

Recommended settings:

- Collected: Yes
- Shared: No
- Required: Required
- Linked to user: Yes
- Purposes: App functionality, Analytics, Fraud prevention/security/compliance, Account management if available
- Advertising/tracking: No

### User-generated content

- Other user-generated content

Covers household content such as shopping items, recipes, ingredients, chores, member/invite/household data.

Recommended settings:

- Collected: Yes
- Shared: No
- Required: Required
- Linked to user: Yes
- Purpose: App functionality
- Advertising/tracking: No

### App info and performance

- Diagnostics, if selected / shown by SDK guidance

Recommended settings if used:

- Collected: Yes
- Shared: No
- Required: Required
- Linked to user: No
- Purposes: App functionality, Analytics
- Advertising/tracking: No

## Account creation methods in Google Play

Current form choices used:

- Encrypted in transit: Yes
- Account creation methods:
  - Username and password
  - OAuth
- Families policy commitment: Yes, when prompted by target-age/families settings

## Manual production listing asset automation

Production listing copy and screenshots can be uploaded deliberately, without uploading binaries or triggering production rollout:

- Fastlane asset guide: `mobile/fastlane/STORE_ASSETS.md`.
- iOS metadata: `mobile/fastlane/metadata/ios/en-US/`.
- iOS screenshots: `mobile/fastlane/screenshots/en-US/`.
- Android metadata/screenshots: `mobile/fastlane/metadata/android/en-US/`.
- Local commands: `npm run release:ios:store-assets`, `npm run release:android:store-assets`, `npm run release:stores:store-assets`.
- Manual GitHub Actions workflow: `.github/workflows/mobile-store-assets.yml` (**Mobile store listing assets (manual)**) with `workflow_dispatch` platform choice `both`, `ios`, or `android`.

These paths are for listing assets only: they skip binary upload, do not submit App Store review, and do not roll out Google Play production. Verify `https://kithchensync1.vercel.app/support` returns HTTP 200 before uploading metadata that depends on the support URL.

## Screenshot assets

Recent App Store screenshot sets were created with a separate demo user, not Yair's account.

Demo user used for store screenshots:

```text
appstore.review.1778830786951@example.com
```

Recent screenshot sets:

```text
mobile/store-screenshots/app-store-6.5-display/live-test-user/
mobile/store-screenshots/app-store-ipad-13-display/live-test-user/
mobile/store-screenshots/app-store-ipad-13-landscape-display/live-test-user/
```

Zip outputs:

```text
mobile/store-screenshots/app-store-6.5-display/fullhouse-appstore-6.5-live-test-user.zip
mobile/store-screenshots/app-store-ipad-13-display/fullhouse-appstore-ipad-13-live-test-user.zip
mobile/store-screenshots/app-store-ipad-13-landscape-display/fullhouse-appstore-ipad-13-landscape-live-test-user.zip
```

Important QA requirement:

- recipe list and recipe detail screenshots should show a real recipe/food image, not a placeholder.
- shopping/chores/settings/dashboard should be populated with review-safe demo data.

## Agent guidance

For future store/compliance work:

1. Preserve existing legal routes and clean URLs.
2. Verify public URLs with HTTP 200 after deployment.
3. Use a separate demo/review user for screenshots and app review data.
4. Do not use Yair's personal account for screenshots.
5. Update this file after each accepted/rejected store review milestone.
