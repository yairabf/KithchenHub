# Google Play Data Safety — Kitchen Hub

This document summarizes Kitchen Hub’s **Google Play Data Safety** declarations for the Play Console form. Use it when filling or updating the form so the store listing stays accurate.

## Data collected

| Play Console category | Data types              | Collected? | Purpose(s)                    |
|-----------------------|-------------------------|------------|-------------------------------|
| Personal info         | Name, Email             | Yes        | Account management, Authentication |
| Photos and videos     | Photos (e.g. recipe images) | Yes    | App functionality             |
| App activity          | App interactions, usage | Yes        | Operate and improve the service (not advertising) |
| User content          | Recipes, lists, chores, household data | Yes | App functionality             |

Declare each row as **collected** and select the purpose(s) that match. Do **not** declare advertising or marketing as a purpose.

## Security and deletion

| Question                         | Answer |
|----------------------------------|--------|
| Is data encrypted in transit?    | Yes    |
| Can users delete their data?     | Yes (in-app deletion and/or request via support) |

## Sharing and advertising

| Question                         | Answer |
|----------------------------------|--------|
| Do you sell data?                | No     |
| Do you share data for advertising? | No    |

## Where to configure

- **Play Console:** [Policy → App content → Data safety](https://support.google.com/googleplay/android-developer/answer/10787469) — complete the form using the table above and set the privacy policy URL (e.g. https://kitchenhub.com/privacy).
- **Privacy policy:** [legal/privacy-policy-v1.md](../../legal/privacy-policy-v1.md) — single source of truth for store and in-app legal links.

## When to update

Any change in **data collection** or use requires:

1. Updating **Google Play Data Safety** (this form) so the store listing stays accurate.
2. Updating **App Store Connect → App Privacy** and the iOS privacy manifest — see [app-store-privacy.md](app-store-privacy.md).
3. Updating the **privacy policy** if practices affect user rights or disclosures (e.g. new categories, new sharing).

Keep this doc in sync with the Play Console form, [app-store-privacy.md](app-store-privacy.md), and the privacy policy.
