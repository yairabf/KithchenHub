# 002 - Define Shared Data Shapes and Metadata

**Epic:** Architecture & Cross-Cutting Foundations
**Created:** 2026-01-25
**Status:** Planning

## Overview
- Standardize entity metadata for persistence, caching, and merges.
- Introduce shared interfaces and apply them to shopping/recipes/chores entities.
- Enforce timestamp and soft-delete conventions across selected entities.

## Architecture
- Add shared metadata interfaces in `mobile/src/common/types/`.
- Update entity interfaces in:
  - `mobile/src/mocks/shopping/shoppingItems.ts`
  - `mobile/src/mocks/recipes/index.ts`
  - `mobile/src/mocks/chores/index.ts`
- Update `mobile/src/common/types/index.ts` to export shared interfaces.

## Conventions
- **Timestamps:** in-memory `Date`, persisted as ISO string; types allow `Date | string`.
- **Soft-delete:** `deletedAt` present only when deleted (tombstone pattern); otherwise omitted.

## Implementation Steps
1. **Create shared interfaces** in `mobile/src/common/types/entityMetadata.ts`:
   - `EntityTimestamps` with `createdAt`, `updatedAt`, `deletedAt` (tombstone).
   - `BaseEntity` with `id` and `timestamps` fields (or direct timestamp fields; align with existing shapes).
   - Document file purpose and conventions at the top of the file.
2. **Update shopping entities** in `mobile/src/mocks/shopping/shoppingItems.ts` to extend/compose the shared metadata interface.
3. **Update recipe entities** in `mobile/src/mocks/recipes/index.ts` to extend/compose the shared metadata interface.
4. **Update chore entities** in `mobile/src/mocks/chores/index.ts` to extend/compose the shared metadata interface.
5. **Export shared types** from `mobile/src/common/types/index.ts`.
6. **Validation pass**: ensure strict typing, no `any`, and timestamp fields applied consistently.

## Testing Strategy
- No new runtime behavior; type-level change only.
- If any tests exist for these types, update snapshots/fixtures if needed.

## Success Criteria
- Shared entity interfaces exist in `mobile/src/common/types/`.
- Shopping, recipe, and chore entities include `id`, `createdAt`, `updatedAt`, optional `deletedAt` (tombstone).
- Timestamp and soft-delete conventions are documented and consistently used.
