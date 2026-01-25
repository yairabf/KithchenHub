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
- **Swagger Documentation**: Interactive API docs at `/api/docs`
- **Global API Prefix**: All routes under `/api/v1`
- **CORS Enabled**: Configured for mobile app access

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
- Performs upsert operations with conflict detection
- Returns sync result with status (`synced`, `partial`, or `failed`)
- Includes conflicts array for failed items
- Client-side conflict resolution uses Last-Write-Wins (LWW) with tombstone semantics

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
│   │   │   ├── services/           # AuthService
│   │   │   ├── repositories/       # AuthRepository
│   │   │   ├── dtos/               # Auth DTOs
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

## Integration with Mobile App

The backend API is designed to work seamlessly with the [Kitchen Hub Mobile App](../mobile/README.md):

- **Base URL**: Configured in mobile app's `src/config/index.ts`
- **Authentication**: JWT tokens stored in AsyncStorage
- **Sync**: Mobile app uses `/auth/sync` endpoint for offline data synchronization
- **Offline Support**: Mobile app caches data locally and syncs when online

## Documentation

- **[Root README](../README.md)** - Monorepo overview
- **[Mobile App](../mobile/README.md)** - Mobile application documentation
- **[Detailed Docs](../README-DETAILED.md)** - Comprehensive project documentation
- **[CLAUDE.md](../CLAUDE.md)** - AI assistant development guidance

## Notes

- Database uses UUID for all user-related identifiers to maintain consistency with Supabase Auth identities
- Global prefix (`api/v1`), validation pipe, error filter, and response transformer are configured in `src/main.ts`
- Swagger documentation is available at `/api/docs` when running the server
- CORS is enabled with credentials support for mobile app access