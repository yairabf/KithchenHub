# 003 - Household/List/Item Schema

**Epic:** Backend Foundation
**Created:** 2026-01-22
**Status:** Planning

## Overview
- Add missing indexes for household/list/item lookups.
- Ensure foreign key lookups are performant for household-based access.

## Architecture
- Components affected: Database schema (Prisma + migrations)
- New files to create:
  - `backend/src/infrastructure/database/prisma/migrations/20260122120000_add_household_list_item_indexes/migration.sql`
- Files to modify:
  - `backend/src/infrastructure/database/prisma/schema.prisma`

## Implementation Steps
1. Review current Prisma models for household/list/item relations.
2. Add missing `@@index` definitions.
3. Generate a migration for new indexes.
4. Apply migration in Supabase.

## Testing Strategy
- Run `npx prisma migrate deploy` against Supabase.

## Success Criteria
- Indexes exist for `users.household_id` and `shopping_items.list_id` (+ composite `list_id,is_checked`).
- Migration applies cleanly in Supabase.
