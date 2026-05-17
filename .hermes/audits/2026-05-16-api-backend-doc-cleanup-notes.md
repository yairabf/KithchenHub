# API / Backend Documentation Cleanup Notes

Date: 2026-05-16

## Source inspected

Current source/config:

- `backend/src/main.ts`
- `backend/src/common/versioning/api-version.constants.ts`
- `backend/src/modules/*/controllers/*.ts`
- `backend/src/modules/recipes/dtos/*.ts`
- `backend/src/modules/recipes/validators/unit-type-validator.ts`
- `backend/src/modules/recipes/utils/unit-converter.ts`
- `backend/src/modules/health/services/health.service.ts`

Docs inspected:

- `docs/api/backend-endpoints.md`
- `docs/api/recipes-api.md`
- `backend/docs/README_DOCS.md`
- `backend/docs/MONITORING_SETUP.md`
- `backend/docs/LOGGING_GUIDE.md`
- duplicate files under `backend/docs/* 2.md`
- `docs/project/DOCUMENTATION_MAP.md`

## Findings

- Current backend uses global prefix `/api` and URI versioning `/v1` for versioned controllers.
- `GET /api/version` is intentionally unversioned.
- Controller inventory currently contains 65 HTTP method/path pairs.
- `docs/api/backend-endpoints.md` now matches those 65 controller method/path pairs.
- Swagger setup is still disabled in `backend/src/main.ts`; however, version discovery still returns `docs.v1: /api/docs/v1`. Docs should continue to label this as a mismatch until source changes.
- Health endpoints are versioned in source: `/api/v1/health`, `/api/v1/health/live`, `/api/v1/health/ready`, and `/api/v1/health/detailed`.
- `backend/docs/MONITORING_SETUP.md` still used unversioned `/api/health*` paths and was updated to `/api/v1/health*`.
- `backend/docs/MONITORING_SETUP 2.md` and `backend/docs/LOGGING_GUIDE 2.md` were byte-for-byte duplicates of active docs and were archived.

## Changes made

- Updated `docs/api/backend-endpoints.md` to clarify the Swagger/version-discovery mismatch and current documentation gaps.
- Updated `docs/api/recipes-api.md` to include full `/api/v1` paths, guard/source notes, and source file pointers.
- Updated `backend/docs/MONITORING_SETUP.md` to use source-backed versioned health endpoint paths.
- Updated `backend/docs/README_DOCS.md` so it points API readers to the source-backed endpoint inventory rather than older broad endpoint claims.
- Added `docs/archive/api-backend-docs-2026-05-16/README.md`.
- Moved exact duplicate backend docs to `docs/archive/api-backend-docs-2026-05-16/backend-docs/`.
- Updated `docs/project/DOCUMENTATION_MAP.md` with the new API/backend docs archive bucket.

## Archived files

- `backend/docs/MONITORING_SETUP 2.md`
- `backend/docs/LOGGING_GUIDE 2.md`

## Preserve as active

- `docs/api/backend-endpoints.md`
- `docs/api/recipes-api.md`
- `backend/docs/README_DOCS.md`
- `backend/docs/MONITORING_SETUP.md`
- `backend/docs/LOGGING_GUIDE.md`
- `backend/docs/api-sync-and-conflict-strategy.md`
- `backend/docs/SYNC_API_QUICK_REFERENCE.md`
- `backend/docs/api-versioning-guidelines.md`
- `backend/docs/api-deprecation-policy.md`

## Open documentation gaps

- Subscription/provider endpoints need a dedicated API reference if they become a public/mobile-facing contract.
- Detailed request/response examples remain partial outside the sync and recipe unit docs.
- Swagger/OpenAPI docs remain unavailable until the disabled setup in `backend/src/main.ts` is re-enabled in code.
