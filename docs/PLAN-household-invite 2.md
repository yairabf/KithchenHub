# PLAN - Household Invitation (Secure Code via Lookup Table)

**Epic:** Household Management
**Created:** 2026-02-08
**Status:** Planning

## Overview
Implement a secure household invitation flow using a dedicated lookup table. This prevents internal `householdId` leakage and allows for features like code revocation and expiry.

## Architecture
- **Database**: Add `HouseholdInvite` model to store the mapping between a random `code` and the `householdId`.
- **Backend**:
  - Update `HouseholdsService.inviteMember` to generate a random 8-character alphanumeric code and store it in the new table.
  - Update `InviteController.validateInviteCode` to look up the code in the database.
  - Add `POST /api/v1/household/join` to `HouseholdsController` for the final join operation.
- **Mobile**:
  - **Admin**: Add "Invite Member" UI in Settings to generate/refresh and copy the secure code.
  - **Invitee**: Connect `HouseholdOnboardingScreen.tsx` to the new join endpoint.

## Implementation Steps

### Phase 1: Database Migration
1. **Schema Update**:
   - Add `HouseholdInvite` model to `schema.prisma`.
   - Add relations to `User` (as `creator` and `usedBy`) and `Household`.
2. **Migration**: Run `npx prisma migrate dev` to apply changes.

### Phase 2: Backend Logic Implementation
1. **Token Generation**:
   - Implement a utility for random alphanumeric codes.
   - Update `inviteMember` to link the new code to the household and creator.
2. **Validation Logic**:
   - Update `validateInviteCode` to query the `HouseholdInvite` table.
   - Handle "not found", "expired", or "already used" states.
3. **Join Endpoint**:
   - Implement `POST /api/v1/household/join`.
   - Perform atomic transaction: validate code -> add user to household -> mark code as used.

### Phase 3: Mobile UI - Admin Side
1. **Household Settings**:
   - Create a section for "Invitations".
   - Show active code (if any) and a "Generate New Code" button.
   - Implement "Share" and "Copy" actions.

### Phase 4: Mobile UI - Joining Side
1. **Onboarding Integration**:
   - Update `householdService.joinHousehold` to call the new API.
   - Update `HouseholdOnboardingScreen.tsx` to show a proper success message and redirect to the dashboard.

## API Changes
### `GET /api/v1/invite/validate?code=XXXX-XXXX`
- **Current**: Returns `{ householdId, householdName }` based on token parsing.
- **Update**: Performs DB lookup before returning the same DTO.

### `POST /api/v1/household/join` (New)
- **Request**: `{ "inviteCode": "XXXX-XXXX" }`
- **Response**: `HouseholdResponseDto`

## Testing Strategy
- **Unit Tests**:
  - Mock Prisma to test `HouseholdsService` logic for generation and validation.
  - Verify that a used or expired code throws a `NotFoundException`.
- **Database Tests**: Verify that `onDelete: Cascade` works correctly for invites when a household is deleted.
- **Manual Testing**:
  - Admin generates code -> Code appears in DB.
  - Invitee joins -> `usedAt` and `usedById` are populated in DB.

## Success Criteria
- Invite codes are short and random (no household ID in the string).
- Only one person can join per specific invitation (if we choose single-use) or we track usage.
- Admin can see who joined via which code.
