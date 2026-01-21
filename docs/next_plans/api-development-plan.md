# Kitchen Hub – API & Backend Architecture Plan

This document defines the **API design, backend architecture, and data model** for Kitchen Hub. It is optimized for an **Expo (React Native)** frontend, supports **offline-first usage**, and enables **real-time household collaboration**.

---

## 1. Architecture Overview

### Core Principle: Multi-Tenancy via Households

All primary resources are scoped to a `household_id`:

* Shopping Lists
* Recipes
* Chores

A household represents a shared space (e.g., Mom, Dad, Kids) where data is synced in real time.

---

### Base Configuration

* **Base URL**: `/api/v1`
* **Authentication**: JWT exchanged via Google OAuth
* **Sync Strategy**: Offline-first with merge-on-login

The app works fully offline (Guest Mode) and synchronizes data when the user signs in.

---

## 2. Authentication & Sync

Handles login, guest usage, token refresh, and the **critical data merge** when transitioning from guest → authenticated user.

### Endpoints

| Method | Endpoint        | Description                          | Payload                      | Response                             |
| ------ | --------------- | ------------------------------------ | ---------------------------- | ------------------------------------ |
| POST   | `/auth/google`  | Exchange Google ID token for session | `{ idToken }`                | `{ accessToken, user, householdId }` |
| POST   | `/auth/guest`   | Register a guest session             | `{ deviceId }`               | `{ accessToken, user (guest) }`      |
| POST   | `/auth/sync`    | Merge local data to cloud            | `{ lists, recipes, chores }` | `{ status, conflicts }`              |
| POST   | `/auth/refresh` | Refresh access token                 | `{ refreshToken }`           | `{ accessToken }`                    |

---

## 3. Household Management

Households are the **container** for all shared data. Users belong to exactly one household.

### Endpoints

| Method | Endpoint                 | Description               | Payload              | Response                |
| ------ | ------------------------ | ------------------------- | -------------------- | ----------------------- |
| GET    | `/household`             | Get household & members   | –                    | `{ id, name, members }` |
| PUT    | `/household`             | Update household settings | `{ name, timezone }` | `{ updatedHousehold }`  |
| POST   | `/household/invite`      | Invite a new member       | `{ email }`          | `{ inviteToken }`       |
| DELETE | `/household/members/:id` | Remove a member           | –                    | `{ success: true }`     |

---

## 4. Shopping Lists Feature

Supports multiple lists per household and a **global grocery database** (111 items).

### Global Grocery Resources

| Method | Endpoint                | Description            | Query     | Response                                |
| ------ | ----------------------- | ---------------------- | --------- | --------------------------------------- |
| GET    | `/groceries/search`     | Autocomplete search    | `?q=milk` | `[{ id, name, category, defaultUnit }]` |
| GET    | `/groceries/categories` | Get grocery categories | –         | `["Produce", "Dairy", ...]`             |

---

### Shopping List Operations

| Method | Endpoint              | Description             | Payload           | Response                           |
| ------ | --------------------- | ----------------------- | ----------------- | ---------------------------------- |
| GET    | `/shopping-lists`     | Get all lists (summary) | –                 | `[{ id, name, color, itemCount }]` |
| POST   | `/shopping-lists`     | Create new list         | `{ name, color }` | `{ id, name }`                     |
| GET    | `/shopping-lists/:id` | Get list details        | –                 | `{ id, items }`                    |
| DELETE | `/shopping-lists/:id` | Delete list             | –                 | `{ success: true }`                |

---

### Shopping Item Operations

| Method | Endpoint                    | Description        | Payload                   | Response            |
| ------ | --------------------------- | ------------------ | ------------------------- | ------------------- |
| POST   | `/shopping-lists/:id/items` | Add items (bulk)   | `{ items: [] }`           | `{ addedItems }`    |
| PATCH  | `/shopping-items/:id`       | Update qty / check | `{ isChecked, quantity }` | `{ updatedItem }`   |
| DELETE | `/shopping-items/:id`       | Remove item        | –                         | `{ success: true }` |

---

## 5. Recipes Feature

Supports recipe creation, discovery, and **"Cook" actions** that add ingredients to shopping lists.

### Endpoints

| Method | Endpoint            | Description             | Payload / Query                        | Response                        |
| ------ | ------------------- | ----------------------- | -------------------------------------- | ------------------------------- |
| GET    | `/recipes`          | List recipes            | `?category&search`                     | `[{ id, title, image }]`        |
| POST   | `/recipes`          | Create recipe           | `{ title, ingredients, instructions }` | `{ id }`                        |
| GET    | `/recipes/:id`      | Get recipe              | –                                      | `{ title, ingredients, steps }` |
| PUT    | `/recipes/:id`      | Update recipe           | `{ title, ... }`                       | `{ updatedRecipe }`             |
| POST   | `/recipes/:id/cook` | Add ingredients to list | `{ targetListId, ingredients }`        | `{ itemsAdded }`                |

---

## 6. Chores Feature

Supports assignment, recurring tasks, and progress tracking.

### Endpoints

| Method | Endpoint             | Description         | Payload / Query                          | Response               |
| ------ | -------------------- | ------------------- | ---------------------------------------- | ---------------------- |
| GET    | `/chores`            | Get chores          | `?start&end`                             | `{ today, upcoming }`  |
| POST   | `/chores`            | Create chore        | `{ title, assigneeId, dueDate, repeat }` | `{ id }`               |
| PATCH  | `/chores/:id`        | Update chore        | `{ assigneeId }`                         | `{ updatedChore }`     |
| PATCH  | `/chores/:id/status` | Toggle completion   | `{ isCompleted }`                        | `{ progress }`         |
| GET    | `/chores/stats`      | Stats for dashboard | `?date`                                  | `{ total, completed }` |

---

## 7. Dashboard Aggregation

Optimized endpoint for **single-request home screen loading**.

### Endpoint

| Method | Endpoint             | Description               |
| ------ | -------------------- | ------------------------- |
| GET    | `/dashboard/summary` | Aggregated dashboard data |

### Example Response

```json
{
  "greeting": "Good Morning",
  "activeListCount": 3,
  "pendingChoresCount": 4,
  "savedRecipesCount": 12,
  "recentActivity": [
    { "type": "chore_completed", "user": "Dad", "item": "Trash", "time": "10:00 AM" },
    { "type": "list_item_added", "user": "Mom", "item": "Milk", "time": "09:45 AM" }
  ]
}
```

---

## 8. Database Schema (Draft ERD)

### households

* `id` (PK)
* `name`
* `created_at`

### users

* `id` (PK)
* `email`
* `google_id`
* `household_id` (FK → households.id)
* `role` (Admin, Member, Kid)
* `avatar_url`

### shopping_lists

* `id` (PK)
* `household_id` (FK)
* `name`
* `color`

### shopping_items

* `id` (PK)
* `list_id` (FK → shopping_lists.id)
* `name`
* `quantity`
* `unit`
* `is_checked`
* `category`

### recipes

* `id` (PK)
* `household_id` (FK)
* `title`
* `prep_time`
* `ingredients` (JSONB)
* `instructions` (JSONB)

### chores

* `id` (PK)
* `household_id` (FK)
* `assignee_id` (FK → users.id, nullable)
* `title`
* `due_date`
* `is_completed`
* `completed_at`

---

## Summary

This architecture:

* Enforces **household-based multi-tenancy**
* Supports **offline-first mobile usage**
* Is optimized for **Expo + NestJS + Prisma**
* Scales cleanly for collaboration and sync

This document can be used as the **source of truth** for backend implementation.
