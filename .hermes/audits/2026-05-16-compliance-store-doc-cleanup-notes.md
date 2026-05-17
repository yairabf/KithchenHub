# Compliance / Store Documentation Cleanup Notes

Date: 2026-05-16

## Source inspected

Current source/config:

- `mobile/app.json`
- `mobile/package.json`
- `mobile/src/common/constants/legal.ts`
- `mobile/src/common/utils/legalLinksFallback.ts`
- `mobile/src/features/recipes/components/AddRecipeModal/AddRecipeModal.tsx`
- `mobile/src/features/subscription/`
- `backend/vercel.json`
- `backend/scripts/create-vercel-output-dir.js`
- `backend/src/modules/health/controllers/client-links.controller.ts`
- `backend/src/modules/health/services/client-links.service.ts`
- `backend/src/modules/subscriptions/`
- `static-legal/privacy.html`
- `static-legal/terms.html`
- `static-legal/delete-account.html`
- `legal/privacy-policy-v1.md`
- `legal/terms-of-service-v1.md`

Docs reviewed/updated:

- `docs/project/STORE_COMPLIANCE.md`
- `docs/project/RELEASE_STATUS.md`
- `docs/project/ARCHITECTURE.md`
- `docs/project/RECENT_CHANGES.md`
- `docs/compliance/app-store-privacy.md`
- `docs/compliance/google-play-data-safety.md`
- `docs/compliance/google-play-submission-checklist.md`
- `docs/compliance/ios-app-store-submission-checklist.md`

## Findings

### Support URL was documented but not present in source

Current source does not include:

- `static-legal/support.html`
- `/support` rewrite in `backend/vercel.json`
- `/support/` rewrite in `backend/vercel.json`

Updated active docs to stop treating `/support` as a current public/store URL. Future agents should either use email/contact metadata or add the page + rewrites before using `/support`.

### Subscription/purchase data was under-documented

Source now includes subscription/paywall/purchase services and backend subscription reconciliation/webhook code. The legal/compliance docs now explicitly mention purchase/subscription data and app store/subscription provider processing.

### Recipe photos need explicit privacy coverage

Source uses `expo-image-picker` in `AddRecipeModal.tsx` to request media-library permission and select recipe images. Store privacy docs now call this out as Photos/recipe image data.

### iOS privacy manifest needs pre-submission review

`mobile/app.json` currently includes `NSPrivacyCollectedDataTypes` for name, email, other user content, device ID, and product interaction, with `NSPrivacyTracking: false`.

Open item: confirm whether App Store Connect and/or the generated PrivacyInfo need explicit declarations for recipe photos and purchases before the next paid/subscription-enabled iOS submission.

## Archive decision

Archived historical RC checklist:

- from `docs/compliance/ios-app-store-submission-checklist-rc-2026-02-21.md`
- to `docs/archive/compliance-docs-2026-05-16/ios-app-store-submission-checklist-rc-2026-02-21.md`

Reason: it contains branch/date-specific PASS/FAIL evidence and should not be treated as current store status.

## Active source of truth after cleanup

- `docs/project/STORE_COMPLIANCE.md`
- `docs/project/RELEASE_STATUS.md`
- `docs/compliance/app-store-privacy.md`
- `docs/compliance/google-play-data-safety.md`
- `docs/compliance/google-play-submission-checklist.md`
- `docs/compliance/ios-app-store-submission-checklist.md`
- `legal/privacy-policy-v1.md`
- `legal/terms-of-service-v1.md`
- `static-legal/privacy.html`
- `static-legal/terms.html`
- `static-legal/delete-account.html`

## Open questions

- Should a hosted `/support` page be added, or should store metadata use email/contact fields only?
- Before the next iOS submission, should `mobile/app.json` privacy manifest add explicit entries for purchases and/or photos?
- Before the next Android submission, re-check Play SDK Index guidance for RevenueCat, Expo, and Play Billing.
