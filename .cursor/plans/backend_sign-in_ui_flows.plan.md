---
name: ""
overview: ""
todos: []
isProject: false
---

# Backend support for sign-in UI flows (updated)

## Overview

Align the backend with the three sign-in UI flows (login, sign-up new household, join via invite), enforce security rules (no household switching during auth), adopt Option A (backend default name), and add hardening (idempotent join, race safety, name validation). All households service tests remain passing; build stays green.

---

## 1) Login flow — rule to enforce

**UI:** User hits "Continue with Google" (no invite code).

**Backend:**

- If user **exists** → return tokens + current household.
- If user is **new** → create user and create household (default name), then return tokens.

**Key rule:** If a user already has `householdId`, **ignore** (or reject) any `dto.household` in POST /auth/google. Do not attach or replace household during auth. This prevents accidental or malicious "switch households" during login.

**Implementation in `authenticateGoogle`:**

- If `user.householdId` → do **not** call `resolveAndAttachHousehold`; just return tokens.
- If `!user.householdId` → then use `dto.household` to create (new) or join (existing by id).

This keeps the flow deterministic.

---

## 2) Sign-up new household — Option A (backend default name)

**Chosen approach:** Backend derives the default household name.

**UI:** POST /auth/google with `{ idToken }` only (no household).

**Backend:** If user is new and has no household → create household with default name derived from Google profile (displayName or email local-part), e.g. `"John's family"`.

**Rename step:** Client shows "choose household name" screen (placeholder = default). User submits → PUT /v1/household with `{ name }`. Backend must validate name: non-empty trimmed, min length, max length (already have max in DTO). This avoids accepting empty/placeholder-only submissions.

**Implementation:**

- Add `deriveDefaultHouseholdName(email, displayName?)` helper (prefer display name; fallback from email local part; edge case → `"My family"`).
- In `authenticateGoogle`: after `findOrCreateGoogleUser`, if `!user.householdId` and no `dto.household` → call `resolveAndAttachHousehold(user.id, { name: deriveDefaultHouseholdName(payload.email, payload.name) })`.
- Ensure PUT /v1/household (UpdateHouseholdDto) validates: `name` trimmed, min length (e.g. 1), max length (e.g. 200). Reject empty/whitespace-only.

---

## 3) Join existing household via invite — flow + hardening

**Flow (already supported):**

- GET /v1/invite/validate?code=... → returns `{ householdId, householdName }`.
- POST /auth/google with `{ idToken, household: { id: householdId } }`.
- If user has no household → attach them to that household.

**Hardening:**

**A) Invite validation**  
Ensure `validateInviteCode` verifies: code format, household exists. Structure code so adding optional expiry later (e.g. timestamp in token) does not break clients (e.g. optional expiry check that returns same error shape).

**B) Idempotent join**  
`addUserToHousehold` should be idempotent when user is already in that household: either no-op if already a member (check first, skip update), or catch unique/constraint errors and return success so duplicate requests (double-tap, retry) do not blow up.

**C) Race safety for new household**  
When creating a household for a new user (sign-up or default-name path), guard against double creation on race (e.g. double-tap/retry): use a transaction or uniqueness (e.g. user already has householdId after create) and treat "user already has household" as success.

---

## 4) Rename household (PUT /v1/household)

**Verify:**

- **Authorization:** Only a member of the household can call PUT; ideally only Admin (already enforced in [HouseholdsService.updateHousehold](backend/src/modules/households/services/households.service.ts) — admin-only).
- **Response:** Response includes the updated household (e.g. full household payload) so UI can update immediately without a separate GET. Current implementation returns `getHousehold(userId)` after update — confirm this is the full household shape the client needs.
- **Name validation:** Trimmed, min length (e.g. 1), max length (e.g. 200). Optionally block or normalize emoji if product cares; many apps allow it.

---

## 5) Exact request payloads (for UI)

**Login / Sign-in (existing user)**

```http
POST /v1/auth/google
{ "idToken": "..." }
```

**Sign-up new household (Option A — backend default)**

```http
POST /v1/auth/google
{ "idToken": "..." }
```

Then rename (optional):

```http
PUT /v1/household
{ "name": "My Cool Household" }
```

**Join via invite**

```http
GET /v1/invite/validate?code=ABC123
```

Then:

```http
POST /v1/auth/google
{
  "idToken": "...",
  "household": { "id": "householdIdFromValidate" }
}
```

*(Base path may be /api/v1 if global prefix is `api`.)*

---

## Implementation checklist

### Auth (authenticateGoogle)

- If `user.householdId` → do not use `dto.household`; return tokens (ignore or reject `dto.household` for clarity, e.g. log or 400 if present).
- If `!user.householdId` and no `dto.household` → create household with default name via `deriveDefaultHouseholdName(payload.email, payload.name)` and `resolveAndAttachHousehold(user.id, { name })`.
- If `!user.householdId` and `dto.household` → existing behavior: name → create; id only → join.

### Default name helper

- Add `deriveDefaultHouseholdName(email, displayName?)`: prefer display name, else email local-part; title-case; suffix `'s family`; fallback `"My family"`.
- Unit tests for helper (various email/name, edge cases).

### Households

- **updateHousehold / UpdateHouseholdDto:** Validate `name`: trimmed, min length 1, max length 200; reject empty.
- **addUserToHousehold:** Idempotent when user already in household (no-op or handle constraint gracefully).
- **createHouseholdForNewUser** (or caller): Ensure race-safe (transaction or check user.householdId after create; avoid double household for same user).

### Invite

- **validateInviteCode:** Already checks format and household existence; structure for optional expiry later without breaking clients.

### Tests

- Auth: existing user with householdId + dto.household present → household not changed; new user no household → default name created; join by id unchanged.
- Households service: all existing tests still pass; add/update test for idempotent addUserToHousehold if behavior changes.
- Build and full backend test suite green.

---

## Out of scope

- Guest mode (later).
- Invite token expiry (structure only; implement when needed).
- Mobile/client implementation (backend-only).

