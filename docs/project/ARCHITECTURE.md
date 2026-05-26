# KitchenHub Architecture

Use this as the durable high-level technical architecture reference for agents. For exact commands and coding rules, read the repo root `AGENTS.md` first.

## Repository shape

KitchenHub / FullHouse is a monorepo at:

```text
/home/claw/.hermes/hermes-agent/projects/KithchenHub
```

Primary apps:

- `mobile/` — Expo React Native mobile app, TypeScript.
- `backend/` — NestJS backend, Prisma, TypeScript.
- `static-legal/` — static legal/compliance pages copied into the backend Vercel public output.
- `docs/` — project, architecture, feature, implementation, and compliance docs.
- `.hermes/` — project-local LLM continuity files, plans, and handoff notes.

## Mobile architecture

The mobile app is feature-oriented.

Important roots:

```text
mobile/src/features/
mobile/src/common/
mobile/src/i18n/
```

Current source-backed mobile feature/navigation map:

```text
docs/features/mobile-ui-map.md
```

Current source-backed mobile API/client integration map:

```text
docs/api/mobile-api-client-integration.md
```

Current source-backed mobile offline/cache/sync map:

```text
docs/architecture/mobile-offline-cache-sync.md
```

Feature code should generally live under:

```text
mobile/src/features/<feature>/
```

Shared components/utilities should live under:

```text
mobile/src/common/
```

Important product surfaces:

- Shopping lists
- Recipes
- Chores
- Dashboard/home
- Settings/profile/household
- Subscription/premium state

Mobile implementation priorities:

- mobile-first UX
- tablet support remains functional/polished
- native iOS/Android feel
- fast startup and snappy interactions
- cache-first behavior where safe
- no unnecessary web-like UI patterns

## Backend architecture

The backend is NestJS + Prisma and is module-oriented.

Important roots:

```text
backend/src/modules/
backend/src/common/
backend/src/infrastructure/
backend/prisma/
```

Current source-backed endpoint inventory:

```text
docs/api/backend-endpoints.md
```

Swagger/OpenAPI setup is currently disabled in `backend/src/main.ts`; do not cite `/api/docs/v1` as the active API reference unless Swagger is re-enabled in source.

Backend feature code should generally live under:

```text
backend/src/modules/<module>/
```

Important backend patterns:

- Household-scoped data for signed-in cloud features.
- Soft-delete via `deletedAt` for user-owned entities where applicable.
- Prisma manages `updatedAt`; do not manually set it unless an existing pattern requires it.
- Success envelopes are centralized by backend interceptors.
- Error envelopes are normalized by backend filters.
- Prefer Prisma-generated migrations over manual SQL migrations.

## Data modes

KitchenHub has three important data modes. Many bugs come from mixing them.

Detailed source-backed storage/cache/sync behavior lives in:

```text
docs/architecture/mobile-offline-cache-sync.md
```

### Guest mode

- Local-only device storage.
- No household sharing.
- No cloud sync.

### Signed-in mode

- Authenticated backend APIs.
- Household-scoped cloud data.
- Local cache for speed/offline continuity.

### Public catalog mode

- Read-only reference/catalog data.
- Shared across users.
- Must not be treated as personalized user history.

## Premium/subscription architecture

Current intended direction:

- Household-level premium status first.
- Monthly/yearly paid plans.
- Short trial support.
- Support override path.
- Native store billing via Google Play / Apple, with RevenueCat/native purchase integration work staged but not fully production-working unless explicitly resumed.

Do not add per-feature premium complexity unless a specific premium feature requires it.

## Static legal/compliance pages

Static pages live in repo-root `static-legal/` and are copied into `backend/public/` during the backend Vercel build.

Relevant files:

```text
static-legal/privacy.html
static-legal/support.html
static-legal/terms.html
static-legal/delete-account.html
static-legal/assets/delete-account/
backend/scripts/create-vercel-output-dir.js
backend/vercel.json
```

Important clean URLs:

- `https://kithchensync1.vercel.app/privacy`
- `https://kithchensync1.vercel.app/terms`
- `https://kithchensync1.vercel.app/support`
- `https://kithchensync1.vercel.app/delete-account`

Support URL status: current source includes `static-legal/support.html`, `website/support.html`, and support route references. Verify deployed `/support` with HTTP 200 before using it as store metadata.

Support intake architecture: signed-in mobile Settings → Help & Support submits support tickets backend-first to protected `POST /api/v1/support/tickets`; the backend forwards tickets through Resend/`EMAIL_FROM` to `yair.solutions.19@gmail.com` with `reply_to` set to the submitter contact email. The mobile `Email support instead` fallback and public static support page remain mailto-backed for unauthenticated/account-access cases.

When adding static assets under `static-legal/assets/`, verify the backend Vercel build copies nested assets.

## Release/distribution architecture

Mobile identifiers are protected:

- iOS bundle ID: `com.kitchenhub.app`
- Android package: `com.kitchenhub.app`

Do not change these without explicit approval.

Expo/EAS guardrails:

- Runtime version policy should remain `appVersion`.
- Preview channel: `develop`.
- Production channel: `main`.
- Product version source of truth is repo-root `version.json`.

## Agent guidance

Before implementing architecture changes:

1. Read `AGENTS.md`.
2. Read `docs/project/DOCUMENTATION_MAP.md`.
3. Read `.hermes/START_HERE.md`.
4. Read `.hermes/PROJECT_CONTEXT.md`.
5. Read `docs/project/PROJECT_OVERVIEW.md` and `docs/project/RECENT_CHANGES.md`.
6. For mobile/UI work, read `docs/features/mobile-ui-map.md`.
7. For backend/API work, read `docs/api/backend-endpoints.md`.
8. Load any relevant KitchenHub skill.
9. Inspect existing code paths before proposing new abstractions.

Prefer small targeted changes, with targeted validation, over broad rewrites.
