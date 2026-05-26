# Backend API Endpoint Inventory

Last updated: 2026-05-26

Purpose: source-backed inventory of currently implemented backend HTTP endpoints. This is an index for agents and developers; detailed request/response schemas still live in controller DTOs, service code, Swagger annotations where available, and focused docs such as `backend/docs/api-sync-and-conflict-strategy.md`.

## Source basis

Generated from controller decorators under:

- `backend/src/modules/*/controllers/*.ts`
- global prefix/versioning in `backend/src/main.ts`
- version constants in `backend/src/common/versioning/api-version.constants.ts`

Current global prefix/versioning:

- Global prefix: `/api`
- URI API versioning: `/v1`
- Current supported API versions: `['1']`
- Deprecated API versions: `[]`
- Sunset API versions: `[]`

Note: Swagger setup is currently disabled in `backend/src/main.ts` because of the `@fastify/static` dependency issue. The unversioned version discovery endpoint still returns `docs.v1: /api/docs/v1`, but that route should not be treated as available until Swagger setup is re-enabled in source.

## Authentication and auth flow

- `POST /api/v1/auth/register` — Public; register user with email/password.
- `POST /api/v1/auth/login` — Public; email/password login.
- `GET /api/v1/auth/verify-email` — Public; email verification link endpoint.
- `POST /api/v1/auth/verify-email` — Public; API email verification endpoint.
- `POST /api/v1/auth/resend-verification` — Public; resend verification email.
- `POST /api/v1/auth/google` — Public; authenticate with a Google ID token.
- `GET /api/v1/auth/google/start` — Public; start backend-driven Google OAuth flow.
- `GET /api/v1/auth/google/callback` — Public; handle Google OAuth callback.
- `POST /api/v1/auth/refresh` — Public; refresh access token.
- `GET /api/v1/auth/me` — Protected; return current user.
- `POST /api/v1/auth/sync` — Protected; offline batch sync for shopping lists, recipes, and chores.

Sources:

- `backend/src/modules/auth/controllers/auth.controller.ts`
- `backend/src/modules/auth/controllers/oauth.controller.ts`
- `backend/src/modules/auth/dtos/*.ts`
- `backend/docs/api-sync-and-conflict-strategy.md`

## Household and invites

- `GET /api/v1/household` — Protected; get current household.
- `POST /api/v1/household` — Protected; create household.
- `PUT /api/v1/household` — Protected; update household.
- `POST /api/v1/household/invite` — Protected; invite household member.
- `POST /api/v1/household/join` — Protected; join household.
- `DELETE /api/v1/household/members/:id` — Protected; remove household member.
- `GET /api/v1/invite/validate` — Public; validate invite code before sign-in/join.

Source: `backend/src/modules/households/controllers/*.ts`

## Shopping lists, shopping items, and grocery catalog

Shopping lists:

- `GET /api/v1/shopping-lists` — Protected; list household shopping lists.
- `POST /api/v1/shopping-lists` — Protected; create shopping list.
- `GET /api/v1/shopping-lists/main` — Protected; get main shopping list.
- `GET /api/v1/shopping-lists/aggregate` — Protected; get aggregated shopping list/item data.
- `GET /api/v1/shopping-lists/:id` — Protected; get list with items.
- `PATCH /api/v1/shopping-lists/:id` — Protected; update list metadata.
- `DELETE /api/v1/shopping-lists/:id` — Protected; soft-delete list.
- `POST /api/v1/shopping-lists/:id/items` — Protected; add items to list.

Shopping items:

- `GET /api/v1/shopping-items/custom` — Protected; get household custom items.
- `GET /api/v1/shopping-items/frequent` — Protected; get frequent household items.
- `PATCH /api/v1/shopping-items/:id` — Protected; update item.
- `DELETE /api/v1/shopping-items/:id` — Protected; soft-delete item.

Public grocery catalog:

- `GET /api/v1/groceries/search` — Public; search catalog. Query: `q`, optional `lang`.
- `GET /api/v1/groceries/categories` — Public; list categories.
- `GET /api/v1/groceries/by-category` — Public; list by category. Query: `category`, optional `lang`, `limit`.
- `GET /api/v1/groceries/names` — Public; resolve display names. Query: comma-separated `ids`, optional `lang`; max 200 IDs.

Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`

## Recipes and recipe images

Recipes:

- `GET /api/v1/recipes` — Protected; list household recipes. Query: optional `category`, `search`.
- `POST /api/v1/recipes` — Protected; create recipe.
- `GET /api/v1/recipes/:id` — Protected; get recipe detail. Query: optional `lang`.
- `PUT /api/v1/recipes/:id` — Protected; update recipe.
- `POST /api/v1/recipes/:id/cook` — Protected; add recipe ingredients to shopping flow.
- `DELETE /api/v1/recipes/:id` — Protected; soft-delete recipe.

Recipe images:

- `GET /api/v1/recipes/images/search` — Protected; search recipe images. Query: `q`, optional `limit`.
- `POST /api/v1/recipes/:id/image` — Protected; multipart upload with rate limit. Allowed image types: JPG, PNG, WebP. Max size comes from `RECIPE_IMAGE_MAX_SIZE_BYTES`.

Sources:

- `backend/src/modules/recipes/controllers/recipes.controller.ts`
- `backend/src/modules/recipes/controllers/recipe-images.controller.ts`
- `docs/api/recipes-api.md`

## Chores

- `GET /api/v1/chores` — Protected; list chores. Query: optional `start`, `end`.
- `POST /api/v1/chores` — Protected; create chore.
- `PATCH /api/v1/chores/:id` — Protected; update chore.
- `PATCH /api/v1/chores/:id/status` — Protected; toggle completion status.
- `POST /api/v1/chores/:id/restore` — Protected; restore soft-deleted chore.
- `GET /api/v1/chores/stats` — Protected; get chore statistics. Query: optional `date`.
- `DELETE /api/v1/chores/:id` — Protected; soft-delete chore.

Source: `backend/src/modules/chores/controllers/chores.controller.ts`

## Dashboard and import

- `GET /api/v1/dashboard/summary` — Protected; household dashboard summary.
- `POST /api/v1/import` — Protected; import recipes and shopping lists into household.

Sources:

- `backend/src/modules/dashboard/controllers/dashboard.controller.ts`
- `backend/src/modules/import/controllers/import.controller.ts`

## User privacy/account endpoints

- `GET /api/v1/users/me/export` — Protected; export user data.
- `DELETE /api/v1/users/me` — Protected; delete current account and related data according to service rules.

Source: `backend/src/modules/users/controllers/users.controller.ts`

## Support intake

- `POST /api/v1/support/tickets` — Protected; accepts authenticated mobile support ticket payloads and forwards them by Resend email to `yair.solutions.19@gmail.com` with `reply_to` set to the provided contact email. No database persistence. Requires `platform`, `category`, non-blank `summary`, `contactEmail`, and `privacyAcknowledged: true`; optional fields mirror `SupportTicketDraft`. The support module applies an in-process per-user token bucket before sending mail (burst 3, refill 3/hour) and returns `429` with `Retry-After` when exhausted. Success returns `referenceId` and `submittedAt`. Unauthenticated users should use the mailto fallback instead of this email-sending endpoint.

Sources:

- `backend/src/modules/support/controllers/support-tickets.controller.ts`
- `backend/src/modules/support/dtos/create-support-ticket.dto.ts`
- `backend/src/modules/support/services/support-tickets.service.ts`
- `backend/src/modules/support/guards/support-ticket-rate-limit.guard.ts`
- `backend/src/modules/support/services/support-ticket-rate-limit.service.ts`

## Health, legal client links, deploy info, and version discovery

- `GET /api/v1/health` — Public; basic health check.
- `GET /api/v1/health/live` — Public; liveness probe.
- `GET /api/v1/health/ready` — Public; readiness probe.
- `GET /api/v1/health/detailed` — Public; detailed health.
- `GET /api/v1/client-links` — Public; legal URLs for clients.
- `GET /api/v1/deploy-info` — Public; deployment metadata.
- `GET /api/version` — Public and unversioned; API version discovery.

Sources:

- `backend/src/modules/health/controllers/*.ts`
- `backend/src/common/versioning/api-version.constants.ts`

## Subscription and premium support endpoints

Treat these as backend/internal, provider-facing, or support-only until a dedicated subscription API doc is written.

- `POST /api/v1/subscriptions/webhooks/:provider` — Public provider webhook receiver.
- `POST /api/v1/subscriptions/reconcile/:provider` — Protected; reconcile provider/customer state for current user.
- `POST /api/v1/subscriptions/support/households/:householdId/premium-override` — Protected/support; set premium override.
- `DELETE /api/v1/subscriptions/support/households/:householdId/premium-override` — Protected/support; clear premium override.
- `GET /api/v1/premium/demo` — Protected + `EntitlementGuard`; premium demo payload.

Sources:

- `backend/src/modules/subscriptions/controllers/subscription-webhooks.controller.ts`
- `backend/src/modules/subscriptions/controllers/subscription-reconciliation.controller.ts`
- `backend/src/modules/subscriptions/controllers/subscription-support-overrides.controller.ts`
- `backend/src/modules/premium-demo/controllers/premium-demo.controller.ts`

## Documentation gaps found during cleanup

- `backend/docs/README_DOCS.md` now points to this source-backed endpoint inventory for current route coverage, but older 2026-01-28 consistency/audit docs should still be treated as historical status artifacts.
- Swagger/version discovery mismatch remains: `GET /api/version` returns `/api/docs/v1`, while `backend/src/main.ts` currently disables Swagger setup.
- Subscription/provider endpoints are not yet documented with the same request/response clarity as the core household/shopping/recipe/chore endpoints.
- Detailed request/response examples are partial. Use DTOs/controllers/services as source of truth when a field-level contract matters.
