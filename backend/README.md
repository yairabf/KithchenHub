# Kitchen Hub Backend

API service for Kitchen Hub, built with NestJS (Fastify) and Prisma on PostgreSQL. Provides authentication, household management, shopping, recipes, chores, and dashboard data for the mobile/web clients.

## Features
- JWT auth with Google sign-in, guest login, token refresh, and offline sync
- Household membership plus shopping lists/items, recipes, and chores
- Dashboard summaries for household activity
- Global prefix `api/v1`; Swagger UI at `/api/docs`
- Bearer auth required for most endpoints (auth routes are public)

## Requirements
- Node.js 18+ and npm
- PostgreSQL database reachable via `DATABASE_URL`
- `.env` file with the variables validated in `src/config/env.validation.ts`

Example `.env`:
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/kitchen_hub
JWT_SECRET=change-me-to-32+chars
JWT_REFRESH_SECRET=change-me-to-32+chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
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
- Inspect data: `npm run prisma:studio`

## API Conventions
- Base URL: `http://localhost:3000/api/v1`
- Docs: `http://localhost:3000/api/docs`
- Public routes: `POST /auth/google`, `POST /auth/guest`, `POST /auth/refresh` (others use bearer JWT)
- CORS enabled with credentials for client apps

## Project Structure
```
src/
  main.ts                      # Bootstrap with Swagger + global pipes/filters
  app.module.ts                # Module wiring and global JWT guard
  common/                      # Filters, guards, interceptors, decorators
  config/                      # Env validation + configuration loader
  infrastructure/database/     # Prisma module/service and schema
  modules/
    auth/                      # Google + guest auth, token refresh, sync
    households/                # Household CRUD/membership
    shopping/                  # Lists and items
    recipes/                   # Household recipes
    chores/                    # Task assignments and completion
    dashboard/                 # Aggregated dashboard data
```

## Notes
- The API runs behind a global JWT guard; mark endpoints with the `@Public()` decorator to opt out.
- Global prefix, validation pipe, error filter, and response transformer are configured in `src/main.ts`.
