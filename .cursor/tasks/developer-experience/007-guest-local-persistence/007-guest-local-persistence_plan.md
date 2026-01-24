# 007 - Guest Local Persistence

**Epic:** Developer Experience
**Created:** 2026-01-24
**Status:** Planning

## Overview
- Replace in-memory guest data with durable on-device storage so guest shopping lists and recipes persist across sessions.
- Keep the guest-only rule: no cloud sync for guest users.

## Architecture
- Introduce a guest storage layer with explicit read/write helpers.
- Update local services to use persistent storage instead of in-memory data.
- Use empty-state defaults (no mock seeding).

## Implementation Steps
1. **Decide storage backend**
   - Default: AsyncStorage for v1 (simple key/value JSON).
   - Document tradeoffs and future migration path to SQLite/WatermelonDB.
2. **Create guest storage utilities**
   - New module for typed read/write helpers, key constants, and safe parsing.
3. **Update local services**
   - `LocalRecipeService` reads/writes guest recipes from storage.
   - `LocalShoppingService` reads/writes guest lists/items from storage.
4. **Update feature flows**
   - Ensure create/update/delete flows write through storage for guest.
5. **Add tests**
   - Parameterized tests for storage helpers (empty, invalid, populated).
   - Service tests for read/write behavior.

## API Changes
- None (local-only behavior).

## Testing Strategy
- Unit tests for storage utilities and local services.
- Manual test: create guest data, close app, reopen, verify persistence.

## Success Criteria
- Guest recipes and shopping lists persist after app restart.
- No remote API calls for guest data writes/reads.
- Guest storage starts empty unless user creates data.
