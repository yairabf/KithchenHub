# Premium Real SDK Go-Live Plan (No Fallback Alert Path)

> **For Hermes:** Execute this plan task-by-task. Keep changes scoped to premium purchase reliability and verification.

**Goal:** Connect the real native purchase SDK so iOS/Android purchase + restore flows work end-to-end without relying on the purchase-unavailable alert in healthy builds.

**Architecture:** Keep `purchaseService` as the app seam, wire native SDK adapter (`react-native-purchases`) behind it, and verify entitlement reconciliation through existing backend premium foundation paths. Preserve web fallback behavior.

**Tech Stack:** Expo React Native, TypeScript, Jest, RevenueCat SDK, KitchenHub backend entitlement APIs.

---

## Scope and success criteria

### In scope
- Real SDK wiring for iOS/Android.
- Runtime key resolution per platform.
- Reliable offerings/purchase/restore invocation from paywall.
- End-to-end verification checklist with explicit pass/fail evidence.

### Out of scope
- New premium product design.
- Major paywall UI redesign.
- Backend architecture rewrite.

### Release success criteria
- Native builds can load offerings and complete purchase + restore.
- No fallback alert shown in healthy configured native builds.
- Entitlement state is correct after purchase/restore and app restart.

---

## Task 1: Baseline and branch setup

**Objective:** Start from clean latest main and create an isolated branch.

**Files:**
- No code changes.

**Steps:**
1. Checkout main and pull latest.
2. Create feature branch: `feature/premium-real-sdk-go-live`.
3. Confirm clean git status.

**Verification:**
- `git status` is clean.
- Branch is not `main`.

---

## Task 2: SDK dependency and adapter availability

**Objective:** Ensure native SDK dependency exists and adapter can be loaded safely.

**Files:**
- Modify: `mobile/package.json`
- Modify: `mobile/package-lock.json` (or lockfile in use)
- Modify/Create: `mobile/src/features/subscription/services/*native*` (adapter file)

**Steps:**
1. Add `react-native-purchases` dependency.
2. Implement native adapter with guarded dynamic require.
3. Keep adapter failure non-crashing (returns `null` / unavailable mode).

**Verification:**
- Typecheck passes in `mobile`.
- Unit test for adapter-unavailable scenario exists/passes.

---

## Task 3: Platform API key resolution

**Objective:** Ensure correct SDK key selection per OS runtime.

**Files:**
- Modify: `mobile/src/features/subscription/services/purchaseService.ts`
- Modify: `mobile/src/features/subscription/services/__tests__/purchaseService.test.ts`

**Steps:**
1. Add resolver for:
   - `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
   - `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
2. Ensure behavior:
   - web => unavailable
   - native+key+adapter => available
   - missing key or adapter fail => unavailable
3. Keep existing injected SDK test path intact.

**Verification:**
- Targeted purchase service tests pass.

---

## Task 4: Paywall action-path hardening

**Objective:** Ensure healthy native flow executes real purchase, not fallback alert.

**Files:**
- Modify: `mobile/src/features/subscription/screens/*Paywall*`
- Modify: related tests under `mobile/src/features/subscription/screens/__tests__/`

**Steps:**
1. Verify Start Trial/Subscribe and Restore button handlers invoke service methods when available.
2. Keep fallback alert only for true unavailable mode.
3. Add/adjust test asserting no alert on available path and alert on unavailable path.

**Verification:**
- Paywall tests pass.
- No silent no-op tap behavior.

---

## Task 5: Native runtime configuration checks

**Objective:** Confirm build/runtime is correctly configured for both stores.

**Files:**
- Possibly modify env docs only if missing.

**Checklist:**
1. RevenueCat app entries exist for iOS and Android.
2. Store products are mapped into active offering.
3. Bundle/package IDs match across app/store/RevenueCat.
4. Sandbox test users are available.

**Verification evidence to collect:**
- Screenshot/log proof of offering + product mapping.
- Config note in PR description.

---

## Task 6: End-to-end manual validation run

**Objective:** Validate user-visible flows on iOS and Android test builds.

**Steps (per platform):**
1. Open paywall.
2. Offerings load.
3. Start Trial/Subscribe opens native store sheet.
4. Complete purchase in sandbox.
5. Entitlement state updates in app.
6. Force-close and reopen app; entitlement persists.
7. Run Restore; state remains correct.

**Verification:**
- Record outcomes in a short validation table (platform x step x pass/fail).

---

## Task 7: Regression and guardrail checks

**Objective:** Prevent collateral breakage.

**Commands (mobile):**
- `npx jest --runTestsByPath src/features/subscription/services/__tests__/purchaseService.test.ts --runInBand`
- `npx jest --runTestsByPath src/features/subscription/services/__tests__/purchaseService.test.ts src/features/subscription/screens/__tests__/PremiumPaywallScreen.test.tsx --runInBand`
- `npx tsc --noEmit`

**Verification:**
- All listed checks pass.

---

## Task 8: Documentation and handoff updates

**Objective:** Keep continuity docs current so work can resume anytime.

**Files:**
- Update: `docs/project/RECENT_CHANGES.md`
- Update: `.hermes/START_HERE.md`
- Optional: `docs/implementation/premium-foundation-e2e-runbook.md` cross-link if needed

**Steps:**
1. Add this plan as active reference.
2. Note current status (planned / in progress / validated).
3. Add explicit next action for the next session.

**Verification:**
- Fresh LLM can find this plan in <2 minutes via START_HERE + RECENT_CHANGES.

---

## Evidence template (fill during execution)

- Branch:
- Commit(s):
- iOS offering load: pass/fail
- Android offering load: pass/fail
- iOS purchase: pass/fail
- Android purchase: pass/fail
- Restore behavior: pass/fail
- Entitlement persistence after restart: pass/fail
- Fallback alert triggered only in unavailable mode: pass/fail

---

## Resume prompt

```text
Work in /home/claw/.hermes/hermes-agent/projects/KithchenHub.
Read AGENTS.md, docs/project/PROJECT_OVERVIEW.md, docs/project/RECENT_CHANGES.md,
.hermes/START_HERE.md, and .hermes/plans/2026-05-05-premium-real-sdk-go-live-plan.md.
Then continue from the first incomplete task and keep the no-fallback-alert-on-healthy-native-flow requirement.
```
