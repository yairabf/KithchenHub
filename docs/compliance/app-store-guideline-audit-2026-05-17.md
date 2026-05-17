# App Store Review Guidelines Audit — 2026-05-17

Scope: source-backed audit for KitchenHub / FullHouse after Apple rejection for Guideline 3.1.2(c), version `1.0 (94)`, Submission ID `35b2d613-60fc-48eb-8285-3ac8a96eaadf`.

This is an engineering/compliance checklist, not legal advice. Final App Store Connect metadata and reviewer notes still need to be applied in App Store Connect.

## Rejection-specific finding

- **Guideline 3.1.2(c) — Subscription Information:** repo-side app flow fix is tracked in PR #221 and this doc set records the required metadata update.
  - PR #221 adds subscription billing/auto-renewal disclosure before purchase on the in-app Premium screen.
  - PR #221 adds functional Privacy Policy and Terms of Use (EULA) links before purchase on the in-app Premium screen.
  - App Store metadata still requires manual update in App Store Connect: append `Terms of Use (EULA): https://kithchensync1.vercel.app/terms` to the App Description or configure the EULA field.

## Guideline areas checked

### 1. Safety

Status: **No source-backed blocker found in this pass.**

Evidence / notes:
- App is household management: shopping, recipes, chores, household collaboration.
- No source evidence found in this pass for objectionable content, physical-harm features, gambling, alcohol/tobacco/cannabis sales, or medical claims.
- User-generated household content exists; App Review screenshots/review account should use review-safe demo content.

### 2. Performance

Status: **Needs device QA before resubmission.**

Evidence / notes:
- TypeScript check passes for mobile after the subscription compliance change.
- Targeted Premium paywall Jest tests pass.
- Public legal URLs return HTTP 200.
- Manual QA still needed on a physical iPhone/iPad release/TestFlight build for auth, shopping, recipes, chores, settings, Premium, background/restore, and offline/error states.

### 2.3 Accurate Metadata

Status: **Metadata action required in App Store Connect.**

Required actions:
- Ensure App Description accurately describes current app functionality.
- Ensure App Description contains the EULA link:
  - `Terms of Use (EULA): https://kithchensync1.vercel.app/terms`
- Ensure screenshots show current app UI and review-safe demo data.
- If screenshots/previews show Premium features, make clear subscription may be required.
- Notes for Review must describe non-obvious features and in-app purchase/subscription flow.

### 3. Business / Payments

Status: **Primary rejection addressed by PR #221's code changes; metadata still manual.**

Evidence / notes:
- Paid digital subscription features use in-app purchase infrastructure (`mobile/src/features/subscription/*`).
- Premium screen includes yearly and monthly plan cards, price/length strings, free-trial information where applicable, restore purchases, and store billing note.
- PR #221 adds auto-renewal billing disclosure and legal links before purchase.
- App Store Connect subscription products/offers must be complete, visible, available for review, and matched to the in-app products.

Open App Store Connect checks:
- Subscription display names/descriptions match the in-app plan titles.
- Subscription duration/price/free trial in App Store Connect match the in-app copy.
- Review notes explain whether any configured IAP products are unavailable in the build.

### 4. Design

Status: **Manual QA required.**

Evidence / notes:
- No automated HIG verification was run.
- Check safe areas, iPad layouts/orientations, dynamic text, RTL for Hebrew/Arabic, tappable link/button sizes, and modal/navigation behavior on release build.

### 5. Legal / Privacy

Status: **Mostly source-backed; App Store Connect privacy form needs final confirmation.**

Evidence / notes:
- Public URL checks required before submission:
  - Privacy: `https://kithchensync1.vercel.app/privacy`
  - Terms/EULA: `https://kithchensync1.vercel.app/terms`
  - Account deletion: `https://kithchensync1.vercel.app/delete-account`
- PR #221 reports HTTP 200 verification for the privacy and terms URLs.
- `mobile/app.json` declares `NSPhotoLibraryUsageDescription` and privacy manifest entries for name, email, user content, device ID, product interaction, with tracking disabled.
- `docs/compliance/app-store-privacy.md` still has open verification items for purchase-data and photos privacy declarations.

Open App Store Connect checks:
- Privacy Nutrition Label includes purchases/purchase history if RevenueCat/App Store subscription state is collected/linked.
- Privacy Nutrition Label includes photos if recipe photos selected from the library are collected/stored/linked.
- Account deletion remains accessible in-app and via public instructions.

## Resubmission blockers

1. **Manual App Store Connect metadata update is required:** add EULA link to App Description or configure License Agreement/EULA field.
2. **Screen recording required by Apple:** show metadata/legal link fix and in-app Premium subscription disclosure/legal links.
3. **Physical-device release QA required:** use the iOS submission checklist before resubmitting.
4. **App Privacy final confirmation required:** especially Purchases/Purchase History and Photos declarations.

## PR #221 source files reviewed

- `mobile/src/features/subscription/screens/PremiumPaywallScreen.tsx`
- `mobile/src/features/subscription/screens/__tests__/PremiumPaywallScreen.test.tsx`
- `mobile/src/i18n/locales/en/settings.json`
- `mobile/src/i18n/locales/he/settings.json`
- `mobile/src/i18n/locales/ar/settings.json`

## Docs changed for this audit

- `docs/project/STORE_COMPLIANCE.md`
- `docs/compliance/ios-app-store-submission-checklist.md`
- `docs/compliance/app-store-review-3.1.2c-response.md`
- `docs/compliance/app-store-guideline-audit-2026-05-17.md`

## Verification performed / source reviewed

- Reviewed PR #221 changed files and PR description via GitHub CLI.
- Reviewed current legal-link source: `LegalLinksContext`, `legalLinksFallback`, `ClientLinksController`, `ClientLinksService`, and `backend/vercel.json`.
- Ran `git diff --check` for this docs branch.
- PR #221 reports:
  - `cd mobile && npx tsc --noEmit`
  - `cd mobile && npm test -- --runTestsByPath src/features/subscription/screens/__tests__/PremiumPaywallScreen.test.tsx --runInBand`
  - HTTP 200 checks for privacy and terms public URLs.
