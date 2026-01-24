# KH-API-IMP-4 - Implement execute import endpoint

**Epic:** Guest Experience
**Created:** 2026-01-22
**Status:** Planning

## Overview
Implement the `POST /api/v1/import` endpoint to allow migrating guest data (Recipes, Shopping Lists) to a signed-in user's account. This endpoint must support transactions, handle retries (idempotency), and return ID mappings.

## Architecture
- **Controller:** `ImportController` to handle the HTTP request.
- **Service:** `ImportService` to orchestrate the import logic, including duplicate checks and transaction management.
- **Repository:** `ImportRepository` to interact with Prisma.
- **DTOs:** Define the structure of the import payload and response.

## Data Model Usage
- **ImportBatch:** Tracks the execution of an import request.
- **ImportMapping:** Stores the correspondence between client-side IDs (`localId`) and server-side IDs (`serverId`) to ensure idempotency.
  - `sourceField`: Will store the `localId` (potentially prefixed with type, e.g., `recipe:123`).
  - `targetField`: Will store the `serverId`.

## Implementation Steps

1. **Define DTOs**
   - Create `ImportRequestDto` (validating nested Recipes, ShoppingLists, etc.).
   - Create `ImportResponseDto`.

2. **Update Repository**
   - Add method to find existing mappings for a user (across all their batches) to prevent duplicate imports of the same local ID.
   - Add method to create batch and mappings transactionally.

3. **Implement Service Logic**
   - `executeImport(userId: string, data: ImportRequestDto)`
   - Strategy:
     - Iterate through data.
     - Check if `localId` is already mapped for this user.
     - If mapped: skip creation, record existing serverId.
     - If not mapped: create entity in DB, create `ImportMapping`.
     - Wrap in Transaction (Prisma `$transaction`).
   - Return `{ created: number, skipped: number, mappings: { [localId]: serverId } }`.

4. **Implement Controller**
   - `POST /` with `ImportRequestDto`.
   - Auth guard (User must be logged in).

## API Changes
- **POST /api/v1/import**
  - **Body:**
    ```json
    {
      "recipes": [ { "id": "local-1", "title": " Pancakes", ... } ],
      "shoppingLists": [ { "id": "local-2", "name": "Groceries", "items": [...] } ]
    }
    ```
  - **Response:**
    ```json
    {
      "created": 5,
      "skipped": 2,
      "mappings": {
        "local-1": "server-uuid-1",
        "local-2": "server-uuid-2"
      }
    }
    ```

## Testing Strategy
- Unit tests for Service (mocking Repository).
- Verify idempotency: call twice with same data, second call should create 0, skip all.
- Verify partial overlap.
