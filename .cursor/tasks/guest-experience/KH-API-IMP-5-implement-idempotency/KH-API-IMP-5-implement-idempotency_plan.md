# KH-API-IMP-5 - Implement Idempotency via Import Mappings

**Epic:** Guest Experience
**Created:** 2026-01-22
**Status:** Completed

## Overview
The basic idempotency logic (checking existing mappings and skipping duplicates) is already implemented in `ImportService`. However, to ensure robust idempotency even under concurrent requests (race conditions), we need to enforce uniqueness at the database level.

This plan proposes enhancing the `ImportMapping` schema to enforce uniqueness per user and source field.

## User Review Required
> [!IMPORTANT]
> **Schema Change Proposed**: Adding `userId` to `ImportMapping` and a unique constraint `@@unique([userId, sourceField])`. This requires a database migration. This ensures that even if two requests run in parallel, we won't create duplicate mappings or entities.

## Proposed Changes

### Database Schema
#### [MODIFY] [schema.prisma](file:///Users/yairabramovitch/Documents/workspace/KithchenHub/backend/src/infrastructure/database/prisma/schema.prisma)
- Add `userId` field to `ImportMapping`.
- Add `@@unique([userId, sourceField])` to `ImportMapping`.
- (Optional) Backfill `userId` from `ImportBatch` if data exists (assuming fresh feature, might not be needed).

### Backend Logic
#### [MODIFY] [import.service.ts](file:///Users/yairabramovitch/Documents/workspace/KithchenHub/backend/src/modules/import/services/import.service.ts)
- Update `createImportMapping` to include `userId`.
- (Optional) Add specific error handling for unique constraint violation on mapping creation to return the existing mapping instead of failing (or just let it fail as "Concurrent modification" which client retries).

## Verification Plan

### Automated Tests
- Run existing `ImportService` tests (they cover sequential idempotency).
- Add a new test case mimicking concurrent requests if possible (checking that unique constraint throws).

### Manual Verification
- **Sequential**: Run `POST /import` twice. Confirm second call returns skipped items.
- **Concurrent**: (Hard to trigger manually) Send two requests via `curl` in background simultaneously.
