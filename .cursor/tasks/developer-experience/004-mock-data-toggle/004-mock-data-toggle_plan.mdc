# 004 - Mock Data Toggle

**Epic:** Developer Experience
**Created:** 2026-01-23
**Status:** Planning

## Overview
- Add an Expo environment flag to toggle mock data usage across the mobile app.
- Centralize mock vs real service selection per feature for consistency.
- Ensure import and recipe flows respect the same toggle.

## Architecture
- Components affected: Recipes, Shopping, Chores, Import services.
- New files to create: mock toggle helper utility, shopping/chores service abstractions.
- Files to modify: config, feature hooks/screens, import service.
- Dependencies required: none.

## Implementation Steps
1. Add `EXPO_PUBLIC_USE_MOCK_DATA` to config and a helper to parse it safely.
2. Refactor recipe service selection to use the mock toggle.
3. Add shopping and chores service interfaces with local/mock and remote implementations.
4. Update screens/hooks to select services via the toggle, removing direct mock state initialization.
5. Update import service to respect the toggle.
6. Add parameterized tests for toggle parsing and service selection.
7. Document results in the summary file.

## API Changes (if applicable)
- None (client-only configuration change).

## Testing Strategy
- Unit tests for toggle parsing with true/false/undefined.
- Unit tests for service selection for each feature.
- Manual smoke checks with mocks on/off.

## Success Criteria
- One toggle controls mock usage across shopping, chores, recipes, and import.
- No direct mock state initialization remains in screens.
- Mock toggle defaults are safe and documented.
