# Kitchen Hub Backend API 🚀

NestJS (Fastify) REST API service for Kitchen Hub, providing authentication, household management, shopping lists, recipes, chores, and dashboard data for the [mobile application](../mobile/README.md).

![NestJS](https://img.shields.io/badge/NestJS-10.0.0-E0234E) ![TypeScript](https://img.shields.io/badge/TypeScript-5.1.3-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-supported-336791) ![Prisma](https://img.shields.io/badge/Prisma-5.0.0-2D3748)

## Overview

Kitchen Hub Backend is a RESTful API built with NestJS and Fastify, providing a robust backend service for the Kitchen Hub mobile application. It handles authentication, data persistence, synchronization, and business logic for household management features.

## Features

### Authentication & Authorization
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Email/Password Authentication**: Traditional email/password registration and login with email verification
  - Registration with password hashing (bcrypt, 12 rounds)
  - Email verification flow with auto-login after verification
  - Resend verification email endpoint
  - Email verification required before login
- **Google OAuth**: Integration with Supabase for Google sign-in; three flows: login (existing user, no household switch; household in body rejected), sign-up (new user, no household → backend creates household with default name; optional rename via PUT /household), join via invite (household.id from GET /invite/validate)
- **Token Refresh**: Secure token refresh mechanism with automatic cleanup of existing tokens
- **Offline Sync**: Data synchronization endpoint for offline-first mobile app
- **UUID-based Users**: Seamless cross-provider integration with UUID identifiers

### Data Management
- **Soft Deletes**: User-owned entities support soft-delete via `deleted_at` timestamp
  - Centralized `ACTIVE_RECORDS_FILTER` constant for consistent querying
  - Helper function `buildActiveRecordsFilter()` for combining filters
  - Repository-level restore methods for data recovery
  - Audit logging for all soft-delete and restore operations
  - No automatic cascade (allows selective restoration)
- **Account Deletion & Data Export (GDPR)**: `DELETE /users/me` and `GET /users/me/export`
  - Account deletion: soft-delete/hard-delete user, revoke refresh tokens, clear idempotency keys; sole household admin triggers household (and data) deletion; admin with other members promotes next member
  - Data export: JSON export of user profile, household, recipes, shopping lists, assigned chores, and activity summary
  - Audit logs: database-persisted audit trail for account deletion, household deletion, data export, member removal, and restore operations
- **Automatic Timestamps**: All entities include `created_at` and `updated_at` timestamps
  - `updated_at` automatically maintained by Prisma
- **Master Grocery Catalog**: Centralized grocery database with categories and search
- **Data Import**: Import data to household accounts with fingerprinting and idempotency
- **Sync Idempotency**: Sync operations use idempotency keys to prevent duplicate processing
  - Each entity includes a unique `operationId` (UUID) for idempotent retries
  - Optional `requestId` for batch observability
  - Atomic insert-first pattern ensures exactly-once processing
  - Automatic cleanup of old idempotency keys (configurable retention period)
- **Partial Batch Recovery**: Sync endpoint returns granular per-entity results
  - `succeeded` array lists successful entities with `operationId` mapping
  - `conflicts` array includes `operationId` for precise failure tracking
  - Enables mobile clients to retry only failed items instead of entire batch
  - Invariant enforcement ensures every `operationId` appears in results (logs error if violated)

### Household Management
- Multi-user household support
- **Create household**: `POST /household` for users without a household (JWT only; no household required)
- **Update household**: `PUT /household` (admin only); name validated (trimmed, non-empty, max 200 chars)
- **Invite code validation**: Public `GET /invite/validate?code=` resolves invite code to household id and name (for join flow before sign-in); token format structured for optional expiry
- **Idempotent join**: Adding user to household is no-op if already a member (safe for retries)
- **Race-safe sign-up**: Creating household for new user returns existing household id if user already has one (e.g. duplicate sign-up)
- Member invitation and management
- Household-level data isolation
- Row Level Security (RLS) via Supabase

### Core Modules
- **Shopping Lists**: Multi-list management with items, grocery catalog integration, and **custom items** (household-defined items shared across all household members; automatically created when adding non-catalog items; `GET /shopping-items/custom`)
  - **Main List**: Each household has a designated main shopping list created automatically (`isMain: true`)
  - **Default Main List**: Created with name "Weekly Shopping", green color (#4CAF50), and cart icon
  - **Main List Endpoint**: `GET /shopping-lists/main` retrieves the household's main shopping list
- **Recipes**: Recipe CRUD with ingredients, instructions, and soft-delete (`DELETE /recipes/:id`); canonical unit system for ingredient quantities with validation (constants, unit-converter utils, unit-type validators)
- **Chores**: Task management with assignees, completion tracking, and soft-delete (`DELETE /chores/:id`)
- **Dashboard**: Aggregated household activity summaries
- **Import**: Data import with deduplication and fingerprinting

### Infrastructure
- **PostgreSQL Database**: Prisma ORM with migrations
- **Supabase Integration**: Auth, storage, and RLS policies
- **Docker Support**: Production-ready multi-stage Dockerfile with optimized builds (~150MB)
- **GitHub Container Registry (GHCR)**: Automated Docker image builds and pushes
  - **Production builds** (`build.yml`): Automatically builds and pushes on merges to `develop` and `main` branches
  - **Development builds** (`build-push.yml`): Builds for all branches (feature branches, PRs, etc.)
  - Images tagged with branch + SHA for traceability
  - GitHub Actions cache for faster builds
  - Pull-ready images for production deployments
- **Vercel Backend Deployment**: current backend deploy target is Vercel with root directory `backend`
  - Config: [`vercel.json`](./vercel.json)
  - Build script: `npm run vercel-build`
  - Manual GitHub redeploy hook: `.github/workflows/manual-deploy.yml` with `redeploy_backend_vercel=true`
  - Current guide: [Deployment Guide](./DEPLOYMENT.md)
  - Environment checklist: [Environment Variable Checklist](./docs/ENV_VAR_CHECKLIST.md)
  - Legacy GCP/AWS deployment docs are archived under `../docs/archive/deployment-docs-2026-05-16/`
- **Local Staging Verification**: Optional `docker-compose.staging.yml` and `verify-staging.sh` for running a staging-like stack locally (Postgres + API), running migrations, and smoke-testing `/api/version`. Requires `.env.staging`. See [Deployment Guide](./DEPLOYMENT.md) for CI/CD staging; run `./verify-staging.sh` from `backend/` for local verification.
- **Swagger Documentation**: currently disabled in `src/main.ts`; use [`../docs/api/backend-endpoints.md`](../docs/api/backend-endpoints.md) for the current endpoint inventory.
- **API Versioning**: URI-based versioning (`/api/v1`, `/api/v2`, etc.)
- **Version Discovery**: `GET /api/version` endpoint for version information
- **Deploy Metadata (Vercel)**: `GET /api/v1/deploy-info` for deployment SHA/version reporting
- **Client legal URLs (public)**: `GET /api/v1/client-links` returns `{ privacyPolicyUrl, termsOfServiceUrl }` for the mobile/web apps. Defaults use `AUTH_BACKEND_BASE_URL` + `/privacy` and `/terms`; override with `LEGAL_PRIVACY_POLICY_URL` / `LEGAL_TERMS_OF_SERVICE_URL` when needed.
- **Deprecation Support**: Automatic deprecation headers and sunset handling
- **CORS Enabled**: Configured for mobile app access

## Requirements
- Node.js 18+ and npm
- PostgreSQL database reachable via `DATABASE_URL` (use Supabase pooler if on IPv4-only networks)
- Optional direct DB URL via `DIRECT_URL` for migrations when `DATABASE_URL` is pooled (e.g. Supabase pooler); otherwise Prisma uses `DATABASE_URL`
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

# Email configuration (optional, for email verification)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
EMAIL_FROM=noreply@kitchenhub.com
EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS=24
AUTH_BACKEND_BASE_URL=http://localhost:3000
```

Optional (monitoring and logging): `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE`, `LOG_LEVEL`, `LOG_FORMAT`. See `src/config/env.validation.ts` and the [Monitoring Setup Guide](./docs/MONITORING_SETUP.md).

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
- Tests: `npm test` (excludes RLS; passes without Supabase), `npm run test:rls` (RLS only), `npm run test:all` (full suite), `npm run test:e2e`, coverage via `npm run test:cov`

## Local Development with Docker Compose

Docker Compose provides an easy way to run the backend API and PostgreSQL database locally with minimal setup. This setup mirrors production as closely as reasonable while providing development-friendly features like hot reload.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running
- Docker Compose (included with Docker Desktop)

### Option 1: Database Only (Recommended for Development)

Run only PostgreSQL in Docker while running the backend locally with `npm run start:dev`. This provides the fastest development experience with hot reload.

**Prerequisites**: Make sure Docker Desktop is installed and running.

1. **Start PostgreSQL database**:
   ```bash
   npm run db:start
   ```
   This uses `docker-compose.db.yml` and `.env.db` to start only the PostgreSQL container.

2. **Verify database is running**:
   ```bash
   npm run db:ps
   ```
   Wait until postgres shows as "healthy" (usually 5-10 seconds).

3. **Configure local environment**:
   Create a `.env` file with:
   ```bash
   DATABASE_URL="postgresql://kitchen_hub:kitchen_hub_dev@localhost:5432/kitchen_hub?schema=public"
   DIRECT_URL="postgresql://kitchen_hub:kitchen_hub_dev@localhost:5432/kitchen_hub?schema=public"
   # ... other environment variables (JWT_SECRET, SUPABASE_URL, etc.)
   ```
   See `.env.example` for a complete list of required variables.

4. **Run database migrations**:
   ```bash
   npm run prisma:migrate
   ```

5. **Start backend locally**:
   ```bash
   npm run start:dev
   ```

**Useful database commands**:
- Stop database: `npm run db:stop`
- View logs: `npm run db:logs`
- Check status: `npm run db:ps`

**Database connection details** (default from `.env.db`):
- Host: `localhost`
- Port: `5432`
- Database: `kitchen_hub`
- User: `kitchen_hub`
- Password: `kitchen_hub_dev`

### Option 2: Full Stack with Docker Compose

Run both the backend API and PostgreSQL database in Docker containers.

#### Quick Start

1. **Copy environment file template**:
   ```bash
   cp .env.docker-compose.example .env
   ```

2. **Update `.env` with your values**:
   - Set `JWT_SECRET` and `JWT_REFRESH_SECRET` (minimum 32 characters each)
     - Generate with: `openssl rand -base64 32`
   - Add your Supabase credentials (URL, anon key, service role key)
   - Other variables are pre-configured for Docker Compose

3. **Start database service**:
   ```bash
   docker-compose up -d postgres
   ```

4. **Wait for database to be ready** (check status):
   ```bash
   docker-compose ps
   ```
   Wait until postgres shows as "healthy" (usually takes 5-10 seconds).

5. **Run initial database migrations**:
   ```bash
   docker-compose exec backend npm run prisma:migrate
   ```
   This creates and applies all migrations. For production deployments, use `prisma migrate deploy` instead.

6. **Generate Prisma Client** (if needed):
   ```bash
   docker-compose exec backend npm run prisma:generate
   ```

7. **Start backend service**:
   ```bash
   docker-compose up backend
   ```
   Or run in background: `docker-compose up -d backend`

The API will be available at `http://localhost:3000`. Swagger setup is currently disabled in `src/main.ts`; use `../docs/api/backend-endpoints.md` for the current endpoint inventory.

**Catalog icon storage (MinIO)**
The full stack includes MinIO and a one-time init step that uploads `../sandbox/downloaded_icons` into the `catalog-icons` bucket. Ensure `sandbox/downloaded_icons` exists (e.g. from running the icon generator). The backend rewrites relative catalog `image_url` values to `CATALOG_ICONS_BASE_URL` (default `http://localhost:9000/catalog-icons`) so the mobile app can load icons. Optional: set `CATALOG_ICONS_BASE_URL` in `.env` if you use a different URL.

**Catalog icons not loading?**
1. Ensure icons are in MinIO: from `backend/` run `docker-compose run --rm catalog-storage-init` (requires `../sandbox/downloaded_icons`).
2. For Expo web, MinIO CORS is set via `MINIO_API_CORS_ALLOW_ORIGIN` (default `*`). If needed, set `MINIO_CORS_ORIGIN=http://localhost:8081` in `.env`.
3. Restart MinIO after changing CORS: `docker-compose restart minio`.

### Development Workflow

**Start all services in background**:
```bash
docker-compose up -d
```

**View logs**:
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# PostgreSQL only
docker-compose logs -f postgres
```

**Database Migrations**:

For local development (creates and applies migrations):
```bash
docker-compose exec backend npm run prisma:migrate
```

For production/shared environments (applies existing migrations only):
```bash
docker-compose exec backend npx prisma migrate deploy --schema=src/infrastructure/database/prisma/schema.prisma
```

**Open Prisma Studio** (database GUI):
```bash
docker-compose exec backend npm run prisma:studio
```
Prisma Studio will be available at `http://localhost:5555` (port is mapped in docker-compose.yml).

**Stop services**:
```bash
docker-compose down
```

**Stop and remove volumes** (clean slate - deletes database data):
```bash
docker-compose down -v
```

### Command Reference

| Task | Command |
|------|---------|
| Start database only | `docker-compose up -d postgres` |
| Start all services | `docker-compose up -d` |
| Start backend (foreground) | `docker-compose up backend` |
| View all logs | `docker-compose logs -f` |
| View backend logs | `docker-compose logs -f backend` |
| Check service status | `docker-compose ps` |
| Run dev migrations | `docker-compose exec backend npm run prisma:migrate` |
| Deploy migrations (prod) | `docker-compose exec backend npx prisma migrate deploy --schema=src/infrastructure/database/prisma/schema.prisma` |
| Generate Prisma Client | `docker-compose exec backend npm run prisma:generate` |
| Open Prisma Studio | `docker-compose exec backend npm run prisma:studio` |
| Re-upload catalog icons to MinIO | `docker-compose run --rm catalog-storage-init` (from backend/, needs ../sandbox/downloaded_icons) |
| Stop services | `docker-compose down` |
| Stop and remove volumes | `docker-compose down -v` |
| Reset everything | `docker-compose down -v && docker-compose up -d` |

### Accessing Services

- **Backend API**: `http://localhost:3000`
- **API Documentation**: `../docs/api/backend-endpoints.md` for current endpoint inventory; Swagger is currently disabled in `src/main.ts`.
- **Version Discovery**: `http://localhost:3000/api/version`
- **Prisma Studio**: `http://localhost:5555` (when running)
- **PostgreSQL**: `localhost:5432`
  - User: `kitchen_hub`
  - Password: `kitchen_hub_dev`
  - Database: `kitchen_hub`
- **MinIO (catalog icons)**: `http://localhost:9000` (API), `http://localhost:9001` (Console)
  - On first `docker-compose up`, the `catalog-storage-init` service uploads `../sandbox/downloaded_icons` into the `catalog-icons` bucket so grocery catalog items from `final_zero_risk_db.json` can load their icons. Set `CATALOG_ICONS_BASE_URL=http://localhost:9000/catalog-icons` (or in `.env`) so the API returns full icon URLs.

### Troubleshooting

**Port conflicts**:
If ports 3000, 5432, or 5555 are already in use, modify the port mappings in `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Backend on host port 3001
  - "5556:5555" # Prisma Studio on host port 5556
  - "5433:5432"  # PostgreSQL on host port 5433
```

**Database connection errors**:
- Ensure PostgreSQL service is healthy: `docker-compose ps`
- Check database logs: `docker-compose logs postgres`
- Verify environment variables in `.env` match docker-compose.yml settings

**Backend won't start**:
- Check backend logs: `docker-compose logs backend`
- Ensure migrations have been run
- Verify all required environment variables are set in `.env`

**Reset everything**:
```bash
# Stop and remove containers, networks, and volumes
docker-compose down -v

# Remove any orphaned containers
docker-compose down --remove-orphans

# Start fresh
docker-compose up -d
```

### Data Persistence

Database data is stored in a Docker volume (`postgres_data`) and persists across container restarts. To start with a clean database:

```bash
docker-compose down -v  # Removes volumes
docker-compose up -d    # Creates fresh database
```

### Production Parity

This Docker Compose setup mirrors production in:
- PostgreSQL version (16-alpine)
- Database schema and migrations
- Environment variable structure
- Port mappings (3000 for API, 5432 for DB)
- Health checks

Development-specific differences:
- Hot reload enabled via volume mounts (code changes auto-restart backend)
- Simplified authentication (dev JWT secrets)
- Local database instead of managed service
- No SSL/TLS for database connections (local only)
- Prisma Studio port exposed for database inspection

## Database (Prisma)
- Schema: `src/infrastructure/database/prisma/schema.prisma`
- Generate client: `npm run prisma:generate`
- Create/apply dev migrations: `npm run prisma:migrate` (PostgreSQL must be running)
- Deploy migrations in shared environments: `npx prisma migrate deploy`
- Inspect data: `npm run prisma:studio`
- Supabase: prefer a direct connection string in `DIRECT_URL` for migrations; use the session pooler in `DATABASE_URL` if your network is IPv4-only.
- **DIRECT_URL**: Optional. Set when `DATABASE_URL` is a pooled connection so migrations use a direct connection; otherwise Prisma uses `DATABASE_URL`.

### Seeding the grocery catalog

To populate `master_grocery_catalog` from the generated JSON (e.g. from `sandbox/final_zero_risk_db.json`):

1. Start the local DB: `npm run db:start`
2. Apply migrations: `npm run prisma:migrate`
3. Ensure `.env` has `DATABASE_URL` pointing at the local DB (e.g. `postgresql://kitchen_hub:kitchen_hub_dev@localhost:5432/kitchen_hub`)
4. Run the seed: `npm run db:seed`

The script replaces all existing catalog rows with the JSON contents. To use a different file: `npm run db:seed -- --file=../path/to/catalog.json` or set `GROCERY_CATALOG_JSON` in `.env`.

### Idempotency Key Management
- **Table**: `sync_idempotency_keys` tracks processed sync operations
- **Retention**: Old completed keys are cleaned up automatically (default: 30 days)
- **Cleanup Service**: `AuthCleanupService` provides manual and scheduled cleanup
  - Manual cleanup: `cleanupOldIdempotencyKeys(retentionDays)`
  - Scheduled cleanup: Requires `@nestjs/schedule` package (optional)
  - Stats: `getIdempotencyKeyStats()` for monitoring

### Database Schema

The database schema is defined in `src/infrastructure/database/prisma/schema.prisma`. Below is a complete reference of all database tables and their schemas.

#### Household (`households`)

Represents a household/group of users sharing data.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (CUID) | Primary Key | Unique household identifier |
| `name` | String | Required | Household name |
| `createdAt` | DateTime | Auto-generated | Creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last update timestamp |
| `deletedAt` | DateTime? | Nullable | Soft-delete timestamp (null = active) |

**Relationships:**
- `users`: One-to-many with `User`
- `shoppingLists`: One-to-many with `ShoppingList`
- `recipes`: One-to-many with `Recipe`
- `chores`: One-to-many with `Chore`
- `customItems`: One-to-many with `CustomItem`

#### User (`users`)

Represents a user account.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary Key | Unique user identifier (matches Supabase Auth UUID) |
| `email` | String? | Unique, Nullable | User email address |
| `googleId` | String? | Unique, Nullable | Google OAuth ID |
| `passwordHash` | String? | Nullable | Bcrypt hashed password (for email/password authentication) |
| `emailVerified` | Boolean | Default: false | Whether email address has been verified |
| `emailVerificationToken` | String? | Nullable | Cryptographically secure token for email verification |
| `emailVerificationTokenExpiry` | DateTime? | Nullable | Expiration timestamp for verification token |
| `name` | String? | Nullable | User display name |
| `avatarUrl` | String? | Nullable | User avatar URL |
| `role` | String | Default: "Member" | User role (Admin, Member, Kid) |
| `householdId` | String? | Foreign Key, Nullable, Indexed | Reference to `Household.id` |
| `createdAt` | DateTime | Auto-generated | Creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last update timestamp |

**Relationships:**
- `household`: Many-to-one with `Household` (nullable)
- `refreshTokens`: One-to-many with `RefreshToken`
- `assignedChores`: One-to-many with `Chore` (as assignee)
- `importBatches`: One-to-many with `ImportBatch`
- `importMappings`: One-to-many with `ImportMapping`
- `syncIdempotencyKeys`: One-to-many with `SyncIdempotencyKey`

**Indexes:**
- `householdId` (for efficient household queries)

#### RefreshToken (`refresh_tokens`)

Stores refresh tokens for JWT authentication.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (CUID) | Primary Key | Unique token record identifier |
| `token` | String | Unique | Refresh token value |
| `userId` | UUID | Foreign Key | Reference to `User.id` |
| `expiresAt` | DateTime | Required | Token expiration timestamp |
| `createdAt` | DateTime | Auto-generated | Creation timestamp |

**Relationships:**
- `user`: Many-to-one with `User` (cascade delete)

#### ShoppingList (`shopping_lists`)

Represents a shopping list belonging to a household.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (CUID) | Primary Key | Unique list identifier |
| `householdId` | String (CUID) | Foreign Key, Required | Reference to `Household.id` |
| `name` | String | Required | List name |
| `color` | String? | Nullable | List color (for UI) |
| `icon` | String? | Nullable | Ionicons icon name (e.g., 'cart-outline') |
| `isMain` | Boolean | Default: false | Flag indicating if this is the main/default shopping list |
| `createdAt` | DateTime | Auto-generated | Creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last update timestamp |
| `deletedAt` | DateTime? | Nullable | Soft-delete timestamp (null = active) |

**Relationships:**
- `household`: Many-to-one with `Household` (cascade delete)
- `items`: One-to-many with `ShoppingItem`

**Indexes:**
- `[householdId, name]` (composite index for efficient household list queries)

#### ShoppingItem (`shopping_items`)

Represents an item in a shopping list.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (CUID) | Primary Key | Unique item identifier |
| `listId` | String (CUID) | Foreign Key, Required | Reference to `ShoppingList.id` |
| `catalogItemId` | String? | Foreign Key, Nullable | Reference to `MasterGroceryCatalog.id` |
| `customItemId` | String? | Foreign Key, Nullable | Reference to `CustomItem.id` |
| `name` | String | Required | Item name |
| `quantity` | Float | Default: 1 | Item quantity |
| `unit` | String? | Nullable | Unit of measurement |
| `isChecked` | Boolean | Default: false | Whether item is checked/completed |
| `category` | String? | Nullable | Item category |
| `createdAt` | DateTime | Auto-generated | Creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last update timestamp |
| `deletedAt` | DateTime? | Nullable | Soft-delete timestamp (null = active) |

**Relationships:**
- `list`: Many-to-one with `ShoppingList` (cascade delete)
- `catalogItem`: Many-to-one with `MasterGroceryCatalog` (set null on delete)
- `customItem`: Many-to-one with `CustomItem` (set null on delete)

**Indexes:**
- `listId` (for efficient list queries)
- `[listId, isChecked]` (composite index for filtering checked items)
- `catalogItemId` (for catalog item lookups)
- `customItemId` (for custom item lookups)

#### MasterGroceryCatalog (`master_grocery_catalog`)

Centralized grocery catalog with standardized items.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String | Primary Key | Unique catalog item identifier |
| `name` | String | Required | Item name |
| `category` | String | Required | Item category |
| `defaultUnit` | String? | Nullable | Default unit of measurement |
| `imageUrl` | String? | Nullable | Item image URL |
| `defaultQuantity` | Int? | Nullable | Default quantity |
| `createdAt` | DateTime | Auto-generated | Creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last update timestamp |

**Relationships:**
- `shoppingItems`: One-to-many with `ShoppingItem`

**Indexes:**
- `name` (for search functionality)
- `category` (for category filtering)

#### CustomItem (`custom_items`)

Household-defined custom items (not in master catalog). Shared across all household members.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (CUID) | Primary Key | Unique custom item identifier |
| `householdId` | String (CUID) | Foreign Key, Required | Reference to `Household.id` |
| `name` | String | Required | Item name |
| `category` | String? | Nullable | Item category |
| `createdAt` | DateTime | Auto-generated | Creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last update timestamp |

**Relationships:**
- `household`: Many-to-one with `Household` (cascade delete)
- `shoppingItems`: One-to-many with `ShoppingItem`

**Indexes:**
- `[householdId, name]` (composite index for household item lookups)
- `householdId` (for household item queries)

#### Recipe (`recipes`)

Represents a recipe belonging to a household.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (CUID) | Primary Key | Unique recipe identifier |
| `householdId` | String (CUID) | Foreign Key, Required | Reference to `Household.id` |
| `title` | String | Required | Recipe title |
| `prepTime` | Int? | Nullable | Preparation time in minutes |
| `ingredients` | JSON | Required | JSONB array of ingredients |
| `instructions` | JSON | Required | JSONB array of instruction steps |
| `imageUrl` | String? | Nullable | Recipe image URL |
| `createdAt` | DateTime | Auto-generated | Creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last update timestamp |
| `deletedAt` | DateTime? | Nullable | Soft-delete timestamp (null = active) |

**Relationships:**
- `household`: Many-to-one with `Household` (cascade delete)

**Indexes:**
- `[householdId, title]` (composite index for household recipe queries)

#### Chore (`chores`)

Represents a chore/task belonging to a household.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (CUID) | Primary Key | Unique chore identifier |
| `householdId` | String (CUID) | Foreign Key, Required | Reference to `Household.id` |
| `assigneeId` | UUID? | Foreign Key, Nullable | Reference to `User.id` (assignee) |
| `title` | String | Required | Chore title |
| `dueDate` | DateTime? | Nullable | Due date |
| `isCompleted` | Boolean | Default: false | Completion status |
| `completedAt` | DateTime? | Nullable | Completion timestamp |
| `repeat` | String? | Nullable | Repeat pattern (daily, weekly, monthly, etc.) |
| `createdAt` | DateTime | Auto-generated | Creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last update timestamp |
| `deletedAt` | DateTime? | Nullable | Soft-delete timestamp (null = active) |

**Relationships:**
- `household`: Many-to-one with `Household` (cascade delete)
- `assignee`: Many-to-one with `User` (set null on delete, nullable)

#### ImportBatch (`import_batches`)

Tracks data import operations.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (CUID) | Primary Key | Unique batch identifier |
| `userId` | UUID | Foreign Key, Required, Indexed | Reference to `User.id` |
| `status` | String | Default: "PENDING" | Batch status (PENDING, MAPPING, PROCESSING, COMPLETED, FAILED) |
| `filename` | String? | Nullable | Source filename |
| `source` | String | Required | Import source identifier |
| `startedAt` | DateTime | Auto-generated | Start timestamp |
| `completedAt` | DateTime? | Nullable | Completion timestamp |
| `error` | String? | Nullable | Error message if failed |
| `createdAt` | DateTime | Auto-generated | Creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last update timestamp |

**Relationships:**
- `user`: Many-to-one with `User` (cascade delete)
- `mappings`: One-to-many with `ImportMapping`

**Indexes:**
- `userId` (for user import queries)

#### ImportMapping (`import_mappings`)

Maps source entity IDs to target entity IDs for idempotent imports.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (CUID) | Primary Key | Unique mapping identifier |
| `batchId` | String (CUID) | Foreign Key, Required | Reference to `ImportBatch.id` |
| `userId` | UUID | Foreign Key, Required | Reference to `User.id` |
| `sourceField` | String | Required | Source entity ID |
| `sourceType` | String | Required | Source entity type (RECIPE, SHOPPING_LIST, etc.) |
| `targetField` | String | Required | Target entity ID |
| `createdAt` | DateTime | Auto-generated | Creation timestamp |
| `updatedAt` | DateTime | Auto-updated | Last update timestamp |

**Relationships:**
- `batch`: Many-to-one with `ImportBatch` (cascade delete)
- `user`: Many-to-one with `User` (cascade delete)

**Unique Constraints:**
- `[batchId, sourceField, sourceType]` (prevents duplicates within a batch)
- `[userId, sourceField, sourceType]` (ensures idempotency across batches)

#### SyncIdempotencyKey (`sync_idempotency_keys`)

Tracks processed sync operations to prevent duplicate processing.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | String (CUID) | Primary Key | Unique key record identifier |
| `userId` | UUID | Foreign Key, Required | Reference to `User.id` |
| `key` | String | Required | The operationId (idempotency key) |
| `entityType` | String | Required | Entity type (recipe, shoppingList, shoppingItem, chore) |
| `entityId` | String | Required | The entity ID that was processed |
| `requestId` | String? | Nullable | Optional request ID for observability |
| `status` | String | Default: "PENDING" | Processing status (PENDING, COMPLETED, FAILED) |
| `processedAt` | DateTime? | Nullable | Timestamp when status became COMPLETED |
| `createdAt` | DateTime | Auto-generated | Creation timestamp |

**Relationships:**
- `user`: Many-to-one with `User` (cascade delete)

**Unique Constraints:**
- `[userId, key]` (ensures idempotency: same user + same operationId = already processed)

**Indexes:**
- `[userId, entityType, entityId]` (for entity lookups)
- `processedAt` (for retention cleanup queries)

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
1. **Prerequisites**: Ensure you have applied migrations (`npm run prisma:migrate`) and your database has the `authenticated` role (e.g. Supabase; plain PostgreSQL does not create this role).
2. **Run Tests**:
   ```bash
   npm run test:rls
   ```
   Or run the full suite including RLS: `npm run test:all`. By default, `npm test` excludes RLS tests so it passes without a Supabase-style DB.
3. **Internal Logic**: These tests simulate the Supabase environment by:
   - Setting the PostgreSQL role to `authenticated`.
   - Injecting JWT claims (e.g., `SET LOCAL "request.jwt.claims" = '{"sub": "..."}'`) within a transaction.
4. **Storage RLS**: Tests require storage policies to be applied. If your DB user cannot access them, set `ALLOW_STORAGE_RLS_SKIP=true` to bypass storage checks.


## API Endpoints

### Base URL

- **API**: `http://localhost:3000/api/v1`
- **Version discovery**: `http://localhost:3000/api/version` (unversioned; use to discover supported API versions)
- **Endpoint inventory**: see [`../docs/api/backend-endpoints.md`](../docs/api/backend-endpoints.md)
- **Swagger Docs**: currently disabled in `src/main.ts` because Swagger setup requires resolving the `@fastify/static` dependency/configuration issue. Do not treat `/api/docs/v1` as available until that code path is re-enabled.

### Source-backed endpoint documentation

The current endpoint list is maintained in:

```text
../docs/api/backend-endpoints.md
```

That inventory is generated from controller decorators and should be the first place agents check before editing API docs. For detailed sync behavior, use:

```text
./docs/api-sync-and-conflict-strategy.md
./docs/SYNC_API_QUICK_REFERENCE.md
```

### Key public endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/verify-email`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/resend-verification`
- `POST /api/v1/auth/google`
- `GET /api/v1/auth/google/start`
- `GET /api/v1/auth/google/callback`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/invite/validate`
- `GET /api/v1/groceries/search`
- `GET /api/v1/groceries/categories`
- `GET /api/v1/groceries/by-category`
- `GET /api/v1/groceries/names`
- `GET /api/v1/health`
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `GET /api/v1/health/detailed`
- `GET /api/v1/client-links`
- `GET /api/v1/deploy-info`
- `GET /api/version`

### Key protected endpoint groups

- Auth/current user/sync: `GET /api/v1/auth/me`, `POST /api/v1/auth/sync`
- Users/privacy: `GET /api/v1/users/me/export`, `DELETE /api/v1/users/me`
- Household: `/api/v1/household`, `/api/v1/household/invite`, `/api/v1/household/join`, `/api/v1/household/members/:id`
- Shopping lists: `/api/v1/shopping-lists`, `/api/v1/shopping-lists/main`, `/api/v1/shopping-lists/aggregate`, `/api/v1/shopping-lists/:id`, `/api/v1/shopping-lists/:id/items`
- Shopping items: `/api/v1/shopping-items/custom`, `/api/v1/shopping-items/frequent`, `/api/v1/shopping-items/:id`
- Recipes: `/api/v1/recipes`, `/api/v1/recipes/:id`, `/api/v1/recipes/:id/cook`, `/api/v1/recipes/images/search`, `/api/v1/recipes/:id/image`
- Chores: `/api/v1/chores`, `/api/v1/chores/stats`, `/api/v1/chores/:id`, `/api/v1/chores/:id/status`, `/api/v1/chores/:id/restore`
- Dashboard/import: `GET /api/v1/dashboard/summary`, `POST /api/v1/import`

### Sync endpoint summary

`POST /api/v1/auth/sync` accepts offline shopping-list, recipe, and chore data. Each synced entity requires an `operationId` UUID v4 for idempotency. Current backend behavior uses simple Prisma upserts; it does not perform server-side timestamp conflict checks or payload-version branching.

Important source-backed docs:

- `docs/api-sync-and-conflict-strategy.md` — source of truth for sync contract and edge cases.
- `docs/SYNC_API_QUICK_REFERENCE.md` — quick reference for sync request/response terminology.
- `src/modules/auth/dtos/sync-data.dto.ts` — request DTOs.
- `src/modules/auth/types/sync-conflict.interface.ts` — response shape.
- `src/modules/auth/services/auth.service.ts` — implementation.

### Authentication requirements

- Public routes are marked with `@Public()` or class-level `@Public()` in controllers.
- Protected routes require Bearer JWT via global guards and/or explicit `JwtAuthGuard`.
- Household-scoped routes generally require household membership through `HouseholdGuard` or service-level household checks.

### CORS Configuration

CORS is enabled with credentials support for mobile app access.

## Project Structure

The backend follows NestJS module-based architecture with clear separation of concerns:

```
backend/
├── src/
│   ├── main.ts                      # Bootstrap with Swagger + global pipes/filters
│   ├── app.module.ts                # Root module with global guards/interceptors
│   │
│   ├── common/                      # Shared code across modules
│   │   ├── constants/               # Shared constants (token expiry, etc.)
│   │   ├── contracts/               # Zod validation schemas for cross-module contracts
│   │   ├── decorators/              # Custom decorators (@CurrentUser, @Public)
│   │   ├── dtos/                    # Shared DTOs (ApiResponse, Pagination)
│   │   ├── errors/                  # Custom error classes
│   │   ├── filters/                 # Exception filters (HttpExceptionFilter)
│   │   ├── guards/                 # Auth guards (JWT, Household)
│   │   ├── interceptors/            # Response transformation, logging, request context
│   │   ├── logger/                 # Structured logger service
│   │   ├── monitoring/             # Sentry and observability (SentryExceptionFilter)
│   │   ├── pipes/                  # Validation pipes
│   │   ├── versioning/             # API version guard, deprecation interceptor
│   │   ├── services/               # Shared services (UuidService)
│   │   ├── types/                   # Shared TypeScript interfaces
│   │   └── utils/                   # Shared utility functions
│   │
│   ├── config/                      # Configuration management
│   │   ├── configuration.ts         # Config loader
│   │   └── env.validation.ts        # Environment variable validation (Zod)
│   │
│   ├── infrastructure/                 # Infrastructure layer
│   │   ├── database/               # Database infrastructure
│   │   │   ├── prisma/             # Prisma module and service
│   │   │   │   ├── schema.prisma  # Database schema
│   │   │   │   ├── migrations/    # Database migrations
│   │   │   │   ├── prisma.module.ts
│   │   │   │   └── prisma.service.ts
│   │   │   └── filters/           # Soft-delete filter constants
│   │   ├── cache/                  # Caching infrastructure
│   │   ├── mail/                   # Email infrastructure
│   │   ├── messaging/               # Messaging infrastructure (MQTT)
│   │   ├── push/                   # Push notification infrastructure
│   │   ├── storage/                # Storage infrastructure
│   │   └── third-party/            # Third-party integrations
│   │
│   ├── modules/                     # Feature modules (mirror mobile features)
│   │   ├── auth/                   # Authentication module
│   │   │   ├── controllers/        # AuthController (Google OAuth, email/password, sync)
│   │   │   ├── services/           # AuthService, EmailService, AuthCleanupService (idempotency key cleanup)
│   │   │   ├── repositories/       # AuthRepository
│   │   │   ├── dtos/               # Auth DTOs (RegisterDto, LoginDto, VerifyEmailDto, etc.)
│   │   │   ├── constants/          # Sync entity type constants
│   │   │   └── auth.module.ts
│   │   ├── households/             # Household management (create, get, update, invite, remove member, invite validation; default name, idempotent join, race-safe create)
│   │   │   ├── controllers/        # HouseholdsController, InviteController (public validate)
│   │   │   ├── services/           # HouseholdsService (validateInviteCode, createHouseholdForNewUser, addUserToHousehold, parseInviteCode)
│   │   │   ├── repositories/       # HouseholdsRepository
│   │   │   ├── dtos/               # CreateHouseholdDto, UpdateHouseholdDto, InviteMemberDto, etc.
│   │   │   └── households.module.ts
│   │   ├── shopping/               # Shopping lists, items, grocery catalog, custom items
│   │   │   ├── controllers/        # GroceriesController (public), ShoppingListsController, ShoppingItemsController (shopping.controller.ts)
│   │   │   ├── services/           # ShoppingService (handles catalog items, custom items, bulk operations)
│   │   │   ├── repositories/       # ShoppingRepository (manages lists, items, custom items)
│   │   │   ├── dtos/               # Shopping DTOs (CreateListDto, AddItemsDto, UpdateItemDto, etc.)
│   │   │   └── shopping.module.ts
│   │   ├── recipes/                # Recipe management (canonical unit system for ingredients)
│   │   │   ├── controllers/        # RecipesController
│   │   │   ├── services/           # RecipesService
│   │   │   ├── repositories/      # RecipesRepository
│   │   │   ├── dtos/               # Recipe DTOs
│   │   │   ├── constants/         # Unit constants (mass, volume, count, etc.)
│   │   │   ├── utils/             # Unit converter and conversion helpers
│   │   │   ├── validators/        # Unit-type validation (e.g. quantityUnit)
│   │   │   └── recipes.module.ts
│   │   ├── chores/                 # Chore management
│   │   │   ├── controllers/        # ChoresController
│   │   │   ├── services/           # ChoresService
│   │   │   ├── repositories/       # ChoresRepository
│   │   │   ├── dtos/               # Chore DTOs
│   │   │   └── chores.module.ts
│   │   ├── dashboard/              # Dashboard summaries
│   │   │   ├── controllers/        # DashboardController
│   │   │   ├── services/           # DashboardService
│   │   │   ├── dtos/               # Dashboard DTOs
│   │   │   └── dashboard.module.ts
│   │   ├── import/                 # Data import
│   │   │   ├── controllers/        # ImportController
│   │   │   ├── services/           # ImportService
│   │   │   ├── repositories/       # ImportRepository
│   │   │   ├── dto/                # Import DTOs
│   │   │   └── import.module.ts
│   │   ├── health/                 # Health and version discovery
│   │   │   ├── controllers/        # HealthController (/api/v1/health*), VersionController (/api/version)
│   │   │   ├── services/           # HealthService
│   │   │   └── health.module.ts
│   │   ├── settings/              # Settings module (placeholder for future app preferences)
│   │   ├── users/                  # Users module (placeholder for future user profile management)
│   │   └── supabase/               # Supabase client service (global)
│   │       ├── services/           # SupabaseService
│   │       └── supabase.module.ts
│   │
│   ├── domain/                      # Domain models (if needed)
│   ├── jobs/                        # Background jobs
│   │   ├── notifications.processor.ts
│   │   └── sync.processor.ts
│   └── tests/                      # Test utilities
│
├── .eslintrc.js                    # ESLint configuration
├── .prettierrc                      # Prettier configuration
├── nest-cli.json                    # NestJS CLI configuration
├── package.json                     # Dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
└── README.md                        # This file
```

### Module Structure Pattern

Each feature module follows this structure:

```
modules/[feature]/
├── controllers/        # HTTP request handlers
├── services/           # Business logic
├── repositories/       # Data access layer
├── dtos/              # Data Transfer Objects
├── entities/          # Domain entities (if needed)
└── [feature].module.ts # NestJS module definition
```

## Architecture Patterns

### Global Guards and Interceptors

The API uses global guards and interceptors configured in `app.module.ts`:

- **JwtAuthGuard**: Global JWT authentication guard (all routes protected by default)
- **TransformInterceptor**: Transforms all responses to consistent `ApiResponse<T>` format
- **HttpExceptionFilter**: Global exception filter for consistent error responses
- **ValidationPipe**: Global validation pipe with whitelist and transform options

### Public Endpoints

Mark endpoints as public using the `@Public()` decorator:

```typescript
@Post('register')
@Public()  // Opts out of JWT guard
async register(@Body() dto: RegisterDto) {
  // ...
}

@Post('login')
@Public()  // Opts out of JWT guard
async login(@Body() dto: LoginDto) {
  // ...
}

@Post('google')
@Public()  // Opts out of JWT guard
async authenticateGoogle(@Body() dto: GoogleAuthDto) {
  // ...
}
```


### API Versioning

The API uses URI-based versioning (`/api/v1`, `/api/v2`, etc.) to support multiple API versions simultaneously.

**Version Discovery:**
- `GET /api/version` - Returns supported versions, current version, deprecated versions, and documentation links
- Public endpoint, no authentication required

**Version Strategy:**
- **URI Versioning**: All endpoints require explicit version in URL (`/api/v1/*`, `/api/v2/*`)
- **No Default Version**: Requests to `/api/*` without version return 404 (prevents URL ambiguity)
- **Controller-Level Versioning**: Controllers use `@Controller({ path: 'X', version: '1' })` metadata
- **Multiple Versions**: Same controller can handle multiple versions simultaneously

**Deprecation:**
- Deprecated versions automatically include deprecation headers in all responses
- Sunset versions return `410 Gone` with migration guide link
- Minimum 6-month deprecation period for mobile apps

**Documentation:**
- Current source-backed endpoint inventory is in `../docs/api/backend-endpoints.md`; Swagger docs are currently disabled in `src/main.ts`.
- See [API Versioning Guidelines](./docs/api-versioning-guidelines.md) for breaking change criteria
- See [API Deprecation Policy](./docs/api-deprecation-policy.md) for deprecation process

**Example:**
```typescript
// v1 endpoint
GET /api/v1/recipes

// v2 endpoint (when available)
GET /api/v2/recipes
```

### Response Format

All API responses follow a consistent format:

```typescript
{
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}
```

### Error Handling

Errors are transformed by `HttpExceptionFilter` into consistent error responses:

```typescript
{
  success: false;
  message: string;
  errors?: string[];
  statusCode: number;
}
```

## Testing

### Running Tests

```bash
# Unit tests (excludes RLS; use when DB has no 'authenticated' role)
npm test

# RLS integration tests only (requires DB with 'authenticated' role, e.g. Supabase)
npm run test:rls

# Full suite including RLS
npm run test:all

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

### Test Structure

- **Unit Tests**: Co-located with code (`.spec.ts` files)
- **Parameterized Tests**: Comprehensive test coverage with multiple scenarios
- **Test Files**: Controllers, services, and repositories all have test files

### RLS Testing

To verify Row Level Security is correctly isolating data (requires DB with `authenticated` role):

```bash
npm run test:rls
```

These tests simulate the Supabase environment by:
- Setting PostgreSQL role to `authenticated`
- Injecting JWT claims within transactions
- Verifying data isolation between households

## Development Guidelines

### Adding a New Module

1. Generate module structure:
   ```bash
   nest g module modules/[feature-name]
   nest g controller modules/[feature-name]
   nest g service modules/[feature-name]
   ```

2. Create repository in `modules/[feature-name]/repositories/`
3. Create DTOs in `modules/[feature-name]/dtos/`
4. Register module in `app.module.ts`
5. Add guards as needed (`JwtAuthGuard`, `HouseholdGuard`)

### Database Patterns

#### Soft Delete Pattern

Always use the shared filter constant:

```typescript
import { ACTIVE_RECORDS_FILTER } from '../../../infrastructure/database/filters/soft-delete.filter';

const recipes = await prisma.recipe.findMany({
  where: {
    householdId,
    ...ACTIVE_RECORDS_FILTER,  // Applies deletedAt: null
  }
});
```

#### Timestamp Management

- `createdAt`: Set automatically via `@default(now())`
- `updatedAt`: Maintained automatically by Prisma's `@updatedAt`
- Never manually set `updatedAt`

### Code Style

- Use TypeScript strict mode
- Follow NestJS conventions
- Use DTOs for all request/response data
- Use repositories for data access
- Keep services focused on business logic
- Use parameterized tests for comprehensive coverage

## Vercel Deployment

The backend can be deployed to Vercel as serverless functions. To avoid build errors and see runtime logs:

1. **Set Root Directory to `backend`**
   In the [Vercel project settings](https://vercel.com/docs/projects/overview#root-directory), set **Root Directory** to `backend`. If this is not set, Vercel may build the repo root or the mobile app (Expo), which will fail with errors like "No platforms are configured to use the Metro bundler" and you will not see backend logs.

2. **Deploy**
   From the repo root: `vercel` (with the project linked and root directory `backend`), or from `backend/`: `npx vercel`.

3. **Viewing logs**
   - **Build logs**: Vercel Dashboard → your project → **Deployments** → select a deployment → **Building** tab.
   - **Runtime logs**: Vercel Dashboard → your project → **Deployments** → select a deployment → **Functions** (or **Logs**). Runtime logs appear when a request hits the API; if no requests are made, the log stream will be empty. Trigger a request (e.g. `GET /api/v1/health`) and refresh the logs to see output.

4. **Environment variables**
   Add all required env vars (e.g. `DATABASE_URL`, `JWT_SECRET`, Supabase keys) in Project Settings → Environment Variables.

5. **Privacy policy (store listings)**
   Canonical HTML lives in **`static-legal/privacy.html`**. Deploy that folder as a **standalone Vercel static project** (see `static-legal/README.md`) for a simple `https://<project>.vercel.app/privacy` URL, or rely on the backend: files are copied into `public/` during `vercel-build`. Use **`https://<your-domain>/privacy`** (or `/privacy.html`) as the **Privacy Policy URL** in App Store Connect and Google Play. Keep it in sync with `legal/privacy-policy-v1.md` when operator or contact details change. The mobile app can use `EXPO_PUBLIC_PRIVACY_POLICY_URL` to point at your deployed URL.

## Docker / container notes

The backend still includes Docker-related files and docs, but the current source-backed production deployment path is Vercel. Older GHCR, GCP Cloud Run, and AWS ECS deployment docs have been archived under `../docs/archive/deployment-docs-2026-05-16/` because the referenced deployment workflows are not present in the current `.github/workflows/` directory.

Use Docker locally only when you intentionally need a containerized backend test.

### Build locally

For local development or custom builds:

```bash
cd backend
docker build -t kitchen-hub-api:latest .
```

**Image Features:**
- Multi-stage build (dependencies → builder → production)
- Optimized size (~150MB vs ~465MB unoptimized)
- Non-root user for security
- Proper signal handling with `dumb-init`
- Prisma Client pre-generated during build

### Running the Container

**Using GHCR image:**
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/db" \
  -e DIRECT_URL="postgresql://user:password@host:5432/db" \
  -e JWT_SECRET="your-jwt-secret-min-32-chars" \
  -e JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars" \
  -e SUPABASE_URL="https://your-project.supabase.co" \
  -e SUPABASE_ANON_KEY="your-anon-key" \
  ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-latest
```

**Using locally built image:**
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/db" \
  -e DIRECT_URL="postgresql://user:password@host:5432/db" \
  -e JWT_SECRET="your-jwt-secret-min-32-chars" \
  -e JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars" \
  -e SUPABASE_URL="https://your-project.supabase.co" \
  -e SUPABASE_ANON_KEY="your-anon-key" \
  kitchen-hub-api:latest
```

**Using environment file:**
```bash
# With GHCR image
docker run -p 3000:3000 --env-file .env.prod ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-latest

# With locally built image
docker run -p 3000:3000 --env-file .env.prod kitchen-hub-api:latest
```

### Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string (can use Supabase session pooler)
- `DIRECT_URL` - Optional direct PostgreSQL connection for migrations when `DATABASE_URL` is pooled (e.g. Supabase pooler, PgBouncer); when unset, Prisma uses `DATABASE_URL`
- `JWT_SECRET` - JWT secret (minimum 32 characters)
- `JWT_REFRESH_SECRET` - Refresh token secret (minimum 32 characters)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key

**Note:** `DIRECT_URL` is optional in all environments. Set it when `DATABASE_URL` is a pooled connection so migrations run against a direct connection.

**Optional:**
- `PORT` - Server port (default: `3000`)
- `NODE_ENV` - Environment (default: `production` in container)
- `JWT_EXPIRES_IN` - Access token expiry (default: `15m`)
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiry (default: `7d`)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)

### Database Migrations

Migrations should be run before starting the application. For production deployments:

**Option 1: Separate migration step**
```bash
# Run migrations (using GHCR image)
docker run --rm \
  -e DATABASE_URL="$DIRECT_URL" \
  ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-latest \
  npx prisma migrate deploy --schema=src/infrastructure/database/prisma/schema.prisma

# Then start the application
docker run -p 3000:3000 --env-file .env.prod ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-latest
```

**Option 2: Kubernetes init container**
```yaml
initContainers:
  - name: migrate
    image: ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-latest
    command: ["npx", "prisma", "migrate", "deploy", "--schema=src/infrastructure/database/prisma/schema.prisma"]
    env:
      - name: DATABASE_URL
        valueFrom:
          secretKeyRef:
            name: db-credentials
            key: direct-url
```

### Docker Best Practices

- **Non-root user**: Container runs as user `node` (UID 1001)
- **Signal handling**: Uses `dumb-init` for proper SIGTERM handling
- **Layer caching**: Optimized for fast rebuilds when source changes
- **Security**: Minimal base image (`node:20-slim`) with only required packages
- **Size**: Multi-stage build excludes dev dependencies and source code

### Health Check

The application exposes health check endpoints:
- `GET /api/version` - API version information (public)
- `GET /api/v1/health`, `GET /api/v1/health/live`, `GET /api/v1/health/ready` - health probes

Add to `docker-compose.yml`:
```yaml
healthcheck:
  test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/version', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Troubleshooting

**Container fails to start:**
- Check environment variables are set correctly
- Verify database is accessible from container
- Check logs: `docker logs <container-id>`

**Prisma Client errors:**
- Ensure Prisma Client was generated during build
- Verify schema path is correct in Dockerfile
- Rebuild image if schema changed

**Permission errors:**
- Container runs as non-root user `node`
- Ensure mounted volumes have correct permissions

## Integration with Mobile App

The backend API is designed to work seamlessly with the [Kitchen Hub Mobile App](../mobile/README.md):

- **Base URL**: Configured in mobile app's `src/config/index.ts`
- **Authentication**: JWT tokens stored in AsyncStorage
- **Sync**: Mobile app uses `/auth/sync` endpoint for offline data synchronization
- **Offline Support**: Mobile app caches data locally and syncs when online

## Monitoring

The API includes comprehensive monitoring capabilities:

- **Health Check Endpoints**: `/api/v1/health`, `/api/v1/health/ready`, `/api/v1/health/live`, `/api/v1/health/detailed`
- **Structured Logging**: JSON-formatted logs for log aggregation
- **Error Tracking**: Sentry integration (optional)
- **Request Correlation**: Automatic request ID generation and tracking

See [Monitoring Setup Guide](./docs/MONITORING_SETUP.md) for detailed setup instructions.

## Documentation

- **[Root README](../README.md)** - Monorepo overview
- **[Mobile App](../mobile/README.md)** - Mobile application documentation
- **[Deployment Guide](./DEPLOYMENT.md)** - Current Vercel backend deployment and rollback guide
- **[Vercel Monorepo Guide](../docs/deployment/vercel-monorepo.md)** - Vercel project/root-directory setup
- **[Sync API Quick Reference](./docs/SYNC_API_QUICK_REFERENCE.md)** - Quick reference for sync API terminology, contract, and common issues
- **[Monitoring Setup Guide](./docs/MONITORING_SETUP.md)** - Monitoring and observability setup
- **[Logging Guide](./docs/LOGGING_GUIDE.md)** - Structured logging best practices
- **[Environment Variable Checklist](./docs/ENV_VAR_CHECKLIST.md)** - Source-backed backend environment variable checklist
- **[Archived legacy deployment docs](../docs/archive/deployment-docs-2026-05-16/)** - Historical GCP/AWS/GHCR docs, not current instructions
- **[Backend Docs Index](./docs/README_DOCS.md)** - Documentation index and recommended reading order
- **[Documentation Map](../docs/project/DOCUMENTATION_MAP.md)** - Canonical guide to current docs and source-backed references
- **[AGENTS.md](../AGENTS.md)** - Canonical repository guidance for agents

## Notes

- Database uses UUID for all user-related identifiers to maintain consistency with Supabase Auth identities
- Global prefix (`api/v1`), validation pipe, error filter, and response transformer are configured in `src/main.ts`
- Swagger setup is currently disabled in `src/main.ts`; use `../docs/api/backend-endpoints.md` for current endpoint inventory until Swagger is re-enabled.
- CORS is enabled with credentials support for mobile app access