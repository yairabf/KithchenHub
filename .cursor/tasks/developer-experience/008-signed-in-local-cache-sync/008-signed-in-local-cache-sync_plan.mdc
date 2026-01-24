# 008 - Signed-In Local Cache + Sync

**Epic:** Developer Experience
**Created:** 2026-01-24
**Status:** Planning

## Overview
- Add local caching for signed-in users to improve performance and offline behavior.
- Keep cloud as source of truth while minimizing unnecessary network calls.

## Architecture
- Introduce a cache layer (read-through + write-through) for signed-in data.
- Track `lastSyncedAt` and per-entity version/updatedAt fields when available.
- Use network status to decide between cache-only, cache-then-refresh, or remote-only.

## Implementation Steps
1. **Define cache strategy**
   - Cache-first with background refresh when online.
   - Skip refresh if data unchanged (compare updatedAt/etag if available).
2. **Create cache storage utilities**
   - Shared cache helpers with TTL and safe parsing.
3. **Add repository layer**
   - Wrap remote services with cache-aware repositories.
   - Ensure writes update cache immediately and enqueue sync when offline.
4. **Integrate into features**
   - Use cache-aware repositories for recipes and shopping lists.
5. **Add tests**
   - Parameterized tests for TTL and stale detection.
   - Offline behavior and sync queue handling.

## API Changes
- None (client-side only).

## Testing Strategy
- Unit tests for cache helpers and repository logic.
- Manual test: signed-in offline usage, then reconnect and verify sync.

## Success Criteria
- Signed-in views load instantly from cache when available.
- Remote sync runs only when needed and does not overwrite newer local state.
- Offline changes are queued and synced on reconnect.
