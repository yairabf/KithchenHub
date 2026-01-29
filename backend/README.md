# Kitchen Hub Backend API 🚀

NestJS (Fastify) REST API service for Kitchen Hub, providing authentication, household management, shopping lists, recipes, chores, and dashboard data for the [mobile application](../mobile/README.md).

![NestJS](https://img.shields.io/badge/NestJS-10.0.0-E0234E) ![TypeScript](https://img.shields.io/badge/TypeScript-5.1.3-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-supported-336791) ![Prisma](https://img.shields.io/badge/Prisma-5.0.0-2D3748)

## Overview

Kitchen Hub Backend is a RESTful API built with NestJS and Fastify, providing a robust backend service for the Kitchen Hub mobile application. It handles authentication, data persistence, synchronization, and business logic for household management features.

## Features

### Authentication & Authorization
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Google OAuth**: Integration with Supabase for Google sign-in
- **Guest Mode**: Support for guest users with device-based identification
- **Token Refresh**: Secure token refresh mechanism
- **Offline Sync**: Data synchronization endpoint for offline-first mobile app
- **UUID-based Users**: Seamless cross-provider integration with UUID identifiers

### Data Management
- **Soft Deletes**: User-owned entities support soft-delete via `deleted_at` timestamp
  - Centralized `ACTIVE_RECORDS_FILTER` constant for consistent querying
  - Helper function `buildActiveRecordsFilter()` for combining filters
  - Repository-level restore methods for data recovery
  - Audit logging for all soft-delete and restore operations
  - No automatic cascade (allows selective restoration)
- **Automatic Timestamps**: All entities include `created_at` and `updated_at` timestamps
  - `updated_at` automatically maintained by Prisma
- **Master Grocery Catalog**: Centralized grocery database with categories and search
- **Data Import**: Import from guest mode to household accounts with fingerprinting and idempotency
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
- Member invitation and management
- Household-level data isolation
- Row Level Security (RLS) via Supabase

### Core Modules
- **Shopping Lists**: Multi-list management with items and grocery catalog integration
- **Recipes**: Recipe CRUD with ingredients and instructions
- **Chores**: Task management with assignees and completion tracking
- **Dashboard**: Aggregated household activity summaries
- **Import**: Guest mode data import with deduplication

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
- **Automated Staging Deployment**: GitHub Actions workflow for staging environment
  - **Staging deployment** (`deploy-staging.yml`): Automatically deploys to GCP Cloud Run when code is merged to `develop` branch
  - Runs database migrations before deployment
  - Deploys to Cloud Run via `gcloud run deploy`
  - Supports optional health checks
  - See [Deployment Guide](./DEPLOYMENT.md#automated-staging-deployment) for setup instructions
- **Automated Production Deployment**: GitHub Actions workflow for production environment with manual approval
  - **Production deployment** (`deploy-production.yml`): Automatically deploys to GCP Cloud Run when code is merged to `main` branch
  - **Manual approval required** via GitHub Environment protection rules
  - Supports manual dispatch for custom image tags and rollbacks
  - Runs database migrations after approval
  - Deploys to Cloud Run via `gcloud run deploy`
  - Supports optional health checks
  - See [Deployment Guide](./DEPLOYMENT.md#automated-production-deployment) for setup instructions
- **Comprehensive Deployment Documentation**: Complete guides for deployment, rollback, and platform migration
  - **[Comprehensive Deployment Guide](./docs/DEPLOYMENT_COMPREHENSIVE.md)**: Complete deployment procedures for GCP Cloud Run and AWS ECS/Fargate
  - **[Rollback Guide](./docs/ROLLBACK_GUIDE.md)**: Detailed rollback procedures for all platforms
  - **[Environment Variable Checklist](./docs/ENV_VAR_CHECKLIST.md)**: Complete checklist for all environments and platforms
  - **[Platform Migration Guide](./docs/PLATFORM_MIGRATION.md)**: Step-by-step migration between GCP Cloud Run and AWS ECS/Fargate
- **Swagger Documentation**: Interactive API docs at `/api/docs/v1`
- **API Versioning**: URI-based versioning (`/api/v1`, `/api/v2`, etc.)
- **Version Discovery**: `GET /api/version` endpoint for version information
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

## Local Development with Docker Compose

Docker Compose provides an easy way to run the backend API and PostgreSQL database locally with minimal setup. This setup mirrors production as closely as reasonable while providing development-friendly features like hot reload.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running
- Docker Compose (included with Docker Desktop)

### Quick Start

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

The API will be available at `http://localhost:3000` with Swagger docs at `http://localhost:3000/api/docs/v1`.

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
| Stop services | `docker-compose down` |
| Stop and remove volumes | `docker-compose down -v` |
| Reset everything | `docker-compose down -v && docker-compose up -d` |

### Accessing Services

- **Backend API**: `http://localhost:3000`
- **API Documentation**: `http://localhost:3000/api/docs/v1`
- **Version Discovery**: `http://localhost:3000/api/version`
- **Prisma Studio**: `http://localhost:5555` (when running)
- **PostgreSQL**: `localhost:5432`
  - User: `kitchen_hub`
  - Password: `kitchen_hub_dev`
  - Database: `kitchen_hub`

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

### Idempotency Key Management
- **Table**: `sync_idempotency_keys` tracks processed sync operations
- **Retention**: Old completed keys are cleaned up automatically (default: 30 days)
- **Cleanup Service**: `AuthCleanupService` provides manual and scheduled cleanup
  - Manual cleanup: `cleanupOldIdempotencyKeys(retentionDays)`
  - Scheduled cleanup: Requires `@nestjs/schedule` package (optional)
  - Stats: `getIdempotencyKeyStats()` for monitoring

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


## API Endpoints

### Base URL
- **API**: `http://localhost:3000/api/v1`
- **Swagger Docs**: `http://localhost:3000/api/docs`

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/google` | Public | Authenticate with Google OAuth ID token |
| `POST` | `/auth/guest` | Public | Authenticate as guest user (device ID) |
| `POST` | `/auth/refresh` | Public | Refresh access token using refresh token |
| `POST` | `/auth/sync` | Protected | Synchronize offline data to cloud |

**Sync Endpoint Details:**
- Accepts offline data (shopping lists, recipes, chores)
- Maximum of 1000 items per sync request (combined total of lists, recipes, and chores)
- **Payload Versioning**: Optional `payloadVersion` field (positive integer, minimum 1) for API contract versioning
  - Current version: `1` (default if omitted)
  - Enables future payload evolution without breaking existing clients
  - Backend treats missing or `payloadVersion = 1` identically
- **Idempotency Keys**: Each entity must include a unique `operationId` (UUID v4) to prevent duplicate processing
  - Safe retries: Same `operationId` will be processed only once
  - Atomic processing: Insert-first pattern ensures exactly-once semantics
  - Optional `requestId` for batch observability (same for all items in a sync request)
- Performs simple `upsert` operations (no timestamp-based conflict resolution on server)
- Returns sync result with status (`synced`, `partial`, or `failed`)
- **Granular Results**: Returns per-entity success/failure status
  - `succeeded` array (optional): Lists successful entities with `operationId`, `entityType`, `id`, and optional `clientLocalId`
  - `conflicts` array: Lists failed entities with `operationId`, `type`, `id`, and `reason`
  - Each `operationId` appears exactly once in either `succeeded` or `conflicts` (invariant enforced)
  - Enables partial batch recovery: mobile clients can retry only failed items

**Sync Response Format:**
```typescript
{
  status: 'synced' | 'partial' | 'failed';
  conflicts: Array<{
    type: 'list' | 'recipe' | 'chore' | 'shoppingItem';
    id: string;
    operationId: string;
    reason: string;
  }>;
  succeeded?: Array<{
    operationId: string;
    entityType: 'list' | 'recipe' | 'chore';
    id: string; // Server-assigned ID
    clientLocalId?: string; // Original localId (for create operations)
  }>;
}
```

**Response Status Values:**
- `synced`: All entities processed successfully (no conflicts)
- `partial`: Some entities succeeded, some failed (both `succeeded` and `conflicts` arrays populated)
- `failed`: All entities failed (only `conflicts` array populated, `succeeded` may be undefined)

**Conflict Resolution Strategy:**
- **Server Behavior**: Simple upsert operations - no timestamp-based conflict resolution
- **Client-Side Resolution**: All conflict resolution handled client-side using Last-Write-Wins (LWW) strategy
- **Server Timestamp Authority**: Server timestamps are authoritative (Prisma auto-manages `updatedAt` via `@updatedAt` directive)
- **Soft-Delete Handling**: `deletedAt` is handled via soft-delete in repositories
- **Why Client-Side**: Prevents conflict resolution loops between client and server, allows offline-first architecture with local conflict resolution

**Timestamp Management:**
- Server timestamps are set correctly by Prisma (`@updatedAt` directive)
- Soft-delete operations set `deletedAt` correctly
- Sync endpoint returns entities with proper timestamps
- No timestamp manipulation in sync endpoint (let Prisma handle it)

### Household Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/household` | Protected | Get current user's household with members |
| `PUT` | `/household` | Protected | Update household details (admin only) |
| `POST` | `/household/invite` | Protected | Invite member to household (admin only) |
| `DELETE` | `/household/members/:id` | Protected | Remove member from household (admin only) |

### Shopping Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/shopping-lists` | Protected | Get all shopping lists for household |
| `POST` | `/shopping-lists` | Protected | Create new shopping list |
| `GET` | `/shopping-lists/:id` | Protected | Get shopping list with items |
| `DELETE` | `/shopping-lists/:id` | Protected | Soft-delete shopping list |
| `POST` | `/shopping-lists/:id/items` | Protected | Bulk add items to list |
| `PATCH` | `/shopping-items/:id` | Protected | Update shopping item |
| `DELETE` | `/shopping-items/:id` | Protected | Soft-delete shopping item |

### Grocery Catalog Endpoints (Public)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/groceries/search?q=query` | Public | Search grocery catalog |
| `GET` | `/groceries/categories` | Public | Get all grocery categories |

### Recipe Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/recipes?category=&search=` | Protected | Get recipes (with optional filters) |
| `POST` | `/recipes` | Protected | Create new recipe |
| `GET` | `/recipes/:id` | Protected | Get recipe details |
| `PUT` | `/recipes/:id` | Protected | Update recipe |
| `POST` | `/recipes/:id/cook` | Protected | Add recipe ingredients to shopping list |

**Query Parameters:**
- `category`: Filter by category (Breakfast, Lunch, Dinner, Dessert, Snack)
- `search`: Search recipes by name

### Chore Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/chores?start=&end=` | Protected | Get chores (with optional date range) |
| `POST` | `/chores` | Protected | Create new chore |
| `PATCH` | `/chores/:id` | Protected | Update chore details |
| `PATCH` | `/chores/:id/status` | Protected | Toggle chore completion status |
| `GET` | `/chores/stats?date=` | Protected | Get chore statistics for date |

**Query Parameters:**
- `start`: Start date (ISO format)
- `end`: End date (ISO format)
- `date`: Date for statistics (ISO format)

### Dashboard Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/dashboard/summary` | Protected | Get household activity summary |

### Import Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/import` | Protected | Import recipes and shopping lists from guest mode |

### Authentication Requirements

- **Public Routes**: `/auth/google`, `/auth/guest`, `/auth/refresh`, `/groceries/*`
- **Protected Routes**: All other endpoints require Bearer JWT token
- **Household Routes**: Most protected routes also require household membership (enforced by `HouseholdGuard`)

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
│   │   ├── interceptors/            # Response transformation (TransformInterceptor)
│   │   ├── logger/                 # Logger service
│   │   ├── pipes/                  # Validation pipes
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
│   │   │   ├── controllers/        # AuthController
│   │   │   ├── services/           # AuthService, AuthCleanupService (idempotency key cleanup)
│   │   │   ├── repositories/       # AuthRepository
│   │   │   ├── dtos/               # Auth DTOs
│   │   │   ├── constants/          # Sync entity type constants
│   │   │   └── auth.module.ts
│   │   ├── households/             # Household management
│   │   │   ├── controllers/        # HouseholdsController
│   │   │   ├── services/           # HouseholdsService
│   │   │   ├── repositories/       # HouseholdsRepository
│   │   │   ├── dtos/               # Household DTOs
│   │   │   └── households.module.ts
│   │   ├── shopping/               # Shopping lists and items
│   │   │   ├── controllers/        # ShoppingController, GroceriesController
│   │   │   ├── services/           # ShoppingService
│   │   │   ├── repositories/       # ShoppingRepository
│   │   │   ├── dtos/               # Shopping DTOs
│   │   │   └── shopping.module.ts
│   │   ├── recipes/                # Recipe management
│   │   │   ├── controllers/        # RecipesController
│   │   │   ├── services/           # RecipesService
│   │   │   ├── repositories/       # RecipesRepository
│   │   │   ├── dtos/               # Recipe DTOs
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
│   │   ├── import/                 # Data import from guest mode
│   │   │   ├── controllers/        # ImportController
│   │   │   ├── services/           # ImportService
│   │   │   ├── repositories/       # ImportRepository
│   │   │   ├── dto/                # Import DTOs
│   │   │   └── import.module.ts
│   │   └── supabase/               # Supabase client service (global)
│   │       ├── services/           # SupabaseService
│   │       └── supabase.module.ts
│   │
│   ├── domain/                      # Domain models (if needed)
│   ├── health/                     # Health check endpoints
│   ├── jobs/                       # Background jobs
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
@Post('google')
@Public()  // Opts out of JWT guard
async authenticateGoogle(@Body() dto: GoogleAuthDto) {
  // ...
}
```

### Guest Mode Protection

Guest users can only access public endpoints:
- `/auth/guest` - Guest authentication
- `/auth/google` - Google authentication
- `/auth/refresh` - Token refresh
- `/groceries/*` - Grocery catalog search

All other endpoints require valid JWT tokens with household membership, preventing guest data from syncing to the backend.

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
- Swagger docs available at `/api/docs/v1` (separate docs per version)
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
# Unit tests
npm test

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

To verify Row Level Security is correctly isolating data:

```bash
npm run test src/infrastructure/database/rls.spec.ts
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

## Docker Deployment

The backend includes a production-ready multi-stage Dockerfile optimized for NestJS + Prisma. Docker images are automatically built and pushed to GitHub Container Registry (GHCR) via GitHub Actions workflows:

- **Production builds** (`.github/workflows/build.yml`): Triggers on pushes to `develop` and `main` branches with 30-minute timeout and build caching
- **Development builds** (`.github/workflows/build-push.yml`): Triggers on pushes to all branches for testing and development
- **Staging deployment** (`.github/workflows/deploy-staging.yml`): Automatically deploys to GCP Cloud Run staging when code is merged to `develop` branch
  - Runs database migrations before deployment
  - Deploys to Cloud Run via `gcloud run deploy`
  - Requires `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_CLOUD_RUN_SERVICE_STAGING`, `GCP_SA_KEY` (and optionally `STAGING_SERVICE_URL` for health checks)
  - See [Deployment Guide](./DEPLOYMENT.md#automated-staging-deployment) for detailed setup
- **Production deployment** (`.github/workflows/deploy-production.yml`): Automatically deploys to GCP Cloud Run production when code is merged to `main` branch
  - **Manual approval required** via GitHub Environment protection rules
  - Supports manual dispatch for custom image tags and rollbacks
  - Runs database migrations after approval
  - Deploys to Cloud Run via `gcloud run deploy`
  - Requires `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_CLOUD_RUN_SERVICE`, `GCP_SA_KEY` and GitHub Environment "production" (and optionally `PRODUCTION_SERVICE_URL` for health checks)
  - See [Deployment Guide](./DEPLOYMENT.md#automated-production-deployment) for detailed setup

### Getting Docker Images

#### Option A: Pull from GitHub Container Registry (GHCR) - Recommended

Images are automatically built and pushed to GHCR with tags following the pattern:
- `ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:BRANCH-SHA` (e.g., `main-abc123def`)
- `ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:BRANCH-latest` (e.g., `main-latest`)
- `ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:SHA` (e.g., `abc123def`)

**Authenticate and pull:**
```bash
# Login to GHCR (requires GitHub Personal Access Token with read:packages scope)
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Pull latest main branch image
docker pull ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-latest
```

For detailed GHCR instructions, see [GHCR Quick Reference](./docs/GHCR_QUICK_REFERENCE.md) and [Deployment Guide](./DEPLOYMENT.md).

#### Option B: Build Locally

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
- `GET /api/docs/v1` - Swagger documentation (public)

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

- **Health Check Endpoints**: `/api/health`, `/api/health/ready`, `/api/health/live`, `/api/health/detailed`
- **Structured Logging**: JSON-formatted logs for log aggregation
- **Error Tracking**: Sentry integration (optional)
- **Request Correlation**: Automatic request ID generation and tracking

See [Monitoring Setup Guide](./docs/MONITORING_SETUP.md) for detailed setup instructions.

## Documentation

- **[Root README](../README.md)** - Monorepo overview
- **[Mobile App](../mobile/README.md)** - Mobile application documentation
- **[Deployment Guide](./DEPLOYMENT.md)** - Quick start deployment guide
- **[Comprehensive Deployment Guide](./docs/DEPLOYMENT_COMPREHENSIVE.md)** - Complete deployment procedures for all platforms
- **[Rollback Guide](./docs/ROLLBACK_GUIDE.md)** - Detailed rollback procedures
- **[Monitoring Setup Guide](./docs/MONITORING_SETUP.md)** - Monitoring and observability setup
- **[Logging Guide](./docs/LOGGING_GUIDE.md)** - Structured logging best practices
- **[Environment Variable Checklist](./docs/ENV_VAR_CHECKLIST.md)** - Complete environment variable checklist
- **[Platform Migration Guide](./docs/PLATFORM_MIGRATION.md)** - Migration between platforms
- **[GHCR Quick Reference](./docs/GHCR_QUICK_REFERENCE.md)** - Quick reference for GitHub Container Registry
- **[Detailed Docs](../README-DETAILED.md)** - Comprehensive project documentation
- **[CLAUDE.md](../CLAUDE.md)** - AI assistant development guidance

## Notes

- Database uses UUID for all user-related identifiers to maintain consistency with Supabase Auth identities
- Global prefix (`api/v1`), validation pipe, error filter, and response transformer are configured in `src/main.ts`
- Swagger documentation is available at `/api/docs` when running the server
- CORS is enabled with credentials support for mobile app access