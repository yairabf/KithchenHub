# Google Play Submission Checklist (Kitchen Hub)

Use this checklist before creating a production release in Play Console.

How to use:
- Mark each item as `[PASS]`, `[FAIL]`, or `[N/A]`.
- Add one short evidence note for every `[PASS]`.
- Block submission on unresolved `[FAIL]` in critical sections.

Release info:
- App version: `__________`
- Android version code: `__________`
- Release branch/commit: `__________`
- Reviewer: `__________`
- Date: `__________`

---

## 1) Critical Product and Stability

- [ ] `[PASS|FAIL|N/A]` Release build is final candidate and crash-free in core flows on physical Android devices. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` App remains responsive after extended usage (>=20 minutes). Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Account deletion can be initiated from in-app Settings. Evidence: `__________`

## 2) Device and Platform Behavior

- [ ] `[PASS|FAIL|N/A]` Physical-device QA completed on low/mid/high Android device profiles. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Offline and network-switching scenarios behave gracefully. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Back navigation and system gestures behave natively. Evidence: `__________`

## 3) Privacy, Data Safety, and Permissions

- [ ] `[PASS|FAIL|N/A]` Data Safety form matches app behavior and policy docs. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Runtime permissions are requested with clear user-facing purpose. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Privacy policy URL in Play Console is current and reachable. Evidence: `__________`

Reference:
- `docs/compliance/google-play-data-safety.md`

## 4) Store Listing and Assets

- [ ] `[PASS|FAIL|N/A]` App name, short description, full description, and category are accurate. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Screenshots and feature graphic match current build and show no error states. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Contact/support details are active and monitored. Evidence: `__________`

## 5) Build, Signing, and Release Integrity

- [ ] `[PASS|FAIL|N/A]` Production AAB builds successfully from `eas build --platform android --profile production`. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Version code incremented and unique for this release. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` App signing and package identifier are correct. Evidence: `__________`
- [ ] `[PASS|FAIL|N/A]` Target SDK and Play policy requirements are satisfied for current cycle. Evidence: `__________`

## 6) Final Go/No-Go

- [ ] `[PASS|FAIL]` Critical product and stability items are PASS.
- [ ] `[PASS|FAIL]` Data safety/privacy declarations are finalized.
- [ ] `[PASS|FAIL]` Production Android artifact uploaded and selected.
- [ ] `[PASS|FAIL]` Internal sign-off complete.

Submission decision:
- `[GO|NO-GO]` `__________`
- Blocking issues (if any): `__________`
