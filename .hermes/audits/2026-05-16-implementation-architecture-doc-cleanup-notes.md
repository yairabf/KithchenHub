# Implementation / Architecture Detail Documentation Cleanup Notes

Date: 2026-05-16

## Source inspected

Docs reviewed:

- `docs/architecture/DATA_MODES_SPEC.md`
- `docs/architecture/GUEST_STORAGE_DECISION.md`
- `docs/design/GUEST_MODE_SPECS.md`
- `docs/implementation/*`
- `mobile/src/common/utils/syncQueue/README.md`
- `mobile/src/common/utils/cacheStorage.README.md`
- `mobile/src/common/utils/cacheStorage/README.md` before archive
- `mobile/src/i18n/README.md`
- `mobile/src/i18n/KEY_STRUCTURE.md`

Source cross-checks:

- `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `backend/src/infrastructure/database/prisma/schema.prisma`
- `docs/api/backend-endpoints.md`
- `mobile/src/common/utils/guestStorage.ts`
- `mobile/src/common/utils/guestStorageHelpers.ts`
- `mobile/src/common/storage/dataModeStorage.ts`
- `mobile/src/common/validation/dataModeValidation.ts`
- `mobile/src/common/guards/guestNoSyncGuardrails.ts`
- `mobile/src/services/import/importService.ts`
- `mobile/src/i18n/constants.ts`
- `mobile/src/i18n/index.ts`

## What changed

### Data modes spec

Updated `docs/architecture/DATA_MODES_SPEC.md` to:

- point to `docs/api/backend-endpoints.md` as the source-backed endpoint map
- include current public grocery endpoints: `/groceries/search`, `/groceries/by-category`, `/groceries/categories`, `/groceries/names`
- remove unverified RLS wording and describe the source-backed protection model as backend controller/service household scoping plus read-only public catalog controller surface

### Guest mode spec

Rewrote `docs/design/GUEST_MODE_SPECS.md` to remove stale claims that guest data uses SQLite/Local Storage and that Meal Planning / Pantry Management are active Guest Mode surfaces.

Current doc now describes:

- AsyncStorage-backed guest storage
- local-only shopping/recipe/chore data
- no sync/cross-device/household sharing in guest mode
- sign-in import prompt boundaries
- source files to verify before changing behavior

### i18n key structure

Updated `mobile/src/i18n/KEY_STRUCTURE.md` to match current source:

- supported languages: `en`, `he`, `ar`
- added current `legal` namespace
- removed stale examples implying `es`/`fr` are current supported locales

### Duplicate cache storage README

Archived duplicate doc:

- from `mobile/src/common/utils/cacheStorage/README.md`
- to `docs/archive/implementation-docs-2026-05-16/cacheStorage-directory-README.md`

Reason: the implementation files live directly under `mobile/src/common/utils/`, and the active adjacent doc is `mobile/src/common/utils/cacheStorage.README.md`. The duplicate directory README was redundant and misleading as a source path.

Updated `docs/project/DOCUMENTATION_MAP.md` to point at the active `cacheStorage.README.md` path.

## Preserve decisions

Preserve:

- `docs/architecture/DATA_MODES_SPEC.md`
- `docs/architecture/GUEST_STORAGE_DECISION.md`
- `docs/design/GUEST_MODE_SPECS.md`
- `mobile/src/common/utils/syncQueue/README.md`
- `mobile/src/common/utils/cacheStorage.README.md`
- `mobile/src/i18n/README.md`
- `mobile/src/i18n/KEY_STRUCTURE.md`

These are useful implementation/architecture references after the targeted source-backed corrections.

## Candidate later archive bucket

The following `docs/implementation/*` files appear more like historical review/root-cause artifacts than active implementation guides. They were not moved in this pass because they may still be useful for forensic context:

- `docs/implementation/code-review-add-recipe-modal-inputs.md`
- `docs/implementation/code-review-recipe-unit-system.md`
- `docs/implementation/sync-queue-endless-sync-root-cause.md`

Recommended later decision: move historical review/root-cause notes into a dated archive bucket if no active docs reference them.

## Open questions

- `docs/implementation/premium-foundation-e2e-runbook.md` should be reviewed only when premium/RevenueCat work resumes.
- `docs/implementation/deploy-version-pipeline.md` should be checked during a deployment docs bucket.
- If Swagger/OpenAPI is re-enabled in backend source later, update `docs/api/backend-endpoints.md`, `backend/README.md`, and architecture docs together.
