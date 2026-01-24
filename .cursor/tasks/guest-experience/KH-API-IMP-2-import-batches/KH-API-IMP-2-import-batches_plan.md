# KH-API-IMP-2 — Add DB tables for import batches & mappings

**Epic:** Guest Experience
**Created:** 2026-01-22
**Status:** Planning

## Overview
Add Postgres/Prisma models + migrations for `import_batches` and `import_mappings` with required unique indexes. This supports the feature where users can import local guest data after signing in.

## Architecture
- **Language/Framework**: Prisma ORM, Postgres
- **Files to Modify**: `backend/src/infrastructure/database/prisma/schema.prisma`
- **New Models**:
  - `ImportBatch`: Tracks the status and source of a data import operation.
  - `ImportMapping`: Stores mappings between imported columns/fields and system fields.

## Implementation Steps
1.  **Modify `schema.prisma`**:
    -   Add `ImportBatch` model.
    -   Add `ImportMapping` model.
    -   Establish relations to `User`.
    -   Add unique indexes.
2.  **Generate Migration**:
    -   Run `npx prisma migrate dev --name add_import_batches` (inside `backend` directory).
3.  **Verify**:
    -   Check the generated migration SQL.
    -   Verify the client generation.

## Schema Details (Proposed)

```prisma
// In schema.prisma

model ImportBatch {
  id          String    @id @default(cuid())
  userId      String    @map("user_id")
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  status      String    @default("PENDING") // PENDING, MAPPING, PROCESSING, COMPLETED, FAILED
  filename    String?
  source      String    // e.g. "GUEST_MODE_MIGRATION"
  startedAt   DateTime  @default(now()) @map("started_at")
  completedAt DateTime? @map("completed_at")
  error       String?
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  mappings    ImportMapping[]

  @@map("import_batches")
  @@index([userId])
}

model ImportMapping {
  id          String      @id @default(cuid())
  batchId     String      @map("batch_id")
  batch       ImportBatch @relation(fields: [batchId], references: [id], onDelete: Cascade)
  sourceField String      @map("source_field")
  targetField String      @map("target_field")
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")
  
  @@map("import_mappings")
  @@unique([batchId, sourceField])
}
```

## Verification Plan
### Automated
-   Run the migration command and ensure it succeeds: `npx prisma migrate dev`.
-   Verify Prisma Client updates: `npx prisma generate`.

### Manual
-   Inspect the generated `migrations` folder to ensure SQL is correct.
