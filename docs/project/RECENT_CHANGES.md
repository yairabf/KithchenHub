# KitchenHub Recent Changes

Use this file to quickly orient a fresh LLM to the most relevant recent project-level changes and active workstreams.

This is not meant to replace git history or detailed plan files.
It should stay short and practical.

## Current important workstreams

### 0. Store release and compliance
Status: Android accepted; Apple rejected for Guideline 3.1.2(c) as of 2026-05-17

Current state:
- Google Play / Android has been accepted and is live in the store.
- Apple App Review rejected iOS version `1.0 (94)` for Guideline 3.1.2(c) because App Store metadata did not include a functional Terms of Use/EULA link for auto-renewable subscriptions.
- PR #221 adds the in-app Premium paywall disclosure/legal-link fix: subscription title/length/price/free-trial information, auto-renewal disclosure, Privacy Policy link, Terms of Use (EULA) link, and Restore Purchases are covered for App Review notes/screen recording.
- App Store Connect still needs a manual metadata update: keep Privacy Policy URL `https://kithchensync1.vercel.app/privacy` and add `Terms of Use (EULA): https://kithchensync1.vercel.app/terms` to App Description or configure the EULA/License Agreement field.
- App Store screenshot sets exist for 6.5-inch iPhone, 13-inch iPad portrait, and 13-inch iPad landscape.
- Google Play Data Safety was updated to include Device or other IDs and related user data declarations.
- Public account deletion URL is live at `https://kithchensync1.vercel.app/delete-account`.
- Support URL is live in current source at `https://kithchensync1.vercel.app/support` via `static-legal/support.html` and `/support` rewrites in `backend/vercel.json`.

Primary references:
- `docs/project/STORE_COMPLIANCE.md`
- `docs/project/RELEASE_STATUS.md`
- `docs/compliance/app-store-review-3.1.2c-response.md`
- `docs/compliance/app-store-guideline-audit-2026-05-17.md`
- `static-legal/delete-account.html`
- `backend/vercel.json`
- `backend/scripts/create-vercel-output-dir.js`

Important instruction for future LLMs:
- Use a separate demo/review user for screenshots and review data.
- Do not use Yair's personal account for store screenshots.
- Verify public legal/support URLs after Vercel/static-page changes; keep `/support` documented only while `static-legal/support.html` and `/support` rewrites remain present.
- Update `STORE_COMPLIANCE.md`, `RELEASE_STATUS.md`, and this file after review outcomes.

---

### 0a. API/backend documentation cleanup — 2026-05-16

Current state:
- `docs/api/backend-endpoints.md` matches the current 65 HTTP method/path pairs declared by backend controller decorators.
- `backend/docs/MONITORING_SETUP.md` now uses the source-backed versioned health paths: `/api/v1/health*`.
- `docs/api/recipes-api.md` now uses full `/api/v1` recipe paths and points to the relevant controller/DTO/unit source files.
- `docs/api/mobile-api-client-integration.md` maps the mobile `api.*()` runtime calls to current backend routes, documents base URL/version behavior, token refresh, network handling, and current source inconsistencies.
- Swagger/OpenAPI remains disabled in `backend/src/main.ts`; `GET /api/version` still returns `docs.v1: /api/docs/v1`, so treat that docs link as unavailable until source changes.
- Duplicate backend docs `MONITORING_SETUP 2.md` and `LOGGING_GUIDE 2.md` were archived under `docs/archive/api-backend-docs-2026-05-16/`.

Primary references:
- `docs/api/backend-endpoints.md`
- `docs/api/mobile-api-client-integration.md`
- `docs/api/recipes-api.md`
- `backend/docs/README_DOCS.md`
- `.hermes/audits/2026-05-16-api-backend-doc-cleanup-notes.md`

---

### 1. Premium foundation (subscriptions + entitlement gating)
Status: on hold

Current next execution plan when this resumes:
- `.hermes/plans/2026-05-05-premium-real-sdk-go-live-plan.md` (wire real native SDK, verify end-to-end purchase/restore, and keep fallback alert only for unavailable mode)

Current state:
- household premium foundation is in place across backend + mobile
- webhook sync/reconciliation + support override + entitlement guard are implemented
- Settings now includes a premium-gated demo placeholder slice for verification
- E2E verification runbook added for Tasks 10–18 validation
- RevenueCat/native store connection is not production-working yet; defer until user explicitly resumes premium work

Primary references:
- `docs/implementation/premium-foundation-e2e-runbook.md`
- `backend/src/modules/subscriptions/`
- `backend/src/common/guards/entitlement.guard.ts`
- `backend/src/modules/premium-demo/`
- `mobile/src/features/subscription/`
- `mobile/src/features/settings/components/PremiumDemoSection.tsx`

Important instruction for future LLMs:
- keep premium checks household-scoped
- prefer extending the existing entitlement guard/decorator model
- preserve visible in-UI placeholders for backend-dependent premium surfaces

---

### 1. Production stabilization: mobile cache/snappiness
Status: active top-priority workstream

Current plan:
- `.hermes/plans/2026-05-11-mobile-cache-snappiness-plan.md`

Current focus:
- make app startup and tab entry cache-first and native-fast
- reduce backend/DB dependency during normal screen usage
- cache aggressively on-device for shopping, recipes, chores, catalog metadata, and display-name/image data where safe
- reserve backend refresh for explicit pull-to-refresh/reload, background refresh, or true invalidation
- keep high-frequency shopping edits immediate via optimistic write-through and safe rollback

Docs state:
- `docs/architecture/mobile-offline-cache-sync.md` is the source-backed map for guest storage, signed-in cache behavior, offline write queue behavior, and known cache/sync source inconsistencies.
- Current shared `getCached()` behavior returns cached data for fresh/stale/expired cache states unless an explicit refresh is requested; expired cache is not currently documented as a guaranteed blocking network fetch.
- Runtime sync queue imports still point to root-level `mobile/src/common/utils/syncQueueStorage.ts` and `mobile/src/common/utils/syncQueueProcessor.ts`; verify imports before treating the modular `mobile/src/common/utils/syncQueue/*` tree as the active runtime path.
- `docs/features/auth.md`, `docs/features/chores.md`, `docs/features/dashboard.md`, and `docs/features/settings.md` were refreshed against current mobile source on 2026-05-16. Important corrected points: dashboard Frequently Added is service/cache-backed, Settings includes premium/invite/legal/delete-account flows, Auth includes email/register/invite/household-name screens, and ChoreCard is now a separate component file.
- `docs/features/shopping.md` and `docs/features/recipes.md` now include source-backed current behavior sections for cache/repository mode, optimistic shopping updates, realtime shopping, recipe list/detail behavior, recipe image search, and recipe-to-shopping integration.
- `docs/screenshots/README.md` records the current screenshot inventory and explicitly marks screenshots as visual references only, not proof of current behavior.
- `mobile/src/i18n/README.md` was refreshed to match current supported languages (`en`, `he`, `ar`), namespaces, and test coverage.
- `docs/deployment/environment.md` summarizes current backend/mobile/deployment environment variables and source files.

Latest relevant commits on `main`:
- `471b9d7` — enlarged app icon artwork
- `b05bfdd` — FullHouse app icon asset replacement
- `a94a944` / PR #191 — shopping/recipe cache snappiness follow-up
- `f72a5b4` / PR #190 — recipe add-all catalog identity follow-up
- `c9279a0` / PR #189 — catalog sync/snappy flows/tab startup stabilization

Important instruction for future LLMs:
- prioritize mobile UX and shopping performance first
- do not resume premium/RevenueCat work until the user explicitly asks
- investigate root causes before making more performance changes
- prefer improving existing cache/repository paths instead of introducing parallel abstractions
- when possible, modify the current implementation instead of adding extra complexity
- keep offline/cache/sync docs source-backed against `cacheAwareRepository.ts`, `cacheConfig.ts`, `syncQueueStorage.ts`, `syncQueueProcessor.ts`, and `useSyncQueue.ts`

---

### 2. Per-user Frequently Added items
Status: active recent workstream

Current state:
- the UI work for Frequently Added items has already been done
- the next major step is backend support for per-user Frequently Added data

High-level direction:
- Frequently Added should reflect user-specific behavior
- this should not be faked with generic public catalog data
- the feature should remain useful in the UI while backend support is being completed

Primary references:
- `.hermes/plans/2026-04-28_0502-home-tab-frequent-items-recovery-plan.md`
- `mobile/src/features/dashboard/screens/DashboardScreen.tsx`
- `mobile/src/features/dashboard/components/FrequentlyAddedSection/`
- `mobile/src/features/dashboard/utils/dashboardFrequentItems.ts`

Important note:
The recent dashboard change removed the dashboard lists/recipes emphasis and added Frequently Added items instead.

---

### 3. Mobile/tablet layout and presentation stability
Status: active fragile area

The most fragile parts of the app right now are around the interaction experience on:
- phones
- tablets
- modals
- scrolling surfaces
- dropdowns
- keyboard-open states

When working in these areas, verify that:
- layouts still work on both tablet and mobile
- modals present correctly
- scrolling still works when dropdowns or keyboards are open
- interaction smoothness is preserved
- behavior is not only visually correct but also functionally correct

Primary references:
- `.hermes/plans/2026-04-27_095926-ios-form-presentation-rework.md`
- `.hermes/plans/2026-04-27_055530-mobile-modal-keyboard-scroll-plan.md`

---

### 4. Dashboard / home page direction shift
Status: recent product-direction change

The home page recently changed direction.

What changed:
- lists and recipes were removed from the dashboard emphasis
- Frequently Added items were added instead
- the dashboard became more focused on lightweight utility and quick access

Important implication:
If older docs or UI assumptions still describe the old home screen, verify the current approved direction before reverting anything.

---

## Most fragile areas right now

A fresh LLM should treat these as high-risk surfaces:
- mobile and tablet layout behavior
- modal presentation behavior
- scrolling with dropdowns and open keyboards
- animation smoothness
- UI stability after component edits
- persistence / state continuity after changes

---

## What changed direction recently

These product priorities shifted and should be treated as current guidance:

- **Production stabilization is more important than large new features**
- **Dashboard/home is lighter-weight and less central than shopping, recipes, and chores**
- **Frequently Added became a more important dashboard surface**
- **Guest mode is lower priority**
- **Household collaboration matters more than guest-mode investment**

---

## What a fresh LLM should check first

Before making changes, a fresh LLM should:

1. verify that the UI will not break on mobile or tablet
2. prefer improving existing code instead of adding extra code or extra abstractions
3. check whether older docs still match the current approved UI direction
4. verify modal, scrolling, dropdown, and keyboard-open behavior after UI edits
5. verify persistence and continuity after changes that touch state or interaction flows

Practical rule:
- do not add code just to feel productive
- keep the solution as small as possible while improving the current implementation

---

## Lower-priority areas for now

These are lower priority at the moment:
- guest mode
- large new features
- speculative expansions before the app is stable
- dashboard complexity beyond lightweight utility / quick access

---

## Important unfinished / future directions

These should still be visible to future LLMs as meaningful future directions, even if they are not the immediate focus:
- household member collaboration
- assistant integrations
- Siri / Google-style integrations
- continued production-readiness work
- backend support for per-user Frequently Added items

---

## Existing durable docs worth checking first

### Feature docs
- `docs/features/mobile-ui-map.md`
- `docs/features/dashboard.md`
- `docs/features/shopping.md`
- `docs/features/recipes.md`
- `docs/features/chores.md`
- `docs/features/settings.md`
- `docs/features/auth.md`

### Architecture / product behavior
- `docs/project/DOCUMENTATION_MAP.md`
- `docs/api/backend-endpoints.md`
- `docs/architecture/DATA_MODES_SPEC.md`
- `docs/architecture/GUEST_STORAGE_DECISION.md`
- `docs/design/GUEST_MODE_SPECS.md`

### Implementation / historical investigations
- `docs/implementation/`
- `docs/code-review-latest.md`

---

## Recommended read order for a fresh LLM

1. `AGENTS.md`
2. `docs/project/DOCUMENTATION_MAP.md`
3. `docs/project/PROJECT_OVERVIEW.md`
4. this file
5. `docs/project/ARCHITECTURE.md`
6. `docs/features/mobile-ui-map.md` for UI/mobile work or `docs/api/backend-endpoints.md` for backend/API work
7. relevant feature/API doc(s)
8. relevant `.hermes/plans/*.md`
9. relevant code

---

## When to update this file

Update this file when:
- a new major workstream starts
- a recent workstream materially changes direction
- a task-specific recovery plan becomes the main reference for a feature area
- an older doc becomes misleading compared with the current approved implementation direction
