# Mobile API Client Integration

Last updated: 2026-05-26

This document maps the React Native / Expo mobile API client to the current backend endpoint inventory. It is source-backed by the files listed below and should be updated whenever mobile service calls or backend route decorators change.

## Source inspected

Mobile client source:

- `mobile/src/services/api.ts`
- `mobile/src/config/apiBaseUrl.ts`
- `mobile/src/config/index.ts`
- `mobile/src/contexts/AuthContext.tsx`
- `mobile/src/contexts/NetworkContext.tsx`
- `mobile/src/contexts/LegalLinksContext.tsx`
- `mobile/src/features/**/services/*.ts`
- `mobile/src/features/support/supportTicketApi.ts`
- `mobile/src/common/services/catalogService.ts`
- `mobile/src/common/repositories/cacheAware*Repository.ts`
- `mobile/src/common/utils/syncQueue/processor/index.ts`
- `mobile/src/common/utils/syncQueueProcessor.ts`

Backend reference:

- `docs/api/backend-endpoints.md`
- `backend/src/modules/*/controllers/*.ts`
- `backend/src/main.ts`
- `backend/src/common/versioning/api-version.constants.ts`

## Base URL and versioning

Mobile resolves the backend host from `EXPO_PUBLIC_API_URL`:

```ts
// mobile/src/config/apiBaseUrl.ts
EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '') ?? 'http://localhost:3000'
```

The shared API client then appends `/api` and a version prefix:

```ts
// mobile/src/services/api.ts
BASE_URL = `${API_BASE_URL}/api`
versionedUrl = `${this.baseUrl}/v${this.apiVersion}${endpoint}`
```

Default version:

```ts
// mobile/src/config/index.ts
EXPO_PUBLIC_API_VERSION || '1'
```

Therefore a mobile service call such as:

```ts
api.get('/recipes')
```

is sent as:

```text
GET {EXPO_PUBLIC_API_URL}/api/v1/recipes
```

## API client behavior

`mobile/src/services/api.ts` provides:

- `get`, `post`, `put`, `patch`, `delete`, and `upload` helpers.
- Automatic `Authorization: Bearer <token>` when an auth token is set.
- JSON `Content-Type` for non-FormData requests with a body.
- FormData upload support without forcing a JSON content type.
- 15-second request timeout via `AbortController`.
- Network short-circuit: if `NetworkProvider` reports offline, requests throw `NetworkError('No internet connection')` before calling `fetch`.
- Backend success unwrapping: `{ success: true, data: T }` becomes `T` for callers. Non-wrapped payloads pass through unchanged.
- Error handling: non-2xx responses become `ApiError(message, statusCode, responseData)`.
- Auth retry: one refresh attempt on 401/403 when `setSessionRefreshHandler()` is configured and the failed endpoint is not `/auth/refresh`.
- Unauthorized callback: `setOnUnauthorizedHandler()` clears session state when auth cannot be recovered.

## Auth/session integration

`mobile/src/contexts/AuthContext.tsx` owns the API token lifecycle:

- sets `api.setAuthToken(accessToken)` after login, registration, Google sign-in, token restore, and refresh
- clears `api.setAuthToken(null)` on logout, guest mode, failed restore, and unrecoverable auth errors
- registers `setOnUnauthorizedHandler(handleUnauthorized)`
- registers `setSessionRefreshHandler(refreshAccessToken)`

Auth API wrapper:

- `POST /api/v1/auth/register` — `mobile/src/features/auth/services/authApi.ts`
- `POST /api/v1/auth/login` — `mobile/src/features/auth/services/authApi.ts`
- `POST /api/v1/auth/refresh` — `mobile/src/features/auth/services/authApi.ts`
- `GET /api/v1/auth/me` — `mobile/src/features/auth/services/authApi.ts`

OAuth note: `mobile/src/services/auth.ts` also calls Google userinfo directly:

```text
GET https://www.googleapis.com/oauth2/v2/userinfo
```

That is an external Google API call, not a KitchenHub backend endpoint.

## Network/reachability integration

`mobile/src/contexts/NetworkContext.tsx` configures NetInfo:

- native platforms: `https://clients3.google.com/generate_204`
- web: `{API_BASE_URL}/api/v1/health`

The same provider exposes offline status to:

- `mobile/src/services/api.ts` through `setNetworkStatusProvider()`
- cache/sync layers through `common/utils/networkStatus`

Documentation note: `mobile/src/common/utils/networkTest.ts` still describes/tests `${API_BASE_URL}/api/health`; current backend health routes are versioned under `/api/v1/health`. Treat that as a source/documentation inconsistency to resolve in a future code/docs cleanup pass.

## Runtime mobile calls mapped to backend endpoints

The following list excludes tests and examples. All calls below were compared against `docs/api/backend-endpoints.md`; no missing backend routes were found during the 2026-05-26 support-intake pass.

### Auth and sync

- `POST /api/v1/auth/register` — `mobile/src/features/auth/services/authApi.ts`
- `POST /api/v1/auth/login` — `mobile/src/features/auth/services/authApi.ts`
- `POST /api/v1/auth/refresh` — `mobile/src/features/auth/services/authApi.ts`
- `GET /api/v1/auth/me` — `mobile/src/features/auth/services/authApi.ts`
- `POST /api/v1/auth/sync` — `mobile/src/common/utils/syncQueue/processor/index.ts`
- `POST /api/v1/auth/sync` — `mobile/src/common/utils/syncQueueProcessor.ts` legacy/parallel processor path

### Legal/client links

- `GET /api/v1/client-links` — `mobile/src/contexts/LegalLinksContext.tsx`

Fallback behavior: if `/client-links` is unavailable or returns invalid URLs, mobile builds fallback legal URLs from `EXPO_PUBLIC_API_URL` using `mobile/src/common/utils/legalLinksFallback.ts`.

### Household and invite flows

Current mobile source has two household API wrappers:

- `mobile/src/services/householdService.ts`
- `mobile/src/features/households/services/householdApi.ts`

Runtime calls found:

- `POST /api/v1/household` — create household
- `PUT /api/v1/household` — update household name
- `POST /api/v1/household/join` — join by invite code
- `POST /api/v1/household/invite` — create invite
- `GET /api/v1/household` — fetch current household
- `DELETE /api/v1/household/members/:memberId` — remove member
- `GET /api/v1/invite/validate?code=...` — validate invite code

### Shopping and catalog

Public catalog calls:

- `GET /api/v1/groceries/search?q=...&lang=...` — `mobile/src/common/services/catalogService.ts`
- `GET /api/v1/groceries/names?ids=...&lang=...` — `mobile/src/common/services/catalogService.ts`
- `GET /api/v1/groceries/by-category?category=...&lang=...` — `mobile/src/common/services/catalogService.ts`
- `GET /api/v1/groceries/categories` — `mobile/src/common/services/catalogService.ts`

Signed-in shopping calls:

- `GET /api/v1/shopping-lists` — cache-aware repository and remote shopping service
- `GET /api/v1/shopping-lists/:id` — cache-aware repository and remote shopping service
- `GET /api/v1/shopping-lists/main` — remote shopping service
- `GET /api/v1/shopping-lists/aggregate?lang=...` — remote shopping service
- `POST /api/v1/shopping-lists` — remote shopping service
- `PATCH /api/v1/shopping-lists/:id` — remote shopping service
- `DELETE /api/v1/shopping-lists/:id` — remote shopping service
- `POST /api/v1/shopping-lists/:id/items` — remote shopping service
- `GET /api/v1/shopping-items/custom` — catalog service
- `GET /api/v1/shopping-items/frequent?limit=...&lang=...` — remote shopping service
- `DELETE /api/v1/shopping-items/:id` — remote shopping service

### Recipes

- `GET /api/v1/recipes` — cache-aware recipe repository and recipe service
- `GET /api/v1/recipes/:id?lang=...` — recipe service
- `POST /api/v1/recipes` — recipe service
- `PUT /api/v1/recipes/:id` — recipe service
- `DELETE /api/v1/recipes/:id` — recipe service
- `GET /api/v1/recipes/images/search?...` — recipe image search service
- `POST /api/v1/recipes/:id/image` — recipe service and `mobile/src/services/imageUploadService.ts`

### Chores

- `GET /api/v1/chores` — cache-aware chore repository and chores service
- `POST /api/v1/chores` — chores service
- `PATCH /api/v1/chores/:id` — chores service
- `PATCH /api/v1/chores/:id/status` — chores service
- `DELETE /api/v1/chores/:id` — chores service

### Import

- `POST /api/v1/import` — `mobile/src/services/import/importService.ts`

### Support intake

- `POST /api/v1/support/tickets` — `mobile/src/features/support/supportTicketApi.ts`; used by Settings → Help & Support → `SupportTicket` as the primary signed-in submission path. Backend/offline/unauthenticated failure keeps the draft and leaves the `Email support instead` mailto fallback available.

### Premium/subscriptions

- `GET /api/v1/premium/demo` — `mobile/src/features/settings/services/premiumDemoApi.ts`
- `POST /api/v1/subscriptions/reconcile/:provider` — `mobile/src/features/subscription/services/subscriptionApi.ts`

Current mobile source passes `provider: 'revenuecat'`.

## Backend endpoints not currently called by mobile runtime wrappers

These backend routes exist in `docs/api/backend-endpoints.md` but were not found as direct `api.*()` runtime calls in mobile source during this pass. Some may be used indirectly by web/deep links, future UI, scripts, or external clients.

Examples include:

- `POST /api/v1/auth/google`
- `GET /api/v1/auth/google/start`
- `GET /api/v1/auth/google/callback`
- `GET /api/v1/auth/verify-email`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/resend-verification`
- `GET /api/v1/dashboard/summary`
- `GET /api/v1/deploy-info`
- `GET /api/v1/health`, `/live`, `/ready`, `/detailed`
- `GET /api/version`
- `GET /api/v1/chores/stats`
- `POST /api/v1/chores/:id/restore`
- `PATCH /api/v1/shopping-items/:id`
- `POST /api/v1/recipes/:id/cook`
- `DELETE /api/v1/users/me`
- `GET /api/v1/users/me/export`

Do not remove these from backend docs only because mobile does not call them.

## Open documentation gaps

- Request/response examples for the mobile service wrappers are still incomplete outside recipe units and sync docs.
- Household APIs are split across two mobile wrappers; docs should keep naming that explicitly until source consolidates or clarifies ownership.
- The mobile codebase contains both `syncQueueProcessor.ts` and `common/utils/syncQueue/processor/index.ts`, and both call `/auth/sync`; docs should distinguish which path is active if ownership changes.
- `mobile/src/common/utils/networkTest.ts` uses the stale unversioned health path in code comments and fetch URL; this pass documents the inconsistency but does not change app code.
