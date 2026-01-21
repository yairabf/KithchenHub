# NestJS Project Structure for Kitchen Hub (Expo + Prisma)

This document describes the **adjusted backend architecture** for **Kitchen Hub**, aligned with the existing **Expo (React Native)** frontend, feature set, and long-term goals (local‑first, sync, Home Assistant integration).

---

## High-Level Decisions (Based on Your Plans)

* **Frontend**: Expo (React Native)
* **Backend**: NestJS (Fastify adapter)
* **ORM**: **Prisma** (recommended over TypeORM)
* **Database**: PostgreSQL (server) + future SQLite (offline/mobile)
* **Architecture**: Feature-based, mirroring frontend features
* **Repo Strategy**: Monorepo-friendly, but backend remains isolated

---

## Final Monorepo Layout (Recommended)

```text
repo/
  apps/
    mobile/                 # Expo app (existing)
    api/                    # NestJS backend
  packages/
    contracts/              # Shared Zod schemas & types
```

`packages/contracts` is the **only shared dependency** between mobile and backend.

---

## Backend Folder Structure (apps/api)

```text
apps/api/src/
  main.ts
  app.module.ts

  config/
    configuration.ts
    env.validation.ts       # Zod-based env validation

  common/
    constants/
    decorators/
    errors/
    filters/
    guards/
    interceptors/
    logger/
    utils/

  infrastructure/
    database/
      prisma/
        prisma.module.ts
        prisma.service.ts
        schema.prisma
    messaging/
      mqtt/                 # Home Assistant integration
    push/                   # FCM / APNs (future)
    storage/

  modules/                  # Mirrors frontend features
    auth/
    users/
    households/
    shopping/
    recipes/
    chores/
    settings/
    dashboard/

  jobs/
    sync.processor.ts
    notifications.processor.ts

  health/
  docs/
```

---

## Feature Parity with Frontend

Each backend module corresponds directly to an Expo feature:

| Frontend Feature | Backend Module |
| ---------------- | -------------- |
| auth             | auth           |
| shopping         | shopping       |
| recipes          | recipes        |
| chores           | chores         |
| dashboard        | dashboard      |
| settings         | settings       |

This **mirrored structure** reduces cognitive load and speeds development.

---

## Example: Shopping Module (Backend)

```text
modules/shopping/
  controllers/
    shopping-lists.controller.ts
  services/
    shopping.service.ts
  repositories/
    shopping.repository.ts
  dtos/
    create-list.dto.ts
    add-item.dto.ts
  shopping.module.ts
```

**Rules**:

* Controllers = HTTP only
* Services = business logic
* Repositories = Prisma queries only

---

## Prisma over TypeORM (Why This Fits Kitchen Hub)

Prisma is the better choice here because:

* Matches your **MasterItem / ShoppingItem / RecipeIngredient** design
* Strong typing across backend and contracts
* Excellent migration safety
* Easier future SQLite support for offline sync

TypeORM would add complexity without clear upside for this project.

---

## Shared Contracts (`packages/contracts`)

```text
packages/contracts/
  auth.schema.ts
  shopping.schema.ts
  recipes.schema.ts
  chores.schema.ts
  index.ts
```

* Zod schemas are the **source of truth**
* Backend: validate requests
* Mobile: infer TypeScript types

```ts
export const AddShoppingItemSchema = z.object({
  masterItemId: z.string().optional(),
  name: z.string(),
  quantity: z.number(),
});

export type AddShoppingItem = z.infer<typeof AddShoppingItemSchema>;
```

---

## API Versioning (Mobile-Safe)

All endpoints are versioned:

```text
/api/v1/auth/login
/api/v1/shopping/lists
/api/v1/recipes
```

This protects older mobile builds.

---

## Sync & Local‑First Readiness

Your architecture supports:

* Offline Expo usage (AsyncStorage / SQLite)
* Server reconciliation via sync jobs
* Household-based data ownership

Planned sync logic lives in:

```text
jobs/sync.processor.ts
```

---

## Home Assistant & MQTT

Infrastructure-level integration:

```text
infrastructure/messaging/mqtt/
```

Used for:

* Chore completion events
* Smart kitchen automations

---

## Summary

This adjusted structure:

* Matches your **existing Expo feature architecture**
* Uses **Prisma** for safety and speed
* Supports **local‑first + sync** goals
* Scales to Home Assistant & IoT use cases

This is a strong, long-term foundation for Kitchen Hub.
