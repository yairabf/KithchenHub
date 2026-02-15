# App Store Privacy — Kitchen Hub

This document summarizes Kitchen Hub’s **App Store Connect App Privacy** declarations and links to related artifacts. Use it when updating the Privacy Nutrition Label or adding new data collection.

## Summary

| Data category   | Collected?        | Purpose             | Linked to user?   |
|-----------------|-------------------|---------------------|-------------------|
| Name            | Yes               | Account management  | Yes (signed-in)   |
| Email           | Yes               | Authentication      | Yes (signed-in)   |
| Photos          | Yes (recipe images)| App functionality  | Yes (signed-in)   |
| User Content    | Yes               | App functionality   | Yes (signed-in)   |
| Device ID       | Yes (anonymous)   | Diagnostics         | No (anonymous)     |
| Usage Data      | Yes               | Analytics           | Per practice      |

**Three summary answers (App Store Connect):**

- **Data used for tracking?** — No  
- **Data linked to user?** — Yes (for signed-in users; Device ID is anonymous)  
- **Data used for advertising?** — No  

## Where to configure

- **App Store Connect:** [App Privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/) — complete the data types and the three questions above so the label matches this summary.
- **Privacy policy:** [legal/privacy-policy-v1.md](../../legal/privacy-policy-v1.md) — single source of truth for store and in-app legal links.

## When to update

Any change in **data collection** (e.g. new SDK, new data type, new purpose) requires:

1. Updating **App Store Connect → App Privacy** so the Nutrition Label stays accurate.
2. Updating the **iOS privacy manifest**: edit [mobile/app.json](../../mobile/app.json) → `expo.ios.privacyManifests`. The file `PrivacyInfo.xcprivacy` is generated at prebuild from this config. Add or remove entries in `NSPrivacyCollectedDataTypes` (and `NSPrivacyAccessedAPITypes` if you use required-reason APIs) to match.
3. Updating the **privacy policy** if practices affect user rights or disclosures (e.g. new categories, new sharing).

Keep this doc and the manifest in sync with App Store Connect and the privacy policy.

## Device ID and usage data (implementation)

- **Device ID (anonymous) – Diagnostics:** If you declare Device ID in App Store Connect, the app or backend must actually collect an anonymous device identifier used only for diagnostics (e.g. crash reports, stability). Do not declare Device ID until that collection is in place, or implement collection and keep it non-linked to the user.
- **Usage data – Analytics:** The privacy policy refers to usage and API/sync events. Any first-party analytics must be consistent with the “Linked to user” choice and must not be used for advertising or tracking.
