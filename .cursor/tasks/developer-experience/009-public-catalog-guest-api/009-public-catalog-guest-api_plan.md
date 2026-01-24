# 009 - Public Catalog API for Guests

**Epic:** Developer Experience
**Created:** 2026-01-24
**Status:** Planning

## Overview
- Ensure guest users can access public catalog data (ingredients, grocery items) via API.
- Add safe fallback to local cache on network/API failure.

## Architecture
- Public catalog data is always API-backed for all users.
- Local cache is a fallback only (offline or API error).

## Implementation Steps
1. **Audit catalog usage**
   - Find all grocery/ingredient search and category calls.
2. **Normalize API + fallback pattern**
   - Use shared helper for `try API -> fallback to cache`.
3. **Update screens/hooks**
   - Apply consistent pattern in recipes and shopping flows.
4. **Add tests**
   - Parameterized tests for API success vs failure fallback.

## API Changes
- None (client-side only).

## Testing Strategy
- Unit tests for fallback helper.
- Manual test: guest user with network offline still sees catalog results.

## Success Criteria
- Guest users can search ingredients/groceries using API.
- Fallback to cache works on API failure.
- No guest gating on public catalog requests.
