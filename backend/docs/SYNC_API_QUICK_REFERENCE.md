# Sync API Quick Reference Card

**Endpoint**: `POST /api/v1/auth/sync`  
**Auth**: JWT Protected  
**Purpose**: Offline-first batch data synchronization

---

## 📦 Request Structure

### Standard Terminology (Use Exactly)

| Term | Type | Purpose | Required |
|------|------|---------|----------|
| `payloadVersion` | `number` | Payload format version (default: 1) | Optional |
| `requestId` | `string` (UUID v4) | Batch observability/correlation | Optional |
| `operationId` | `string` (UUID v4) | Per-entity idempotency key | **Required** |
| `lists` | `SyncShoppingListDto[]` | Shopping lists to sync | Optional |
| `recipes` | `SyncRecipeDto[]` | Recipes to sync | Optional |
| `chores` | `SyncChoreDto[]` | Chores to sync | Optional |

### Request Example
```typescript
POST /api/v1/auth/sync
{
  "payloadVersion": 1,
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "lists": [
    {
      "id": "list-1",
      "operationId": "op-001",
      "name": "Groceries",
      "color": "#FF6B35",
      "items": [
        {
          "id": "item-1",
          "operationId": "op-002",
          "name": "Milk",
          "quantity": 1,
          "unit": "gallon",
          "category": "dairy",
          "isChecked": false
        }
      ]
    }
  ],
  "recipes": [...],
  "chores": [...]
}
```

---

## 📤 Response Structure

### Standard Terminology (Use Exactly)

| Term | Type | Purpose |
|------|------|---------|
| `status` | `'synced' \| 'partial' \| 'failed'` | Overall sync result |
| `succeeded` | `Array<{operationId, entityType, id, clientLocalId?}>` | Successfully processed entities |
| `conflicts` | `Array<{type, id, operationId, reason}>` | Failed entities with error details |

### Response Example
```typescript
{
  "status": "partial",
  "succeeded": [
    {
      "operationId": "op-001",
      "entityType": "list",
      "id": "list-1",
      "clientLocalId": "local-list-1"
    },
    {
      "operationId": "op-002",
      "entityType": "shoppingItem",
      "id": "item-1"
    }
  ],
  "conflicts": [
    {
      "type": "recipe",
      "id": "recipe-1",
      "operationId": "op-003",
      "reason": "Invalid ingredient format"
    }
  ]
}
```

### Status Values

| Status | Meaning | `succeeded` | `conflicts` |
|--------|---------|-------------|-------------|
| `synced` | All succeeded | Populated | Empty array |
| `partial` | Some succeeded, some failed | Populated | Populated |
| `failed` | All failed | Empty/undefined | Populated |

---

## ⏱️ Timestamp Semantics

### What Client Sends
- ❌ **None** - No timestamp fields in sync DTOs
- Client timestamps are **ignored**

### What Server Does
- ✅ `createdAt` - Set by Prisma `@default(now())` on insert
- ✅ `updatedAt` - Auto-bumped by Prisma `@updatedAt` on update
- ✅ `deletedAt` - **Not touched** by sync (soft-delete managed elsewhere)

### Key Rules
1. Server timestamps are **authoritative**
2. Prisma **always bumps** `updatedAt` on upsert update
3. Client **never** controls timestamp values
4. Last sync write wins at database layer

---

## 🗑️ Soft-Delete Semantics

### Normal Behavior
- Entities with `deletedAt != null` are soft-deleted
- Filtered out by `ACTIVE_RECORDS_FILTER` in queries
- Sync **does not resurrect** soft-deleted entities

### Re-Upsert Edge Case
**What happens if client syncs a soft-deleted entity?**

```
Sync upsert hits `update` branch
  ↓
Updates business fields (name, quantity, etc.)
  ↓
Leaves deletedAt UNCHANGED (still non-null)
  ↓
Entity stays logically deleted
  ↓
updatedAt is bumped by Prisma
```

**Result**: Entity updated in DB but invisible to normal queries

**Resurrection**: Not supported via sync. Requires explicit restore API.

---

## 🔁 Idempotency

### Per-Entity
- Each entity has unique `operationId` (UUID v4)
- Same `operationId` = processed **exactly once**
- Safe to retry with same `operationId`

### Retrying After Success
- ✅ Treated as no-op (skipped)
- Returns same result (from idempotency key table)

### Retrying After Failure
- ✅ Re-attempts operation (previous key deleted)
- May succeed on retry

### Best Practices
1. Generate `operationId` once per entity write
2. Keep same `operationId` across retries
3. Change `operationId` only for new logical writes

---

## 🎯 Invariants

### Backend Guarantees
- Every `operationId` appears in **exactly one** of:
  - `succeeded[]`, OR
  - `conflicts[]`

### Client Assumptions
- If `operationId` in `succeeded[]` → Remove from queue ✅
- If `operationId` in `conflicts[]` → Retry with backoff 🔄
- If `operationId` in **neither** → Server bug, keep for retry ⚠️

### Violation Handling
- Backend logs error if invariant violated
- Response still returned (soft contract)
- Client treats missing `operationId`s as "unknown" → retry

---

## 🚫 What Sync Does NOT Do

- ❌ Server-side timestamp comparison (no LWW gate)
- ❌ Per-field merge (wholesale update)
- ❌ Resurrect soft-deleted entities
- ❌ Cascade deletes to related entities
- ❌ Version conflict resolution (client-side only)

---

## ✅ Implementation Status

### ✅ Implemented
- Batch-state sync with simple upsert
- Idempotency via `operationId`
- Partial batch recovery (`succeeded[]` + `conflicts[]`)
- Soft invariant checking
- Prisma-managed timestamps

### ❌ Not Implemented
- Server-side timestamp-aware conflict checks
- Payload version branching (`payloadVersion` accepted but not used)
- Resurrection semantics for soft-deleted entities
- Server-side LWW gate

---

## 📚 References

### Documentation
- **Source of Truth**: [API Sync & Conflict Strategy](./api-sync-and-conflict-strategy.md)
- **High-Level Docs**: [Backend README](../README.md)
- **Version Guidelines**: [API Versioning Guidelines](./api-versioning-guidelines.md)
- **Consistency Audit**: [Consistency Checklist](./CONSISTENCY_CHECKLIST.md)

### Code Locations (For Verification)

| What to Verify | File | Line/Function |
|----------------|------|---------------|
| Request DTOs | `backend/src/modules/auth/dtos/sync-data.dto.ts` | Classes: `SyncDataDto`, `SyncShoppingListDto`, `SyncRecipeDto`, `SyncChoreDto` |
| Response Types | `backend/src/modules/auth/types/sync-conflict.interface.ts` | Interfaces: `SyncResult`, `SyncConflict` |
| Main Sync Logic | `backend/src/modules/auth/services/auth.service.ts` | Function: `syncData()` (line ~181) |
| Entity Processing | `backend/src/modules/auth/services/auth.service.ts` | Functions: `syncShoppingLists()`, `syncRecipes()`, `syncChores()` |
| Idempotency | `backend/src/modules/auth/services/auth.service.ts` | Function: `processEntityWithIdempotency()` (line ~790) |
| Controller | `backend/src/modules/auth/controllers/auth.controller.ts` | Method: `syncData()` decorated with `@Post('sync')` |
| Database Models | `backend/src/infrastructure/database/prisma/schema.prisma` | Models: `ShoppingList` (L65), `ShoppingItem` (L81), `Recipe` (L120), `Chore` (L138), `SyncIdempotencyKey` (L197) |
| Upsert Logic | `backend/src/modules/auth/services/auth.service.ts` | Inside each sync function (e.g., `prisma.shoppingList.upsert()`) |

**Quick verification steps**:
1. Confirm DTOs have `operationId` but NO timestamp fields
2. Confirm Prisma models have `@updatedAt` directive
3. Confirm upsert logic does NOT compare timestamps
4. Confirm idempotency uses `(userId, operationId)` unique constraint

---

## 🔧 Common Issues

### Issue: Duplicate processing
**Solution**: Ensure unique `operationId` per entity write

### Issue: Entities not syncing
**Check**: 
1. `operationId` in `conflicts[]`? (look at `reason`)
2. Entity soft-deleted? (remains invisible)
3. Network/auth issues?

### Issue: Stale data appearing
**Cause**: Last sync write wins (no server-side LWW gate)  
**Mitigation**: Client-side conflict resolution on pull

### Issue: Soft-deleted entity updated
**Behavior**: Normal - re-upsert updates fields but leaves `deletedAt`  
**Visibility**: Still filtered out by `ACTIVE_RECORDS_FILTER`

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-28  
**Status**: ✅ All terminology and semantics validated
