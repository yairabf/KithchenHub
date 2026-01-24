# KH-API-IMP-1 - Design import contract & schemas

**Epic:** Guest Experience
**Created:** 2026-01-22
**Status:** Planning

## Overview
Create a shared contract for explicit import of local guest data. This includes request/response shapes, entity localId requirements, and validation rules using Zod.
The contract will be defined in the backend and intended to be shared (or copied) to the mobile client.

## Architecture
- **Location:** `backend/src/common/contracts/import.contract.ts`
- **Dependency:** `zod` (already present in backend).

## Proposed Changes

### [NEW] backend/src/common/contracts/import.contract.ts
Define the following Zod schemas:

1.  **Entity Schemas**:
    *   `ShoppingItemSchema`: `localId` (string), `name` (string), `isChecked` (boolean), etc.
    *   `ShoppingListSchema`: `localId` (string), `name` (string), `items` (array of `ShoppingItemSchema`).
    *   `RecipeSchema`: `localId` (string), `title` (string), `ingredients` (json), `instructions` (json), etc.
    *   `ChoreSchema`: `localId` (string), `title` (string), `isCompleted` (boolean), etc.

2.  **Import Payload**:
    *   `ImportRequestSchema`:
        *   `shoppingLists`: `ShoppingListSchema[]`
        *   `recipes`: `RecipeSchema[]`
        *   `chores`: `ChoreSchema[]`

3.  **Import Response**:
    *   `ImportResponseSchema`:
        *   `shoppingLists`: Array of `{ localId: string, serverId: string }`
        *   `recipes`: Array of `{ localId: string, serverId: string }`
        *   `chores`: Array of `{ localId: string, serverId: string }`

## Verification Plan

### Automated Tests
- Create a test file `backend/src/common/contracts/import.contract.spec.ts`.
- **Test 1**: Validate a correct payload against `ImportRequestSchema`.
- **Test 2**: Validate an incorrect payload (missing fields, wrong types) and ensure it fails.
- **Test 3**: Validate a correct response against `ImportResponseSchema`.
- **Command**: `npm test src/common/contracts/import.contract.spec.ts` (or `npx jest src/common/contracts/import.contract.spec.ts`)
