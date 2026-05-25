# KitchenHub Documentation Map

Last updated: 2026-05-24

Purpose: this is the canonical map for humans and agents that need to understand the current KitchenHub codebase without reading stale or duplicated documentation first.

## First-read docs

Read these in order for most work:

1. `AGENTS.md` — repository rules, commands, conventions, and agent boundaries.
2. `.hermes/START_HERE.md` — short handoff for new Hermes sessions.
3. `.hermes/PROJECT_CONTEXT.md` — durable project context and current important constraints.
4. `docs/project/PROJECT_OVERVIEW.md` — product purpose, feature priorities, and UX intent.
5. `docs/project/ARCHITECTURE.md` — current mobile/backend architecture map.
6. `docs/project/RECENT_CHANGES.md` — current workstreams and recent decisions.

## Current code surfaces

### Mobile app

- Root: `mobile/`
- Source: `mobile/src/`
- Architecture style: feature-based modules under `mobile/src/features/*` plus shared code under `mobile/src/common/*`.
- Main feature docs:
  - `docs/features/mobile-ui-map.md` — source-backed map of current mobile navigation and feature areas.
  - `docs/features/shopping.md`
  - `docs/features/recipes.md`
  - `docs/features/chores.md`
  - `docs/features/dashboard.md`
  - `docs/features/settings.md`
  - `docs/features/auth.md`
  - support intake source: `mobile/src/features/support/` (documented from the Settings feature because the app entry point is Settings → Help & Support)
- Mobile overview: `mobile/README.md`
- Important implementation docs:
  - `docs/architecture/DATA_MODES_SPEC.md`
  - `docs/architecture/GUEST_STORAGE_DECISION.md`
  - `docs/architecture/mobile-offline-cache-sync.md`
  - `docs/design/GUEST_MODE_SPECS.md`
  - `mobile/src/common/utils/syncQueue/README.md`
  - `mobile/src/common/utils/cacheStorage.README.md`
  - `mobile/src/i18n/README.md`
  - `mobile/src/i18n/KEY_STRUCTURE.md`
  - `docs/screenshots/README.md` — screenshot inventory/freshness notes; visual reference only, not behavior proof.

### Backend API

- Root: `backend/`
- Source: `backend/src/`
- Architecture style: NestJS modules under `backend/src/modules/*`, shared backend concerns under `backend/src/common/*`, infrastructure under `backend/src/infrastructure/*`.
- Backend overview: `backend/README.md`
- API docs and sync/client contract:
  - `docs/api/backend-endpoints.md`
  - `docs/api/mobile-api-client-integration.md`
  - `backend/docs/README_DOCS.md`
  - `backend/docs/SYNC_API_QUICK_REFERENCE.md`
  - `backend/docs/api-sync-and-conflict-strategy.md`
  - `backend/docs/api-versioning-guidelines.md`
  - `backend/docs/api-deprecation-policy.md`
  - `docs/api/recipes-api.md`
- Database schema source:
  - `backend/src/infrastructure/database/prisma/schema.prisma`

### Release, compliance, and deployment

- Store/release state:
  - `docs/project/RELEASE_STATUS.md`
  - `docs/project/STORE_COMPLIANCE.md`
  - `docs/compliance/*`
- Public support intake pages:
  - `website/support.html`
  - `static-legal/support.html`
  - validation: `website/validate-landing.mjs`
- Deployment:
  - `docs/deployment/environment.md`
  - `docs/deployment/vercel-monorepo.md`
  - `backend/DEPLOYMENT.md`
  - `backend/docs/ENV_VAR_CHECKLIST.md`
  - `docs/implementation/deploy-version-pipeline.md`
  - archived legacy GCP/AWS deployment docs: `docs/archive/deployment-docs-2026-05-16/`

## Documentation ownership and boundaries

### Canonical project docs

These should reflect the current code and product direction:

- `README.md`
- `AGENTS.md`
- `.hermes/START_HERE.md`
- `.hermes/PROJECT_CONTEXT.md`
- `docs/project/PROJECT_OVERVIEW.md`
- `docs/project/ARCHITECTURE.md`
- `docs/project/RECENT_CHANGES.md`
- `docs/project/RELEASE_STATUS.md`
- `docs/project/STORE_COMPLIANCE.md`

### Feature docs

Use `docs/features/*` for UI/product behavior, feature intent, fragile areas, and source pointers. Feature docs should not become full API references or historical task logs.

### API/backend docs

Use `backend/docs/*`, `backend/README.md`, and `docs/api/*` for current backend contracts, API behavior, versioning, sync behavior, migrations, and operational notes. API docs should be verified against controller/DTO/service/source files before being treated as current. Use `docs/architecture/mobile-offline-cache-sync.md` for the mobile-side offline/cache/sync source map.

### Historical/archive docs

Use `docs/archive/*` for old docs that may still contain useful history but are not canonical. Do not use archived files as source of truth unless a current canonical doc explicitly points to a preserved historical decision.

Current archive buckets:

- `docs/archive/root-docs-2026-05-16/`
- `docs/archive/implementation-docs-2026-05-16/`
- `docs/archive/deployment-docs-2026-05-16/`
- `docs/archive/compliance-docs-2026-05-16/`
- `docs/archive/api-backend-docs-2026-05-16/`

## Current cleanup rule

When docs conflict, use this precedence:

1. Current source code and tests.
2. `AGENTS.md` and `.hermes/*` project context files.
3. `docs/project/*` canonical project docs.
4. `mobile/README.md`, `backend/README.md`, and feature/API docs.
5. Historical plans/reviews/archive files.

If a historical doc contains a useful fact not present in canonical docs, migrate the fact into the right canonical doc and keep/archive the historical doc as non-canonical.

## Agent guidance

Future coder, reviewer, and docs agents should:

- Start with this map and `AGENTS.md`.
- Verify API claims against backend controllers, DTOs, services, and Prisma schema.
- Verify UI feature claims against `mobile/src/features/*` before changing feature docs.
- Preserve product priorities from `docs/project/PROJECT_OVERVIEW.md` unless the user explicitly changes them.
- Avoid using archived docs as current instructions.
- Update this map when the documentation structure changes.
