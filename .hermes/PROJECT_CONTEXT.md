# KitchenHub Project Context

This file is the project-local context snapshot for KitchenHub. Read it at the start of a fresh LLM session before making plans or code changes.

## Purpose

KitchenHub is a household-management product with a mobile app and backend. Core product surfaces include:
- shopping lists
- recipes
- chores
- dashboard / home tab
- guest mode vs signed-in mode behavior
- shared household workflows

This file is meant to preserve the stable mental model of the repo so a new LLM does not need to rediscover it from scratch.

---

## Repo Overview

- Monorepo root: `/home/claw/.hermes/hermes-agent/projects/KithchenHub`
- Mobile app: `mobile/`
  - Expo React Native
  - TypeScript strict
  - feature-based architecture under `mobile/src/features/*`
  - shared code under `mobile/src/common/*`
- Backend app: `backend/`
  - NestJS + Prisma + TypeScript
  - module-based architecture under `backend/src/modules/*`
  - shared code under `backend/src/common/*` and `backend/src/infrastructure/*`

Root orchestration scripts exist for running combined flows.

---

## Architecture Mental Model

### Mobile
- Feature-first structure.
- Screens live under `mobile/src/features/<feature>/screens/...`.
- Feature components live under `mobile/src/features/<feature>/components/...`.
- Shared components/utilities live under `mobile/src/common/...`.
- Mobile code should preserve strict TypeScript boundaries and avoid `any` where possible.

### Backend
- Module-first NestJS structure.
- Backend entities are generally household-scoped for signed-in mode.
- Soft-delete via `deletedAt` is a standard pattern for user-owned entities.
- Backend success/error envelopes are centrally managed; do not invent new ad-hoc response shapes.

---

## Data Modes: Important Product Constraint

KitchenHub has three distinct data modes and many bugs/features depend on respecting them correctly.

### 1. Guest mode
- Local-only device storage.
- No cloud sync.
- No household sharing.
- Used for try-before-signup flows.

### 2. Signed-in mode
- Cloud-backed household-scoped data.
- Local cache for performance and offline behavior.
- Uses authenticated backend APIs.

### 3. Public catalog mode
- Read-only reference data.
- Shared across all users.
- Used for grocery catalog search and related public data.

### Hard rule
Do not blur these modes. In particular, do not present public catalog data as if it were personalized user history.

Relevant docs:
- `docs/project/DOCUMENTATION_MAP.md`
- `docs/architecture/DATA_MODES_SPEC.md`
- `docs/design/GUEST_MODE_SPECS.md`
- `docs/architecture/GUEST_STORAGE_DECISION.md`

---

## Existing Agent Instruction File

The repo already uses a root `AGENTS.md` as the main instruction file for coding agents.

That file contains:
- repo overview
- build/test commands
- code style and architecture placement rules
- locked mobile config guardrails
- pre-commit expectations
- agent defaults

Any LLM working in this repo should read `AGENTS.md` first, then this file, then any relevant plan files under `.hermes/plans/`.

---

## Commands You Will Commonly Need

### From repo root
```bash
npm run dev:mock
npm run dev:backend
npm run dev:backend:ios
npm run dev:backend:android
```

### From `mobile/`
```bash
npm start
npm run ios
npm run android
npm run web
npx tsc --noEmit
npm test
npm test -- --watch
npm test -- --coverage
```

### From `backend/`
```bash
npm run start:dev
npm run build
npm run lint
npm run typecheck
npm test
npm run test:unit
npm run test:e2e
npm run test:all
```

### Locked mobile config verification
Run from `mobile/`:
```bash
npm run verify:identifiers
npm run verify:ota
npm run verify:eas
```

---

## Guardrails / Things Not To Change Casually

Do not change these without explicit approval:
- `expo.ios.bundleIdentifier`
- `expo.android.package`
- `expo.runtimeVersion.policy = appVersion`
- EAS update channel semantics (`develop` preview, `main` production)

These are documented in repo rules referenced by `AGENTS.md`.

---

## Current Known Recent Workstreams

These are not the only active areas, but they are important recent context worth checking before starting related work.

### 0. Store release and compliance
Current state as of 2026-05-15:
- Android / Google Play has been accepted and is live.
- Apple App Review is submitted and pending.
- Store screenshots and legal/account-deletion URLs were recently updated.

Primary references:
- `docs/project/STORE_COMPLIANCE.md`
- `docs/project/RELEASE_STATUS.md`

### 1. Mobile cache/snappiness production stabilization
Current primary plan:
- `.hermes/plans/2026-05-11-mobile-cache-snappiness-plan.md`

High-level goal:
- make app startup and tab usage cache-first and native-fast
- reduce blocking backend/DB reads during normal screen usage
- cache shopping, recipes, chores, catalog metadata, and display-name/image data aggressively where safe
- keep high-frequency shopping edits optimistic and immediate with rollback on failure
- reserve backend refresh for explicit reload/pull-to-refresh/background sync/true invalidation

Current status:
- premium/RevenueCat work is on hold until the user explicitly resumes it
- recent `main` already includes catalog identity fixes, shopping/recipe snappiness fixes, lazy tab startup work, and enlarged FullHouse app icon assets

### 2. Home tab / dashboard refactor
There is a recovered plan here:
- `.hermes/plans/2026-04-28_0502-home-tab-frequent-items-recovery-plan.md`

High-level goal:
- remove dashboard Suggested Items behavior
- add dashboard-native Frequently Added section below Quick Add
- derive frequent items from actual shopping activity, not public catalog pseudo-frequency data
- preserve visible placeholder state when personalized/backend support is not ready
- preserve RTL and no-main-list fallback behavior

Current source map:
- `docs/features/mobile-ui-map.md`

Note: the current source map still lists `QuickStatsRow` / `QuickStatCard` as present in source. Treat older "remove quick stats" notes as product-direction context, not proof that those components are absent.

### 3. iOS form presentation rework
Relevant saved plans:
- `.hermes/plans/2026-04-27_095926-ios-form-presentation-rework.md`
- `.hermes/plans/2026-04-27_055530-mobile-modal-keyboard-scroll-plan.md`

High-level goal:
- replace problematic centered mobile forms with full-screen or sheet-style presentation
- preserve keyboard-aware scrolling and visible footer actions

### 3. Feature docs and implementation docs
Useful project docs already exist under:
- `docs/project/DOCUMENTATION_MAP.md`
- `docs/features/mobile-ui-map.md`
- `docs/api/backend-endpoints.md`
- `docs/features/`
- `docs/implementation/`
- `docs/architecture/`
- `docs/api/`
- `docs/design/`
- `docs/compliance/`

If touching a feature, check whether a feature doc already exists first.

---

## Dashboard-Specific Context

Historically, the dashboard doc described an older UI with:
- Suggested Items inside Quick Add
- quick stats row for Shopping Lists and Saved Recipes

That older doc is useful historical context, but newer dashboard work has been moving toward:
- a more action-oriented home tab
- Quick Add at the top
- Frequently Added below it
- Important Chores below that
- less emphasis on metrics / quick stats

So if dashboard code and dashboard docs disagree, verify whether the code reflects newer direction before “fixing” it back to the old design.

---

## Coding Conventions That Matter Often

- Make small, targeted changes.
- Respect feature/module boundaries.
- Keep mobile strictness intact.
- Use explicit typing at exported boundaries.
- Prefer existing repository/service patterns over inventing a parallel path.
- For user-owned entities, check for soft-delete patterns before changing delete logic.
- For UI work, preserve RTL behavior and current theme/token usage.

---

## Best Way To Resume In A Fresh LLM

For any new session:
1. Read `AGENTS.md`.
2. Read `docs/project/DOCUMENTATION_MAP.md`.
3. Read this file.
4. Read `.hermes/START_HERE.md` for the current handoff structure.
5. Read `.hermes/SESSION_LOG.md` for recent major milestones.
6. Read `docs/features/mobile-ui-map.md` for mobile/UI work or `docs/api/backend-endpoints.md` for backend/API work.
7. Read the most relevant file in `.hermes/plans/`.
8. Read the relevant feature/API doc.
9. Only then inspect code and make a plan.

Suggested minimal handoff prompt:

```text
You are working in /home/claw/.hermes/hermes-agent/projects/KithchenHub.
Read AGENTS.md, docs/project/DOCUMENTATION_MAP.md, .hermes/PROJECT_CONTEXT.md, then the most relevant plan in .hermes/plans/ before making changes.
For mobile/UI work, read docs/features/mobile-ui-map.md. For backend/API work, read docs/api/backend-endpoints.md.
Use current source code/tests as the final source of truth when older docs conflict.
```

---

## When To Update This File

Update this file when any of these change materially:
- architecture mental model
- command workflow
- important guardrails
- major active workstreams
- repo structure conventions
- stable product constraints that repeatedly matter across sessions
