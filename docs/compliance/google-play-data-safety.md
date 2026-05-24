# Google Play Data Safety — Kitchen Hub / FullHouse

This document summarizes the **Google Play Data Safety** baseline for the Play Console form. Use it when filling or updating the form so the store listing stays consistent with current source, legal docs, and SDK usage.

Current source references:

- `mobile/app.json`
- `mobile/package.json`
- `mobile/src/features/subscription/*`
- `mobile/src/features/recipes/components/AddRecipeModal/AddRecipeModal.tsx`
- `backend/src/modules/subscriptions/*`
- `backend/src/common/monitoring/*`
- `legal/privacy-policy-v1.md`

## Data collected

Declare each applicable row as **collected**. Do **not** declare advertising or marketing as a purpose unless the app behavior changes.

- Personal info
  - Data types: Name, Email address
  - Collected: Yes
  - Shared: No, unless a store/SDK form treats processors such as auth/database providers as sharing
  - Required: Yes for signed-in account features
  - Linked to user: Yes
  - Purposes: App functionality, Account management, Authentication

- Financial info
  - Data types: Purchase history
  - Collected: Yes when subscriptions/purchases are enabled
  - Shared: No for advertising; purchases are processed by Apple/Google/RevenueCat according to their roles/policies
  - Required: Optional
  - Linked to user: Yes
  - Purposes: App functionality, Account management
  - Source note: `react-native-purchases`, subscription paywall/services, and backend subscription reconciliation exist in source.

- Photos and videos
  - Data types: Photos
  - Collected: Yes when users add recipe images
  - Shared: No for advertising
  - Required: Optional
  - Linked to user: Yes for signed-in recipe/image features
  - Purpose: App functionality
  - Source note: `expo-image-picker` and `requestMediaLibraryPermissionsAsync()` / `launchImageLibraryAsync()` are used for recipe images.

- App activity
  - Data types: App interactions / usage events where applicable
  - Collected: Yes if API/sync/diagnostic usage events are retained or analyzed
  - Shared: No for advertising
  - Required: Required for service operation/diagnostics where applicable
  - Linked to user: Yes when tied to account/service records
  - Purposes: App functionality, Analytics/service improvement

- Device or other IDs
  - Data types: Device or other IDs
  - Collected: Yes if SDKs or diagnostics collect identifiers for app functionality, analytics, fraud prevention/security/compliance, or account management
  - Shared: No for advertising
  - Required: Required where SDK/runtime requires it
  - Linked to user: confirm in Play Console against SDK behavior; previous accepted baseline treated this as linked to user
  - Purposes: App functionality, Analytics, Fraud prevention/security/compliance, Account management if applicable
  - Source note: `docs/project/STORE_COMPLIANCE.md` records that Google previously flagged this category and Android acceptance followed after adding it.

- User-generated content
  - Data types: Other user-generated content
  - Covers: household content such as shopping items, recipes, ingredients, chores, member/invite/household data
  - Collected: Yes
  - Shared: No for advertising
  - Required: Required for signed-in service functionality
  - Linked to user: Yes
  - Purpose: App functionality

- App info and performance
  - Data types: Diagnostics, crash logs, performance data if selected by SDK guidance
  - Collected: Yes if Sentry/SDK diagnostics are enabled for the environment
  - Shared: No for advertising
  - Required: Required/optional depending on SDK behavior and configuration
  - Linked to user: usually No for anonymous diagnostics unless configured otherwise
  - Purposes: App functionality, Analytics/service improvement

## Security and deletion

- Is data encrypted in transit? Yes.
- Can users request/delete their data? Yes.
  - In-app account deletion exists in Settings for signed-in users.
  - Public deletion instructions live at `/delete-account`.
  - Fallback request email: `yair.solutions.19@gmail.com`.

## Sharing and advertising

- Do you sell data? No.
- Do you share data for advertising? No.
- Do you use data for cross-app tracking? No.

## Where to configure

- Play Console: Policy → App content → Data safety.
- Privacy policy: `legal/privacy-policy-v1.md`.
- Hosted privacy URL: use the deployed `/privacy` page from the backend/static legal deployment.
- Account deletion URL: use the deployed `/delete-account` page.

## When to update

Update this doc, the Play Console form, App Store privacy docs, and the privacy policy whenever:

- a new SDK is added or removed
- subscription/billing behavior changes
- recipe image/photo behavior changes
- analytics/diagnostics settings change
- account deletion or data retention behavior changes

## Open verification items

- Re-check current Play SDK Index guidance for RevenueCat, Expo, and Play Billing before the next Android submission.
- Confirm whether Play Console treats RevenueCat/store billing data as shared with a third party under the current form wording.
