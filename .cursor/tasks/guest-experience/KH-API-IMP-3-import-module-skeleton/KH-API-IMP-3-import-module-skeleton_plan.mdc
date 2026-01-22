# KH-API-IMP-3 — Implement Import module skeleton (NestJS)

**Epic:** Guest Experience
**Created:** 2026-01-22
**Status:** Planning

## Overview
Create the `ImportModule` in the NestJS backend to handle data import functionality. This includes creating the module definition, controller, service, and repository, and registering the module in the main application module.

## Architecture
- **Framework**: NestJS
- **New Directory**: `backend/src/modules/import`
- **New Files**:
  - `import.module.ts`: Module definition.
  - `import.controller.ts`: API endpoints handler.
  - `import.service.ts`: Business logic.
  - `import.repository.ts`: Data access layer.
- **Modified Files**:
  - `backend/src/app.module.ts`: Import `ImportModule`.

## Implementation Steps
1.  **Create Module Structure**:
    -   Create `backend/src/modules/import` directory.
    -   Create `import.controller.ts` with basic `@Controller('import')` decorator.
    -   Create `import.service.ts` with `@Injectable()` decorator.
    -   Create `import.repository.ts` with `@Injectable()` decorator and `PrismaService` injection.
    -   Create `import.module.ts` registering the controller and providers (Service, Repository).
2.  **Register Module**:
    -   Import `ImportModule` in `backend/src/app.module.ts`.
3.  **Compile & Verify**:
    -   Ensure the backend compiles without errors.
    -   Verify the app starts and the module is initialized.

## Verification Plan
### Automated
-   `cd backend && npm run build`: Verify successful compilation.
-   `cd backend && npm run test` (if applicable for existing tests, merely ensuring no regressions).

### Manual
-   Start the server (`npm run start:dev`) and check logs for "ImportModule" initialization.
