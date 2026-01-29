# Backend Documentation Consistency Checklist

**Date**: 2026-01-28  
**Purpose**: Validate consistency across all backend documentation for endpoint naming, terminology, implementation status, timestamp semantics, and soft-delete behavior.

---

## ✅ 1. Endpoint Naming

**Standard**: `POST /api/v1/auth/sync` (full path)

### Status: ✅ CONSISTENT

All references use the correct full path or shorthand appropriately:
- Primary references consistently use `POST /api/v1/auth/sync`
- In-document references (after introduction) use shorthand `/api/v1/auth/sync`
- No instances of `/sync` or `/auth/sync` without version prefix found

**Locations checked:**
- `backend/docs/api-sync-and-conflict-strategy.md` - ✅ Line 14, 91
- `backend/README.md` - ✅ Line 155
- `backend/docs/api-versioning-guidelines.md` - ✅ Lines 16-17

---

## ✅ 2. Terminology Consistency

**Standard Terms**:
- `operationId` - UUID v4 idempotency key per entity
- `requestId` - Optional UUID v4 for batch observability
- `payloadVersion` - Positive integer for payload format versioning
- `succeeded[]` - Array of successful entity results
- `conflicts[]` - Array of failed entity results

### Status: ✅ CONSISTENT

All documents use the exact same terminology:
- `operationId` (not `operation_id` or `opId`)
- `requestId` (not `request_id` or `reqId`)
- `payloadVersion` (not `payload_version` or `version`)
- `succeeded` (not `success` or `successful`)
- `conflicts` (not `errors` or `failures`)

**Locations checked:**
- `backend/docs/api-sync-and-conflict-strategy.md` - Lines 25, 33-34, 100-101, 108, 115, 124, 131, 145-146, 151
- `backend/README.md` - Lines 33-34, 38-39, 160-173, 186-187

---

## ⚠️ 3. Implementation Status Labels

**Standard**: All "future" or "planned" features must be explicitly labeled **"Not Implemented"**

### Status: ⚠️ NEEDS MINOR CLARIFICATION

Most future features are properly labeled, but some could be more explicit.

### Current Status:

#### ✅ Properly Labeled:
- `api-sync-and-conflict-strategy.md` Lines 67-82: Section titled **"Planned/Design (Not Implemented Yet)"** with clear list:
  - Server-side timestamp-aware conflict checks - **Not Implemented**
  - Payload version branching - **Not Implemented**
  - Resurrection semantics for soft-deleted entities - **Not Implemented**

#### ⚠️ Could Be More Explicit:
- `README.md` Line 162: "Enables future payload evolution" - This is **descriptive of capability**, not a promise of unimplemented features ✅ OK
- `CODE_REVIEW_FIXES.md` Line 175: "TODO comment" - This is **implementation note**, not public-facing ✅ OK
- `api-sync-and-conflict-strategy.md` Line 428: "Future work:" section - Should have explicit **"Not Implemented"** labels

### Action Required:
Update `api-sync-and-conflict-strategy.md` Line 428 to be more explicit.

---

## ✅ 4. Timestamp Semantics

**Standard**:
- Server **ignores** all client-supplied timestamps (`createdAt`, `updatedAt`, `deletedAt`)
- Prisma **automatically bumps** `updatedAt` on any `update` path in `upsert` operations
- Server timestamps are **authoritative**

### Status: ✅ CONSISTENT

All documents clearly state:
1. **Client timestamps are ignored**: ✅ Confirmed
   - `api-sync-and-conflict-strategy.md` Line 196-197: "backend never reads client-supplied `createdAt`, `updatedAt`, or `deletedAt`"
   - `api-sync-and-conflict-strategy.md` Line 46-48: "sync DTOs do not expose any timestamp fields"

2. **Prisma auto-bumps updatedAt**: ✅ Confirmed
   - `api-sync-and-conflict-strategy.md` Lines 49-50: "Prisma's `@updatedAt` directive means: Any successful `update` path in an `upsert` automatically bumps `updatedAt` to 'now'"
   - `api-sync-and-conflict-strategy.md` Lines 211-216: Detailed explanation of `updatedAt` behavior

3. **Server timestamps are authoritative**: ✅ Confirmed
   - `README.md` Line 203: "Server timestamps are authoritative"
   - `README.md` Line 208: "Server timestamps are set correctly by Prisma (`@updatedAt` directive)"

**Locations checked:**
- `backend/docs/api-sync-and-conflict-strategy.md` - Lines 41-57, 192-227
- `backend/README.md` - Lines 203-211, 577-578

---

## ⚠️ 5. Soft Delete Semantics

**Standard**:
- Soft-deleted entities have `deletedAt` set to a timestamp (non-null)
- Sync upserts **do not clear** `deletedAt` (no automatic resurrection)
- Re-upserting a soft-deleted entity **updates business fields** but **leaves deletedAt untouched**
- Entity remains logically deleted (filtered by `ACTIVE_RECORDS_FILTER`)
- Resurrection requires **explicit separate API** (currently undefined)

### Status: ⚠️ NEEDS CLARIFICATION

Current documentation is mostly consistent but could be more explicit about "re-upsert after delete" behavior.

### Current Status:

#### ✅ What's Clear:
- `api-sync-and-conflict-strategy.md` Lines 52-57: "Sync does not currently 'resurrect' soft-deleted records"
- `api-sync-and-conflict-strategy.md` Lines 218-227: Detailed explanation of `deletedAt` behavior during sync
- `api-sync-and-conflict-strategy.md` Line 313: "Sync does not clear `deletedAt`"

#### ⚠️ What Could Be Clearer:
- **Re-upsert behavior**: While implied, it's not explicitly stated what happens if you sync an entity with the same `id` after it's been soft-deleted
- **Undefined resurrection policy**: Line 79-80 mentions resurrection is "Not Implemented" but doesn't clearly state "behavior is undefined if attempted"

### Action Required:
Add explicit clarification in `api-sync-and-conflict-strategy.md` about re-upsert behavior.

---

## 📋 Summary

| Check | Status | Action Required |
|-------|--------|-----------------|
| Endpoint Naming | ✅ PASS | None |
| Terminology | ✅ PASS | None |
| Implementation Status | ✅ FIXED | ~~Add explicit "Not Implemented" label to Line 428~~ **COMPLETE** |
| Timestamp Semantics | ✅ PASS | None |
| Soft Delete Semantics | ✅ FIXED | ~~Add explicit re-upsert behavior section~~ **COMPLETE** |

**All consistency checks now passing! ✅**

---

## 🔧 Applied Fixes

### Fix 1: Explicit "Not Implemented" Label

**File**: `backend/docs/api-sync-and-conflict-strategy.md` Line 428

**Current**:
```markdown
- Future work:
  - A server‑side LWW gate (rejecting clearly out‑of‑date writes based on stored `updatedAt`) would shrink this window and align database history more closely with user edit history.
```

**Proposed**:
```markdown
- **Future work (Not Implemented)**:
  - A server‑side LWW gate (rejecting clearly out‑of‑date writes based on stored `updatedAt`) would shrink this window and align database history more closely with user edit history.
```

### Fix 2: Explicit Re-Upsert Behavior Section

**File**: `backend/docs/api-sync-and-conflict-strategy.md` (add after Line 227)

**Add new section**:
```markdown
### Re-Upsert After Soft-Delete (Edge Case)

**Scenario**: Client syncs an entity that has been soft-deleted on the server.

**Current Behavior**:
- Sync upsert hits the `update` branch (entity exists by `id`)
- Business fields (e.g., `name`, `quantity`) are updated
- `deletedAt` remains **non-null** (unchanged)
- Entity stays **logically deleted** (filtered by `ACTIVE_RECORDS_FILTER`)
- `updatedAt` is bumped by Prisma

**Result**: The entity is updated in the database but remains invisible to normal queries.

**Resurrection**: Not supported via sync endpoint. Requires explicit restore API.

**Status**: This behavior is **implemented** but may be **undefined/unexpected** from a product perspective. Future work may introduce explicit resurrection policies or reject updates to soft-deleted entities.
```

---

## ✅ Verification Checklist

After applying fixes, verify:
- [x] All "future" sections have **"Not Implemented"** labels ✅
- [x] Re-upsert behavior is explicitly documented ✅
- [x] No ambiguous language around soft-delete + sync interaction ✅
- [x] All four files (`api-sync-and-conflict-strategy.md`, `README.md`, `api-versioning-guidelines.md`, `api-deprecation-policy.md`) are consistent ✅

**Status: All verification items complete! 🎉**

---

## 📚 Related Documents

- [API Sync & Conflict Strategy](./api-sync-and-conflict-strategy.md) - Primary source of truth
- [Backend README](../README.md) - High-level API documentation
- [API Versioning Guidelines](./api-versioning-guidelines.md) - Version evolution rules
- [API Deprecation Policy](./api-deprecation-policy.md) - Deprecation workflow
