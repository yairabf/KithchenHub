# App Store Privacy — Kitchen Hub / FullHouse

This document summarizes the source-backed **App Store Connect App Privacy** / Privacy Nutrition Label baseline and the matching iOS privacy manifest configuration.

Current source references:

- `mobile/app.json` → `expo.ios.privacyManifests`
- `mobile/package.json`
- `mobile/src/features/recipes/components/AddRecipeModal/AddRecipeModal.tsx`
- `mobile/src/features/subscription/*`
- `backend/src/modules/subscriptions/*`
- `legal/privacy-policy-v1.md`

## Current privacy answers

- Data used for tracking: No.
- Data used for third-party advertising: No.
- Data linked to user: Yes for account/service data; not for anonymous diagnostics/device identifiers if configured as anonymous.

## Data categories to keep aligned

- Contact info / Personal info
  - Data: Name, Email address
  - Purpose: Account management, Authentication
  - Linked to user: Yes for signed-in users
  - Manifest source: `NSPrivacyCollectedDataTypeName`, `NSPrivacyCollectedDataTypeEmailAddress`

- User content
  - Data: household content such as shopping lists, recipes, chores, member/invite/household data
  - Purpose: App functionality
  - Linked to user: Yes for signed-in users
  - Manifest source: `NSPrivacyCollectedDataTypeOtherUserContent`

- Photos
  - Data: recipe images selected from the photo library
  - Purpose: App functionality
  - Linked to user: Yes for signed-in recipe/image features
  - Permission source: `NSPhotoLibraryUsageDescription` in `mobile/app.json`
  - Implementation source: `expo-image-picker` in `AddRecipeModal.tsx`

- Identifiers / Device ID
  - Data: device/vendor/SDK identifiers if collected by diagnostics, store/billing, or runtime SDKs
  - Purpose: Diagnostics or app functionality/security depending on SDK behavior
  - Linked to user: current manifest marks `NSPrivacyCollectedDataTypeDeviceID` as not linked
  - Tracking: false

- Usage data / Product interaction
  - Data: product/app interactions where applicable
  - Purpose: Analytics/service improvement
  - Linked to user: current manifest marks `NSPrivacyCollectedDataTypeProductInteraction` as linked
  - Tracking: false

- Purchases / Purchase history
  - Data: subscription/purchase state if paid features are enabled
  - Purpose: App functionality, Account management
  - Linked to user: Yes when associated with account/household entitlement records
  - Source note: RevenueCat purchase dependencies and subscription reconciliation code exist. Confirm App Store Connect purchase-data declarations before submitting a paid/subscription-enabled build.

## iOS privacy manifest source

The Expo config currently declares `NSPrivacyCollectedDataTypes` in:

```text
mobile/app.json
```

Current manifest entries include:

- `NSPrivacyCollectedDataTypeName`
- `NSPrivacyCollectedDataTypeEmailAddress`
- `NSPrivacyCollectedDataTypeOtherUserContent`
- `NSPrivacyCollectedDataTypeDeviceID`
- `NSPrivacyCollectedDataTypeProductInteraction`
- `NSPrivacyTracking: false`

If App Store Connect declares purchases or photos as collected, verify whether those categories also need explicit `NSPrivacyCollectedDataTypes` entries in `mobile/app.json` before the next iOS submission.

## Where to configure

- App Store Connect: App Privacy.
- iOS privacy manifest source: `mobile/app.json` → `expo.ios.privacyManifests`.
- Privacy policy markdown source: `legal/privacy-policy-v1.md`.
- Hosted privacy URL: deployed `static-legal/privacy.html` or backend-served `/privacy`.

## When to update

Any change in data collection, SDKs, billing, diagnostics, or legal disclosure requires:

1. Update App Store Connect → App Privacy.
2. Update `mobile/app.json` privacy manifest entries if needed.
3. Update `docs/compliance/google-play-data-safety.md`.
4. Update `legal/privacy-policy-v1.md` and regenerate/update `static-legal/privacy.html` if the legal text changes materially.

## Open verification items

- Confirm the exact App Store Connect Nutrition Label choices for RevenueCat/store purchases before the next paid/subscription-enabled iOS submission.
- Confirm whether selected recipe photos should be declared as Photos in App Store Connect and represented explicitly in the privacy manifest for the next build.
