# iOS App Store Submission Checklist (Kitchen Hub)

Use this checklist at project start, before code freeze, and again before uploading to App Store Connect.

How to use:
- Mark each item as `[PASS]`, `[FAIL]`, or `[N/A]`.
- Add one short evidence note for every `[PASS]` (test run, screenshot, file path, ticket).
- Block submission on any unresolved `[FAIL]` in Critical sections.

Release info:
- App version (`version.json`): `__________`
- iOS build number (EAS/ASC): `__________`
- Release branch/commit: `__________`
- Reviewer: `__________`
- Date: `__________`

---

## 1) Critical Product and Stability

- [ ] `[PASS|FAIL|N/A]` Release build is final candidate and crash-free on physical devices during review-critical flows. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` App does not crash in core flows (auth, shopping, recipes, chores, settings). Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` App remains responsive after extended usage (>=20 minutes). Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` No simulated failure UX (fake crack/crash, fake error states in production). Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` App state restores correctly after background/terminate/relaunch. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Activity indicators always resolve (no infinite loading spinners). Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Buttons fire on touch-up behavior and navigation feels native. Evidence: `__________`

## 2) Network, Device, and Platform Behavior

- [ ] `[PASS|FAIL|N/A]` Physical-device QA completed on supported iPhone models (not simulator-only). Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` User is warned when offline where network is required (banner/pill/error states). Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` App does not reference unsupported hardware features on current device. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Camera/microphone are never used covertly; user intent is explicit. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` If location is used, purpose is clear and user-benefiting (not tracking-only). Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Large downloads/streaming behavior is acceptable for cellular and Wi-Fi policy. Evidence: `__________`

## 3) Content and Policy Safety

- [ ] `[PASS|FAIL|N/A]` No prohibited content (hate, explicit sexual content, graphic violence, harassment). Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` No hidden paths to prohibited content (embedded web content, unfiltered external feeds). Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` No ridicule/defamation of public figures. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` App is not a thin wrapper of a website and provides native value. Evidence: `__________`

## 4) UX and HIG Compliance

- [ ] `[PASS|FAIL|N/A]` UI quality is production-grade and consistent with iOS Human Interface Guidelines. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Native-like iconography and actions are semantically correct. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Layout handles status bar changes and safe areas on all target devices. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Landscape behavior is intentional and polished if enabled. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` iPad UX is valid (orientation support, no nested/multiple popovers). Evidence: `__________`

## 5) Privacy, Data Use, and Permissions

- [ ] `[PASS|FAIL|N/A]` All runtime permission prompts are present and accurate (photos/camera/location/etc). Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Users are informed when private data is sent to backend; controls/opt-out are clear where required. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` App Privacy details in App Store Connect match actual data collection and linking. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Privacy manifest and tracking declarations are accurate. Evidence: `__________`

Kitchen Hub reference points:
- iOS permission text and privacy declarations: `mobile/app.json`
- Existing compliance doc: `docs/compliance/app-store-privacy.md`

## 6) Security and Technical Restrictions

- [ ] `[PASS|FAIL|N/A]` No private/undocumented Apple APIs or behaviors. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` No dynamic scripting/plugin runtime that executes downloaded code. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` No unapproved accessory dependencies. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` No continuous vibration misuse. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` If encryption applies, export compliance answers/docs are ready. Evidence: `__________`

## 7) App Store Connect Metadata and Submission Package

- [ ] `[PASS|FAIL|N/A]` App name in binary and App Store Connect name match (or acceptable abbreviation). Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Description accurately reflects current functionality; no pricing text in description. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Description/keywords do not mention competing platforms or other app names. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Keywords and category align with app functionality. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Screenshots are current and contain no error states. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` "What’s New" accurately describes real, user-visible changes (for updates). Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` If login required, App Review test account and steps are provided. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Any easter eggs are harmless and disclosed in review notes. Evidence: `__________`

## 8) Build, Versioning, Signing, and Entitlements

- [ ] `[PASS|FAIL|N/A]` iOS release artifact built with required Apple toolchain (Xcode 26 + iOS 26 SDK or newer requirement in effect). Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` App version >= 1.0 and incremented for release. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` iOS build number incremented from previous App Store build. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Bundle identifier is correct and consistent across config and signing. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` iCloud/push notifications/in-app purchases/Game Center entitlements match enabled features. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Required capabilities in plist match real requirements. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Store-signed production artifact builds successfully in EAS. Evidence: `__________`

Kitchen Hub automated checks:
```bash
cd mobile
npm run verify:identifiers
npm run verify:ota
npm run verify:eas
npx expo-doctor
npm test
eas build --platform ios --profile production
```

Kitchen Hub config references:
- Expo app config: `mobile/app.json`
- Version injection: `mobile/app.config.js`
- EAS build profiles: `mobile/eas.json`

## 9) Business, Legal, and Ownership

- [ ] `[PASS|FAIL|N/A]` You can prove ownership/license for all code and dependencies. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` You can prove ownership/license for icons, images, video, music, and lyrics. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Trademark/public figure/brand usage permissions are documented. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Contact/support email addresses in metadata are active and monitored. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Paid upgrades and digital transactions use App Store purchasing rules where required. Evidence: `__________`

## 10) Final Go/No-Go

- [ ] `[PASS|FAIL]` All Critical Product and Stability items are PASS.
- [ ] `[PASS|FAIL]` Metadata, screenshots, and review notes are finalized in App Store Connect.
- [ ] `[PASS|FAIL]` Production iOS build uploaded and selected for submission.
- [ ] `[PASS|FAIL]` Internal sign-off complete (Engineering + Product/Compliance as needed).

Submission decision:
- `[GO|NO-GO]` `__________`
- Blocking issues (if any): `__________`
