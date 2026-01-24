# 002 - Secure multi-tenant data access with RLS

**Epic:** Backend Foundation
**Created:** 2026-01-22
**Status:** Planning

## Overview
- Secure all multi-tenant data access using Row Level Security (RLS) based on household membership.
- Problem: Prevent users from accessing data belonging to other households.
- User story: As a user, I want my household data to be isolated and secure so that other households cannot see or modify it.

## Architecture
- Components affected: Database (PostgreSQL/Supabase)
- New files to create:
  - `src/infrastructure/database/prisma/migrations/20260122130000_enable_rls_and_policies/migration.sql`
- Files to modify: None (Prisma schema remains unchanged, just manual migration)

## Implementation Steps
1. Create a manual Prisma migration for RLS.
2. Enable RLS on all user-facing tables.
3. Create a helper function `get_my_household_id()` for efficient household lookups.
4. Define SELECT/INSERT/UPDATE/DELETE policies for each table.
5. Implement security tests to verify data isolation.

## Testing Strategy
- **Unit/Integration tests:** Create a new test suite that attempts cross-household access using Prisma/Supabase clients with restricted tokens.
- **Manual testing:** Verify data visibility through the app UI with different accounts.

## Success Criteria
- RLS enabled on all user-facing tables.
- Users can only access rows from their household.
- Cross-household access is impossible.
- Security tests pass.
