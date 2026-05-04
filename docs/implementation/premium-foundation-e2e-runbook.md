# Premium Foundation E2E Verification Runbook

## Scope
This runbook verifies the premium foundation slice delivered across Tasks 10–17:
- webhook ingestion hardening
- reconciliation bridge from mobile purchase/restore
- entitlement guard
- premium-gated demo placeholder

It is intentionally narrow and executable in staging/local without production billing traffic.

## Preconditions
- Backend and mobile `.env` files are configured.
- RevenueCat webhook is configured to call backend `/v1/subscriptions/webhooks/revenuecat`.
- If webhook auth hardening is enabled, both vars are set together:
  - `SUBSCRIPTIONS_REVENUECAT_WEBHOOK_AUTH_HEADER`
  - `SUBSCRIPTIONS_REVENUECAT_WEBHOOK_AUTH_SECRET`
- Test household has at least one member account that can sign in on mobile.

## 1) Static verification (fast)
### Backend
```bash
cd backend
npm run typecheck
npm run lint
npm test -- --runTestsByPath \
  src/common/guards/entitlement.guard.spec.ts \
  src/modules/subscriptions/services/subscription-reconciliation.service.spec.ts \
  src/modules/subscriptions/services/subscription-webhooks.service.spec.ts \
  src/modules/premium-demo/controllers/premium-demo.controller.spec.ts \
  --runInBand
```

### Mobile
```bash
cd mobile
npm test -- --runTestsByPath \
  src/features/subscription/screens/__tests__/PremiumPaywallScreen.test.tsx \
  src/features/settings/components/__tests__/PremiumDemoSection.test.tsx \
  src/features/settings/screens/__tests__/SettingsScreen.test.tsx \
  --runInBand
```

## 2) API verification (manual)
1. Sign in with a non-premium user.
2. Call `GET /v1/premium/demo` with auth token.
   - Expected: `403` (entitlement blocked).
3. Grant household premium (trial, paid state, or support override).
4. Call `GET /v1/premium/demo` again.
   - Expected: `200` with payload:
     - `featureKey = premium_demo`
     - `title`
     - `message`
     - `householdId`

## 3) Webhook auth verification (manual)
If webhook auth vars are configured:
1. Send webhook with wrong auth header value.
   - Expected: `401 Unauthorized`.
2. Send webhook with correct auth header value.
   - Expected: accepted (2xx) and event processed.

If webhook auth vars are *not* configured:
- endpoint should still accept valid webhook payloads (foundation-compatible local/dev mode).

## 4) Mobile behavior verification (manual)
1. Open Settings on non-premium household.
   - Premium section visible.
   - Premium demo card visible with locked placeholder text.
   - No crash, no hidden section.
2. Open paywall and complete purchase/restore flow in test mode.
   - App triggers reconcile call.
   - User state refreshes after completion.
3. Return to Settings after premium is active.
   - Premium demo card fetches backend payload.
   - Demo content is shown.

## 5) Regression checks
- Sign out/in and confirm premium state remains consistent.
- Verify household-level behavior: another user in same household sees premium-enabled state.
- Verify no premium access leak to unrelated household.

## Known caveats
- Some RN tests emit `act(...)` warnings from async updates/animation mocks; this is pre-existing noise and does not fail the suite.
- Local/dev can run without webhook auth env vars, but staging/prod should configure them.

## Exit criteria
Task 18 is complete when:
- static verification commands pass,
- manual API + mobile checks pass,
- webhook auth behavior matches configured mode,
- and no entitlement regressions are observed.