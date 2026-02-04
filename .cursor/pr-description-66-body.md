## The Issue

The backend needed to align with three distinct sign-in UI flows (login, sign-up new household, join via invite) and enforce security and robustness rules:

- **Login**: Existing users could theoretically send a `household` in POST /auth/google; the backend should reject household switching during login.
- **Sign-up**: New users with no household and no `household` in the body had no household created; the UI expects a default household name from the backend (Option A) so the client can show a "choose household name" screen with a placeholder.
- **Join via invite**: Flow was supported but needed hardening: idempotent join (double-tap/retry safe) and race-safe household creation for new users.
- **PUT /household**: Name was not validated (trim, non-empty, max length), so empty or whitespace-only submissions could be accepted.
- **Invite validation**: Code was not structured for optional expiry (e.g. timestamp in token) without breaking clients.

## Root Cause

- **Auth (`authenticateGoogle`)**: Logic only called `resolveAndAttachHousehold` when `dto.household && !user.householdId`. It did not explicitly reject `dto.household` when the user already had a household, and it never created a household for new users when `dto.household` was omitted.
- **Households**: `addUserToHousehold` threw `ForbiddenException` whenever `user.householdId` was set, including when the user was already in the *same* household (no idempotency). `createHouseholdForNewUser` threw when the user already had a household (no race safety). `updateHousehold` / `UpdateHouseholdDto` did not enforce trimmed, non-empty, max-length name validation.
- **Invite**: `validateInviteCode` inlined parsing; no helper existed to reuse parsed `householdId` and `timestamp` for a future optional expiry check while keeping the same error shape.

## The Solution

- **Auth**
  - If `user.householdId` is set: reject request with `BadRequestException` when `dto.household` is present ("Cannot attach or switch household during login"). Otherwise return tokens unchanged.
  - If user has no household and no `dto.household`: create household with backend-derived default name via new helper `deriveDefaultHouseholdName(payload.email, payload.name)` (prefer display name, else email local-part; title-case + `'s family`; fallback `"My family"`), then attach user and return tokens.
  - Join flow unchanged: `dto.household` with `id` only → `addUserToHousehold`; with `name` → `createHouseholdForNewUser`.
- **Households**
  - **PUT /household**: `UpdateHouseholdDto` now validates `name` when provided: `@Transform` trim, `@MinLength(1)`, `@MaxLength(200)`; service trims before update. Class-level comment documents optional fields and name rules.
  - **addUserToHousehold**: If `user.householdId === householdId`, return successfully (no-op). Only throw when user belongs to a *different* household.
  - **createHouseholdForNewUser**: If user already has `householdId`, return that id (race-safe); otherwise create and return new household id as before.
  - **Invite**: Added private `parseInviteCode(code)` returning `{ householdId, timestamp } | null`; `validateInviteCode` uses it and keeps the same public API and error shapes. Comment notes optional expiry can be added later using the parsed timestamp.
- **Tests**
  - Auth: `deriveDefaultHouseholdName` unit tests (display name, email fallback, empty/whitespace, title-case); `authenticateGoogle` tests for existing user + household (reject dto.household, success with no dto), new user no dto (default name), new user join/create.
  - Households: createHouseholdForNewUser "user already has household" → expect return of existing id (race-safe); addUserToHousehold idempotent (same household no-op) and "different household" still throws.
  - New `update-household.dto.spec.ts`: validation tests for empty/whitespace name, valid name, omitted name, name over 200 chars.
- **Docs**: Backend README updated (Google OAuth three flows, household PUT validation, idempotent join, race-safe sign-up, invite structure; API endpoints table and project structure).

## Testing

- [x] I have tested this PR on my local machine.
- [x] I have added unitests for the changes I made.

**Covered scenarios:**
- Auth: existing user with/without dto.household; new user no household (default name), join by id, create by name; `deriveDefaultHouseholdName` edge cases.
- Households: createHouseholdForNewUser when user already has household (returns id, no create); addUserToHousehold when user already in same household (no-op) vs different household (throws); validateInviteCode unchanged behavior.
- UpdateHouseholdDto: empty/whitespace name fails; valid name and omitted name pass; name over 200 chars fails.
- Full backend test suite (240 tests) and build pass.

## Additional Changes

- [x] Docs changed
- [ ] UI Changed
- [ ] Config Changed
- [ ] Other

Backend README: Features (Google OAuth flows, household validation/idempotent join/race-safe sign-up), API Endpoints table (POST /auth/google, PUT /household), Project Structure (households module).
