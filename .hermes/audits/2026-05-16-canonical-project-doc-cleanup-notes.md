# Canonical Project Documentation Cleanup Notes

Date: 2026-05-16

## Source inspected

Canonical docs:

- `docs/project/PROJECT_OVERVIEW.md`
- `docs/project/ARCHITECTURE.md`
- `docs/project/RECENT_CHANGES.md`
- `docs/project/RELEASE_STATUS.md`
- `docs/project/STORE_COMPLIANCE.md`
- `.hermes/START_HERE.md`
- `.hermes/PROJECT_CONTEXT.md`

Source-backed maps from earlier cleanup passes:

- `docs/project/DOCUMENTATION_MAP.md`
- `docs/api/backend-endpoints.md`
- `docs/features/mobile-ui-map.md`

## Decisions

### Preserve canonical project docs

Preserve all reviewed canonical docs. They are useful and mostly consistent with the current documentation cleanup structure.

### Update read order and source-backed map pointers

Updated these docs so fresh agents are directed to the new map files before relying on older detailed docs:

- `docs/project/PROJECT_OVERVIEW.md`
- `docs/project/ARCHITECTURE.md`
- `docs/project/RECENT_CHANGES.md`
- `.hermes/PROJECT_CONTEXT.md`

Key additions:

- `docs/project/DOCUMENTATION_MAP.md` is now part of canonical read order.
- `docs/features/mobile-ui-map.md` is called out for mobile/UI work.
- `docs/api/backend-endpoints.md` is called out for backend/API work.

### Clarify backend API documentation source of truth

`docs/project/ARCHITECTURE.md` now notes that Swagger/OpenAPI setup is currently disabled in `backend/src/main.ts`, so agents should not cite `/api/docs/v1` as active unless source re-enables it.

### Clarify dashboard/QuickStats conflict

`.hermes/PROJECT_CONTEXT.md` previously said to remove the dashboard quick stats row as part of older dashboard direction. Current source-backed map still lists `QuickStatsRow` / `QuickStatCard` as present. The context now labels older quick-stats removal notes as product-direction context, not proof that those components are absent.

## Preserve without changes

- `docs/project/RELEASE_STATUS.md`
- `docs/project/STORE_COMPLIANCE.md`
- `.hermes/START_HERE.md`

Reason: these already point to the documentation map or are current status snapshots. Release/store status was not externally revalidated in this pass, so no review-state claims were changed.

## Archive/delete decision

No canonical project docs were archived or deleted.

Reason: this bucket contains the active source-of-truth docs for future agents. The right action was reconciliation and source-map linking, not archiving.

## Follow-up gaps

- Release status and store compliance still depend on external store-console state. Do not update accepted/pending status without checking current store review status or receiving it from the user.
- `docs/project/RECENT_CHANGES.md` still contains dated recent commit references. That is acceptable for recent context, but it should be pruned if it becomes noisy.
- Future docs passes should continue to update `docs/project/DOCUMENTATION_MAP.md` whenever archive buckets or canonical docs change.
