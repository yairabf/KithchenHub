# 003 - Household Uploads

**Epic:** Backend Foundation
**Created:** 2026-01-23
**Status:** Planning

## Overview
- Create a private Supabase Storage bucket named `household-uploads`.
- Restrict read/write access to household members based on folder path.
- Verify upload/download permissions via automated or manual checks.

## Architecture
- Storage provider: Supabase Storage
- Bucket: `household-uploads` (private)
- Folder convention: `households/{household_id}/...` (no enforcement of subpaths yet)
- Access control: RLS policies on `storage.objects` using `split_part(name, '/', 2)` and `users.id = auth.uid()`

## Implementation Steps
1. Create a migration to insert the private bucket into `storage.buckets` (fallback: document manual creation if insert is blocked).
2. Add RLS policies on `storage.objects` for `SELECT`, `INSERT`, optional `UPDATE`, and optional `DELETE`.
3. Implement tests (preferred) or manual validation for cross-household access denial.

## Testing Strategy
- Automated: Extend `backend/src/infrastructure/database/rls.spec.ts` if feasible.
- Manual fallback:
  - Upload to `households/{my_household_id}/...` succeeds.
  - Cross-household access is denied for read/write.

## Success Criteria
- `household-uploads` bucket exists and is private.
- RLS policies enforce household isolation for read/write.
- Upload/download permissions verified by tests or manual checks.
