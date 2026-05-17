# API / Backend Docs Archive — 2026-05-16

This archive contains backend/API documentation files moved out of active backend doc paths during the source-backed API documentation cleanup pass.

## Archived files

- `backend-docs/MONITORING_SETUP 2.md`
- `backend-docs/LOGGING_GUIDE 2.md`

## Why archived

Both files were byte-for-byte duplicates of active docs:

- `backend/docs/MONITORING_SETUP.md`
- `backend/docs/LOGGING_GUIDE.md`

Keeping duplicate active docs makes future API/ops cleanup harder because agents may patch one copy and leave the other stale.

## Current replacements

Use these active docs instead:

- `backend/docs/MONITORING_SETUP.md`
- `backend/docs/LOGGING_GUIDE.md`
- `docs/api/backend-endpoints.md`
- `backend/docs/README_DOCS.md`

Do not treat archived duplicate files as current source of truth.
