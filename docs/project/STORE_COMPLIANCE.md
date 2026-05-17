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

## Public legal/support URLs

Production Vercel alias:

```text
https://kithchensync1.vercel.app
```

Important public pages:

- Privacy: `https://kithchensync1.vercel.app/privacy`
- Terms: `https://kithchensync1.vercel.app/terms`
- Account deletion: `https://kithchensync1.vercel.app/delete-account`

Support URL status: no `static-legal/support.html` file or `/support` rewrite exists in current source. Do not list `/support` as an active store/support URL unless the page and route are added.

Static source files:

```text
static-legal/privacy.html
static-legal/terms.html
static-legal/delete-account.html
static-legal/assets/delete-account/
```

Vercel/backend routing and copy behavior:

```text
backend/vercel.json
backend/scripts/create-vercel-output-dir.js
```

Important pitfall: if store listings need a clean support URL, add both `static-legal/support.html` and `/support` + `/support/` rewrites in `backend/vercel.json`; otherwise use email/support metadata rather than documenting a non-existent page.

## Account deletion URL

Google Play requires a public Delete account URL when the app supports account creation/OAuth.

Current URL:

```text
https://kithchensync1.vercel.app/delete-account
```

The page documents:

- in-app deletion path through settings/profile
- permanent deletion confirmation
- fallback email request path: `yairabc@gmail.com`
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
