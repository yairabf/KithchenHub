# Backend/API Documentation Cleanup Notes

Date: 2026-05-16

## Source inspected

- `backend/src/main.ts`
- `backend/src/common/versioning/api-version.constants.ts`
- `backend/src/modules/*/controllers/*.ts`
- `backend/src/modules/*/dtos/*.ts`
- `backend/src/infrastructure/database/prisma/schema.prisma`
- `backend/README.md`
- `backend/docs/README_DOCS.md`
- `backend/docs/SYNC_API_QUICK_REFERENCE.md`
- `backend/docs/api-sync-and-conflict-strategy.md`
- `backend/docs/api-versioning-guidelines.md`
- `backend/docs/api-deprecation-policy.md`
- `docs/api/recipes-api.md`

## Decisions

### Preserve as canonical/current

- `backend/docs/api-sync-and-conflict-strategy.md`
  - Strong source-backed sync contract doc.
  - Clearly separates current implementation from planned/not-implemented behavior.
- `backend/docs/SYNC_API_QUICK_REFERENCE.md`
  - Useful quick reference paired with the sync strategy doc.
- `backend/docs/api-versioning-guidelines.md`
  - Still relevant as policy/guidance; implementation hooks exist under `backend/src/common/versioning/*`.
- `backend/docs/api-deprecation-policy.md`
  - Still relevant as policy/guidance; implementation hooks exist under `backend/src/common/versioning/*`.
- `docs/api/recipes-api.md`
  - Useful focused doc for recipe ingredient units and image caching, but should be expanded later if recipe-image upload/search becomes a formal public contract.

### Updated during this pass

- `docs/api/backend-endpoints.md`
  - Added as current source-backed endpoint inventory.
- `backend/README.md`
  - Replaced stale full endpoint table with a source-backed pointer + accurate high-level endpoint groups.
  - Marked Swagger `/api/docs/v1` as currently disabled in `src/main.ts`.
- `backend/docs/README_DOCS.md`
  - Changed stale “all docs current / 100% documented” claims to cleanup status.
  - Linked `docs/api/backend-endpoints.md`.
- `docs/project/DOCUMENTATION_MAP.md`
  - Added `docs/api/backend-endpoints.md` to API/backend docs list.

### Needs later detailed work

- Detailed request/response docs for every endpoint are not complete yet.
- Subscription/provider/support endpoints need a dedicated doc if they are external contracts.
- Version discovery still returns `docs.v1: /api/docs/v1`, but Swagger setup is disabled in `backend/src/main.ts`. This is a code/docs mismatch to resolve later.
- Backend README is still very large and mixes setup, schema, API, Docker, deployment, and architecture. It is now less stale but should eventually be split or shortened.

## Archive/delete decision

No backend/API docs were archived in this pass. The safer move was to:

1. preserve strong source-backed sync/version docs,
2. add a current endpoint inventory,
3. mark stale audit claims as historical/under-cleanup,
4. defer broader backend README splitting to a later bucket.

## Verification performed

- Extracted controller endpoint inventory from source into `.hermes/audits/2026-05-16-backend-api-endpoints.md`.
- Created canonical endpoint inventory at `docs/api/backend-endpoints.md`.
- Checked remaining docs references for stale endpoint/Swagger claims in the edited areas.
