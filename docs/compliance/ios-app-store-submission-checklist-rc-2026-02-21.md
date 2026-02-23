# iOS App Store Submission Checklist (Kitchen Hub) - Pre-Filled RC

Status source: automated checks + repository configuration review performed on 2026-02-21.

Legend:
- `[PASS]` = verified now with concrete evidence
- `[FAIL]` = not yet verified or currently blocking
- `[N/A]` = not applicable for this release

Release info:
- App version (`version.json`): `1.0.0` (from `version.json:2`)
- iOS build number (EAS/ASC): `[FAIL]` Not verified from App Store Connect yet
- Release branch/commit: `test_1@6c47eff`
- Reviewer: `OpenCode (automated prefill)`
- Date: `2026-02-21`

---

## 1) Critical Product and Stability

- [ ] `[FAIL]` Release build is final candidate and crash-free on physical devices during review-critical flows. Evidence: physical device crash pass not verified yet
- [ ] `[FAIL]` App does not crash in core flows (auth, shopping, recipes, chores, settings). Evidence: manual device/session test not run yet
- [ ] `[FAIL]` App remains responsive after extended usage (>=20 minutes). Evidence: endurance test not run yet
- [ ] `[FAIL]` No simulated failure UX (fake crack/crash, fake error states in production). Evidence: full UX audit not run yet
- [ ] `[FAIL]` App state restores correctly after background/terminate/relaunch. Evidence: lifecycle relaunch test not run yet
- [ ] `[FAIL]` Activity indicators always resolve (no infinite loading spinners). Evidence: manual loading-state sweep not run yet
- [ ] `[FAIL]` Buttons fire on touch-up behavior and navigation feels native. Evidence: manual interaction test not run yet

## 2) Network, Device, and Platform Behavior

- [ ] `[FAIL]` Physical-device QA completed on supported iPhone models (not simulator-only). Evidence: simulator/device matrix run pending
- [x] `[PASS]` User is warned when offline where network is required (banner/pill/error states). Evidence: offline components and tests found (`mobile/src/common/components/OfflineBanner.tsx:31`, `mobile/src/common/components/OfflinePill/OfflinePill.tsx:20`)
- [ ] `[FAIL]` App does not reference unsupported hardware features on current device. Evidence: full device matrix test not run yet
- [x] `[PASS]` Camera/microphone are never used covertly; user intent is explicit. Evidence: only photo library picker usage detected (`mobile/src/features/recipes/components/AddRecipeModal/AddRecipeModal.tsx:140`)
- [x] `[PASS]` If location is used, purpose is clear and user-benefiting (not tracking-only). Evidence: no Core Location usage detected in source scan
- [ ] `[FAIL]` Large downloads/streaming behavior is acceptable for cellular and Wi-Fi policy. Evidence: network throughput policy validation not run yet

## 3) Content and Policy Safety

- [ ] `[FAIL]` No prohibited content (hate, explicit sexual content, graphic violence, harassment). Evidence: policy/content moderation review pending
- [ ] `[FAIL]` No hidden paths to prohibited content (embedded web content, unfiltered external feeds). Evidence: full content surface audit pending
- [ ] `[FAIL]` No ridicule/defamation of public figures. Evidence: copy/content legal review pending
- [x] `[PASS]` App is not a thin wrapper of a website and provides native value. Evidence: React Native feature modules + native navigation structure in repo

## 4) UX and HIG Compliance

- [ ] `[FAIL]` UI quality is production-grade and consistent with iOS Human Interface Guidelines. Evidence: HIG audit not run yet
- [ ] `[FAIL]` Native-like iconography and actions are semantically correct. Evidence: manual UX audit not run yet
- [ ] `[FAIL]` Layout handles status bar changes and safe areas on all target devices. Evidence: device QA run pending
- [x] `[PASS]` Landscape behavior is intentional and polished if enabled. Evidence: orientation set to default (all) in `mobile/app.json:5`; visual QA still required
- [x] `[PASS]` iPad UX is valid (orientation support, no nested/multiple popovers). Evidence: iPad support enabled in `mobile/app.json:23`; no popover code detected in current RN stack

## 5) Privacy, Data Use, and Permissions

- [x] `[PASS]` All runtime permission prompts are present and accurate (photos/camera/location/etc). Evidence: `NSPhotoLibraryUsageDescription` configured (`mobile/app.json:26`)
- [ ] `[FAIL]` Users are informed when private data is sent to backend; controls/opt-out are clear where required. Evidence: privacy UX/legal copy review pending
- [ ] `[FAIL]` App Privacy details in App Store Connect match actual data collection and linking. Evidence: ASC form verification pending
- [x] `[PASS]` Privacy manifest and tracking declarations are accurate. Evidence: privacy manifest + `NSPrivacyTracking: false` present (`mobile/app.json:28`, `mobile/app.json:61`)

Kitchen Hub reference points:
- iOS permission text and privacy declarations: `mobile/app.json`
- Existing compliance doc: `docs/compliance/app-store-privacy.md`

## 6) Security and Technical Restrictions

- [ ] `[FAIL]` No private/undocumented Apple APIs or behaviors. Evidence: binary/API compliance scan pending
- [x] `[PASS]` No dynamic scripting/plugin runtime that executes downloaded code. Evidence: no interpreter/plugin execution framework configured in app config/dependencies
- [x] `[PASS]` No unapproved accessory dependencies. Evidence: no accessory SDK dependencies found in `mobile/package.json`
- [x] `[PASS]` No continuous vibration misuse. Evidence: no vibration usage found in mobile source scan
- [ ] `[FAIL]` If encryption applies, export compliance answers/docs are ready. Evidence: export compliance in ASC not verified yet

## 7) App Store Connect Metadata and Submission Package

- [ ] `[FAIL]` App name in binary and App Store Connect name match (or acceptable abbreviation). Evidence: binary name is `FullHouse` in `mobile/app.json:3`; ASC name not verified
- [ ] `[FAIL]` Description accurately reflects current functionality; no pricing text in description. Evidence: ASC metadata not reviewed yet
- [ ] `[FAIL]` Description/keywords do not mention competing platforms or other app names. Evidence: ASC metadata not reviewed yet
- [ ] `[FAIL]` Keywords and category align with app functionality. Evidence: ASC metadata not reviewed yet
- [ ] `[FAIL]` Screenshots are current and contain no error states. Evidence: screenshot set not reviewed yet
- [ ] `[FAIL]` "What’s New" accurately describes real, user-visible changes (for updates). Evidence: release notes not reviewed yet
- [ ] `[FAIL]` If login required, App Review test account and steps are provided. Evidence: review notes not prepared yet
- [ ] `[FAIL]` Any easter eggs are harmless and disclosed in review notes. Evidence: review notes not prepared yet

## 8) Build, Versioning, Signing, and Entitlements

- [ ] `[FAIL]` iOS release artifact built with required Apple toolchain (Xcode 26 + iOS 26 SDK or newer requirement in effect). Evidence: release machine/CI toolchain version not verified yet
- [x] `[PASS]` App version >= 1.0 and incremented for release. Evidence: `version.json:2` is `1.0.0`; no static `expo.version` in app.json; version injected in `mobile/app.config.js:46`
- [ ] `[FAIL]` iOS build number incremented from previous App Store build. Evidence: App Store Connect build history not checked
- [x] `[PASS]` Bundle identifier is correct and consistent across config and signing. Evidence: `mobile/app.json:24` and `npm run verify:identifiers` passed
- [x] `[PASS]` iCloud/push notifications/in-app purchases/Game Center entitlements match enabled features. Evidence: no explicit entitlements/plugin config indicating enabled services in current Expo config
- [x] `[PASS]` Required capabilities in plist match real requirements. Evidence: current plist includes photo library usage and no unsupported required capabilities entries
- [ ] `[FAIL]` Store-signed production artifact builds successfully in EAS. Evidence: profile is configured correctly (`mobile/eas.json:13`-`mobile/eas.json:17`); production build execution still pending

Automated checks run and passing:
```bash
cd mobile
npm run verify:identifiers
npm run verify:ota
npm run verify:eas
```

Automated checks still required before submission:
```bash
cd mobile
npx expo-doctor
npm test
eas build --platform ios --profile production
```

## 9) Business, Legal, and Ownership

- [ ] `[FAIL]` You can prove ownership/license for all code and dependencies. Evidence: legal artifact bundle not attached yet
- [ ] `[FAIL]` You can prove ownership/license for icons, images, video, music, and lyrics. Evidence: asset licensing audit pending
- [ ] `[FAIL]` Trademark/public figure/brand usage permissions are documented. Evidence: trademark/legal review pending
- [ ] `[FAIL]` Contact/support email addresses in metadata are active and monitored. Evidence: ASC metadata not reviewed yet
- [ ] `[FAIL]` Paid upgrades and digital transactions use App Store purchasing rules where required. Evidence: payment/commercial flow review pending

## 10) Final Go/No-Go

- [ ] `[FAIL]` All Critical Product and Stability items are PASS.
- [ ] `[FAIL]` Metadata, screenshots, and review notes are finalized in App Store Connect.
- [ ] `[FAIL]` Production iOS build uploaded and selected for submission.
- [ ] `[FAIL]` Internal sign-off complete (Engineering + Product/Compliance as needed).

Submission decision:
- `[NO-GO]` unresolved critical and metadata/compliance items
- Blocking issues: manual QA, App Store Connect metadata, iOS build/upload, legal/compliance sign-off

---

## 11) Owner-Based Execution Plan (Close All FAILs)

Use this table as the working board. Each owner updates status in-line.

| Workstream | Owner | Required outputs | Status |
| --- | --- | --- | --- |
| Core manual QA (crash, responsiveness, lifecycle restore, loading states, button behavior) | `@mobile-eng-lead` | Test notes + screen recordings + resolved bugs | `OPEN` |
| Device matrix QA (iPhone + iPad, portrait/landscape, safe areas/status bar) | `@qa-owner` | Device checklist with pass/fail per device/orientation | `OPEN` |
| Privacy UX + data disclosure copy validation | `@product-owner` + `@mobile-eng-lead` | Confirmed in-app copy + privacy policy linkage evidence | `OPEN` |
| App Store Connect metadata (name, subtitle, description, keywords, category, screenshots, What's New) | `@growth-or-marketing` | Final ASC metadata package approved | `OPEN` |
| App Review package (test account, repro steps, notable flows, easter egg disclosure) | `@product-owner` + `@mobile-eng-lead` | Final review notes text in ASC | `OPEN` |
| Export compliance / encryption answers | `@compliance-owner` | Final BIS/export answer set stored and submitted | `OPEN` |
| Legal ownership/licensing evidence bundle | `@legal-owner` | Third-party license list + media rights evidence | `OPEN` |
| Production iOS build + upload selection in ASC | `@release-engineer` | Successful EAS build, upload, selected build for submission | `OPEN` |
| Final release sign-off | `@mobile-eng-lead` + `@product-owner` + `@compliance-owner` | Written GO approval in release thread | `OPEN` |

Definition of done per owner:
- Engineering: all technical FAIL items in sections 1, 2, 4, 6, 8 are either PASS or N/A with evidence.
- Product/Marketing: all section 7 metadata FAIL items are PASS with screenshots/export of ASC fields.
- Legal/Compliance: all section 9 and export-compliance FAIL items are PASS with traceable documentation.

---

## 12) Same-Day Submission Sequence (Recommended)

Target: complete everything in one working day with parallel tracks.

### Slot A (0:00-1:30) - Engineering validation

1. Run automated checks:
   ```bash
   cd mobile
   npx expo-doctor
   npm test
   npm run verify:identifiers
   npm run verify:ota
   npm run verify:eas
   ```
2. Run focused manual QA on physical iPhone and iPad simulator:
   - Auth/login/logout
   - Shopping create/edit/delete
   - Recipe create with photo picker
   - Chores create/complete/edit
   - Settings and offline transitions
3. Record evidence and convert applicable items in sections 1, 2, 4, 5, 6 to PASS.

### Slot B (in parallel, 0:00-1:30) - Product/Marketing metadata

1. Validate App Store Connect listing against current binary behavior.
2. Finalize:
   - App name/subtitle
   - Description (no pricing/competitor mentions)
   - Keywords/category
   - Screenshot set (no error states)
   - What's New
3. Prepare App Review notes including test account and explicit login steps.
4. Convert section 7 items to PASS with evidence.

### Slot C (1:30-2:30) - Build and upload

1. Trigger production build:
   ```bash
   cd mobile
   eas build --platform ios --profile production
   ```
2. Confirm:
   - Build succeeded
   - Build appears in App Store Connect
   - Correct version/build number selected
3. Convert section 8 build-related FAIL items to PASS.

### Slot D (2:30-3:00) - Compliance finalization

1. Confirm export compliance/encryption answers in ASC.
2. Confirm legal ownership/license bundle exists and is linked internally.
3. Convert section 6/9 compliance FAIL items to PASS.

### Slot E (3:00-3:30) - GO gate

1. Review section 10 gate items:
   - All critical product items PASS
   - Metadata finalized
   - Production build selected
   - Internal sign-off complete
2. If all PASS -> set:
   - Submission decision: `[GO]`
   - Blocking issues: `None`
3. Submit for review in App Store Connect.

Rollback rule:
- Any new crash, misleading metadata, or unresolved compliance item automatically flips decision back to `[NO-GO]` until fixed.

---

## 13) Today Tracker (Live)

Use this section as the real-time control sheet during release day.

Team mapping (replace placeholders):
- `@mobile-eng-lead` -> `__________`
- `@qa-owner` -> `__________`
- `@product-owner` -> `__________`
- `@growth-or-marketing` -> `__________`
- `@release-engineer` -> `__________`
- `@compliance-owner` -> `__________`
- `@legal-owner` -> `__________`

Clock start: `__________`
Target submit time: `__________`

Live tasks:
- [ ] `00:00` `@release-engineer` Run automated checks (`expo-doctor`, tests, verify scripts). Evidence: `__________`
- [ ] `00:15` `@mobile-eng-lead` Start manual core flow QA on iPhone. Evidence: `__________`
- [ ] `00:15` `@qa-owner` Start iPad + orientation/safe-area QA. Evidence: `__________`
- [ ] `00:20` `@growth-or-marketing` Finalize ASC description/keywords/category/screenshots. Evidence: `__________`
- [ ] `00:35` `@product-owner` Finalize App Review notes + test account steps. Evidence: `__________`
- [ ] `01:15` `@release-engineer` Trigger `eas build --platform ios --profile production`. Build ID: `__________`
- [ ] `01:45` `@release-engineer` Verify build appears in ASC and is selected. Evidence: `__________`
- [ ] `02:00` `@compliance-owner` Complete export compliance answers in ASC. Evidence: `__________`
- [ ] `02:10` `@legal-owner` Attach legal/license evidence package link. Evidence: `__________`
- [ ] `02:20` `@mobile-eng-lead` + `@product-owner` Sweep unresolved FAILs and update sections 1-10. Evidence: `__________`
- [ ] `02:40` `@mobile-eng-lead` + `@product-owner` + `@compliance-owner` Final GO/NO-GO decision recorded. Evidence: `__________`
- [ ] `03:00` `@release-engineer` Submit in App Store Connect (if GO). Evidence: `__________`

Escalations:
- Crash/blocker owner: `__________`
- Metadata rejection owner: `__________`
- Compliance/legal blocker owner: `__________`

Final state:
- Submission decision: `[GO|NO-GO]` `__________`
- Actual submission time: `__________`
- Follow-up ticket/release thread link: `__________`
