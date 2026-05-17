# Mobile API / Client Integration Documentation Notes

Date: 2026-05-16

## Source inspected

Mobile source:

- `mobile/src/services/api.ts`
- `mobile/src/config/apiBaseUrl.ts`
- `mobile/src/config/index.ts`
- `mobile/src/contexts/AuthContext.tsx`
- `mobile/src/contexts/NetworkContext.tsx`
- `mobile/src/contexts/LegalLinksContext.tsx`
- `mobile/src/features/**/services/*.ts`
- `mobile/src/common/services/catalogService.ts`
- `mobile/src/common/repositories/cacheAware*Repository.ts`
- `mobile/src/common/utils/syncQueue/processor/index.ts`
- `mobile/src/common/utils/syncQueueProcessor.ts`

Backend/docs source:

- `docs/api/backend-endpoints.md`
- `backend/src/modules/*/controllers/*.ts`
- `backend/src/main.ts`
- `backend/src/common/versioning/api-version.constants.ts`

## Decisions

- Created `docs/api/mobile-api-client-integration.md` as the active source-backed map for mobile API client behavior and runtime service calls.
- Updated `mobile/README.md` so the Backend Integration section points to the actual KitchenHub API client (`mobile/src/services/api.ts`) instead of implying Supabase is the primary backend API client.
- Updated `docs/project/ARCHITECTURE.md` and `docs/project/DOCUMENTATION_MAP.md` to list the mobile API/client integration doc.
- Updated `docs/project/RECENT_CHANGES.md` so future agents know the mobile API map exists and was verified against backend endpoint docs.

## Verification notes

Compared runtime mobile `api.*()` calls against `docs/api/backend-endpoints.md`.

Result:

```text
backend_doc_endpoints=64
mobile_runtime_calls=49
missing_against_backend_doc=0
```

Notes:

- The earlier backend endpoint inventory pass verified 65 controller method/path pairs. The regex used for this mobile comparison intentionally matched `/api/v1/*` entries and did not count the unversioned `GET /api/version` discovery route.
- Runtime call scan excluded tests and example-only comments.
- `api.upload()` was normalized to `POST` for comparison.

## Source inconsistencies documented, not changed

- `mobile/src/common/utils/networkTest.ts` still documents and fetches `${API_BASE_URL}/api/health`, but current backend health routes are versioned under `/api/v1/health*`.
- Mobile has both `mobile/src/common/utils/syncQueueProcessor.ts` and `mobile/src/common/utils/syncQueue/processor/index.ts`, and both call `/auth/sync`; ownership should remain explicit in docs until source clarifies or consolidates.
- Household API calls are split across `mobile/src/services/householdService.ts` and `mobile/src/features/households/services/householdApi.ts`; docs should keep naming both wrappers until source consolidates ownership.

## No implementation work performed

This pass only updated documentation and project context. It did not create, modify, or propose hosted pages/routes or backend/mobile code changes.
