# Kitchen Hub Backend

API service for Kitchen Hub, built with NestJS (Fastify) and Prisma on PostgreSQL. Provides authentication, household management, shopping, recipes, chores, and dashboard data for the mobile/web clients.

## Features
- JWT auth with Google sign-in (Supabase), guest login, token refresh, and offline sync
- UUID-based user identification for seamless cross-provider integration
- Household membership plus shopping lists/items, recipes, and chores
- **Soft Deletes**: User-owned entities (households, shopping lists, items, recipes, chores) support soft-delete via `deleted_at` timestamp
  - Centralized `ACTIVE_RECORDS_FILTER` constant for consistent querying
  - Repository-level restore methods for data recovery (`restoreRecipe()`, `restoreList()`, etc.)
  - Audit logging for all soft-delete and restore operations
  - No automatic cascade (parent deletes don't affect children)
- **Automatic Timestamps**: All entities include `created_at` and `updated_at` timestamps; `updated_at` is automatically maintained by Prisma
- Master grocery catalog (`master_grocery_catalog` table) backing search, categories, and default item properties
- Shopping items can reference catalog items for consistency and defaults
- Private household uploads bucket with storage RLS policies
- Data import from guest mode to household accounts with content fingerprinting and idempotency
- Dashboard summaries for household activity
- Global prefix `api/v1`; Swagger UI at `/api/docs`
- Bearer auth required for most endpoints (auth routes are public)

## Requirements
- Node.js 18+ and npm
- PostgreSQL database reachable via `DATABASE_URL` (use Supabase pooler if on IPv4-only networks)
- Direct database URL for migrations via `DIRECT_URL` (recommended with Supabase)
- `.env` file with the variables validated in `src/config/env.validation.ts`

Example `.env`:
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/kitchen_hub
DIRECT_URL=postgresql://USER:PASSWORD@localhost:5432/kitchen_hub
JWT_SECRET=change-me-to-32+chars
JWT_REFRESH_SECRET=change-me-to-32+chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Getting Started
```
cd backend
npm install
npm run prisma:generate   # generate Prisma client
npm run start:dev         # start API with watch mode
```

## Running & Testing
- Dev server: `npm run start:dev`
- Build for production: `npm run build`
- Start built app: `npm run start:prod` (runs `dist/main.js`)
- Lint: `npm run lint`
- Tests: `npm test`, `npm run test:e2e`, coverage via `npm run test:cov`

## Database (Prisma)
- Schema: `src/infrastructure/database/prisma/schema.prisma`
- Generate client: `npm run prisma:generate`
- Create/apply dev migrations: `npm run prisma:migrate` (PostgreSQL must be running)
- Deploy migrations in shared environments: `npx prisma migrate deploy`
- Inspect data: `npm run prisma:studio`
- Supabase: prefer a direct connection string in `DIRECT_URL` for migrations; use the session pooler in `DATABASE_URL` if your network is IPv4-only.

## Supabase Setup
- **Config**: Supabase client is initialized in `src/modules/supabase/supabase.service.ts`.
- **Environment**: Requires `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env`. Optionally include `SUPABASE_SERVICE_ROLE_KEY` for admin operations.
- **Local Dev**: For local development, ensure these point to your local Supabase instance or a dev project.
- **Row Level Security (RLS)**:
  - Multi-tenant isolation is enforced at the database level via PostgreSQL RLS policies.
  - Users are restricted to data matching their `household_id` (retrieved via the `get_my_household_id()` SQL helper).
  - Security policies cover `households`, `users`, `recipes`, `shopping_lists/items`, `master_grocery_catalog`, `chores`, and `import` data.
  - Storage RLS restricts access to the private `household-uploads` bucket by household folder.

## Security Testing (RLS)
To verify that Row Level Security is correctly isolating data between households:
1. **Prerequisites**: Ensure you have applied migrations (`npm run prisma:migrate`).
2. **Run Tests**:
   ```bash
   npm run test src/infrastructure/database/rls.spec.ts
   ```
3. **Internal Logic**: These tests simulate the Supabase environment by:
   - Setting the PostgreSQL role to `authenticated`.
   - Injecting JWT claims (e.g., `SET LOCAL "request.jwt.claims" = '{"sub": "..."}'`) within a transaction.
4. **Storage RLS**: Tests require storage policies to be applied. If your DB user cannot access them, set `ALLOW_STORAGE_RLS_SKIP=true` to bypass storage checks.


## API Conventions
- Base URL: `http://localhost:3000/api/v1`
- Docs: `http://localhost:3000/api/docs`
- Public routes: `POST /auth/google`, `POST /auth/guest`, `POST /auth/refresh`, `GET /groceries/search`, `GET /groceries/categories` (others use bearer JWT)
- Shopping endpoints: `GET /shopping-lists`, `POST /shopping-lists`, `GET /shopping-lists/:id`, `DELETE /shopping-lists/:id`, `POST /shopping-lists/:id/items`, `PATCH /shopping-items/:id`, `DELETE /shopping-items/:id`
- Recipe endpoints: `GET /recipes`, `POST /recipes`, `GET /recipes/:id`, `PUT /recipes/:id`, `POST /recipes/:id/cook`
- Protected routes: Most endpoints require JWT authentication; household endpoints also require household membership
- CORS enabled with credentials for client apps

## Project Structure
```
src/
  main.ts                      # Bootstrap with Swagger + global pipes/filters
  app.module.ts                # Module wiring and global JWT guard
  common/
    contracts/                 # Zod validation schemas for cross-module contracts
    decorators/                # Custom decorators (@CurrentUser, @Public)
    filters/                   # Exception filters
    guards/                    # Auth guards (JWT, Household)
    interceptors/              # Response transformation
    utils/                     # Shared utility functions
    services/                  # Shared services (e.g. UuidService)
    pipes/                     # Validation pipes
    types/                     # Shared TypeScript interfaces
  config/                      # Env validation + configuration loader
  infrastructure/database/     # Prisma module/service and schema
  modules/
    auth/                      # Google + guest auth, token refresh, sync
    households/                # Household CRUD/membership
    shopping/                  # Lists, items, and master grocery catalog search
    recipes/                   # Household recipes
    chores/                    # Task assignments and completion
    import/                    # Guest mode data import (ID-based & fingerprint deduplication)
    dashboard/                 # Aggregated dashboard data
    users/                     # User profile management
    settings/                  # Application and user settings
    supabase/                  # Supabase client service (global module)
```

## Notes
- The API runs behind a global JWT guard; mark endpoints with the `@Public()` decorator to opt out.
- Global prefix, validation pipe, error filter, and response transformer are configured in `src/main.ts`.
- Comprehensive test coverage includes unit tests for controllers, services, and repositories with parameterized test cases.
- Database uses UUID for all user-related identifiers to maintain consistency with Supabase Auth identities.