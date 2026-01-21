# Kitchen Hub - Backend & Database Architecture

## 1. Architectural Philosophy
* **Local-First & Homelab Friendly:** The backend is designed to run as a self-hosted service (Docker container) on a home server (e.g., TrueNAS, Proxmox).
* **Home Assistant Ready:** The system exposes entities and webhooks to integrate with Home Assistant for automation (e.g., toggling chores, smart fridge alerts).
* **Hybrid Data Sync:** Supports offline-first usage (SQLite on device) with synchronization to the central Postgres instance when connected.

## 2. Technology Stack Selection
| Component | Choice | Rationale |
| :--- | :--- | :--- |
| **Database** | **PostgreSQL** | Chosen over MongoDB for its ability to enforce strict relationships between Users, Lists, and Inventory while offering `JSONB` flexibility for complex recipe steps. |
| **ORM** | **Prisma** | Provides a unified schema that works with both the local server (PostgreSQL) and potentially the mobile app (SQLite) for type-safe queries. |
| **API** | **Node.js (Express/Fastify)** | Lightweight, scalable, and easy to containerize. |
| **Messaging** | **MQTT** | Facilitates real-time events for Home Assistant (e.g., `kitchenhub/chores/completed`). |

## 3. The "Master Item" Logic
To solve the disconnect between "Recipes" and "Shopping Lists," we utilize a centralized **MasterItem** table.

* **The Problem:** "Eggs" in a recipe is a *template*, while "Eggs" on a shopping list is an *instance*. Merging them into one table causes data conflicts.
* **The Solution:**
    * **`MasterItem`:** The source of truth (Name, Default Category, Default Image).
    * **`RecipeIngredient`:** Links to a MasterItem (defines *what* is needed).
    * **`ShoppingItem`:** Links to a MasterItem (defines *what* to buy).
* **Benefit:** Updating an image or category in `MasterItem` instantly reflects across all recipes and active shopping lists.

## 4. Database Schema (Prisma)

```prisma
// --- USER & HOUSEHOLD MANAGEMENT ---

model User {
  id            String    @id @default(uuid())
  email         String?   @unique
  memberships   HouseholdMember[]
}

model Household {
  id            String    @id @default(uuid())
  name          String    // e.g., "The Smith Home"
  members       HouseholdMember[]
  shoppingLists ShoppingList[]
  recipes       Recipe[]
  chores        Chore[]
  integrations  Integration[]
}

model HouseholdMember {
  id            String    @id @default(uuid())
  userId        String?   // Nullable for "Kids" profiles not yet claimed
  householdId   String
  label         String    // "Mom", "Dad", "Kids"
  permissions   String    // "ADMIN", "MEMBER"
  
  user          User?     @relation(fields: [userId], references: [id])
  household     Household @relation(fields: [householdId], references: [id])
}

// --- THE SHARED BRAIN (Inventory & Definitions) ---

model MasterItem {
  id               String   @id @default(uuid())
  name             String   @unique // "Milk", "Wagyu Beef"
  category         String   // "Dairy", "Meat"
  defaultImagePath String?  // Local path or URL
  
  shoppingInstances ShoppingItem[]
  recipeInstances   RecipeIngredient[]
}

// --- SHOPPING FEATURE ---

model ShoppingList {
  id            String    @id @default(uuid())
  householdId   String
  name          String
  items         ShoppingItem[]
  
  household     Household @relation(fields: [householdId], references: [id])
}

model ShoppingItem {
  id              String    @id @default(uuid())
  listId          String
  
  // Link to Master DB for auto-categorization & images
  masterItemId    String?   
  
  name            String    // Allow custom override
  quantity        Float
  unit            String?
  isPurchased     Boolean   @default(false)
  customImagePath String?   // Allow user to upload a specific photo for this trip
  
  list            ShoppingList @relation(fields: [listId], references: [id])
  masterItem      MasterItem?  @relation(fields: [masterItemId], references: [id])
}

// --- RECIPE FEATURE ---

model Recipe {
  id            String    @id @default(uuid())
  householdId   String
  title         String
  
  // Structured Data
  ingredients   RecipeIngredient[]
  
  // Flexible Data (JSONB) - Steps don't need strict SQL relations
  steps         Json      // [{"step": 1, "text": "Mix..."}, {"step": 2...}]
  
  household     Household @relation(fields: [householdId], references: [id])
}

model RecipeIngredient {
  id            String    @id @default(uuid())
  recipeId      String
  
  // Link to Master DB so "Add to Shopping List" knows what to add
  masterItemId  String?
  
  name          String
  quantity      String    // "2 cups", "pinch"
  prepNote      String?   // "diced", "sifted"
  
  recipe        Recipe    @relation(fields: [recipeId], references: [id])
  masterItem    MasterItem? @relation(fields: [masterItemId], references: [id])
}

// --- CHORES & INTEGRATIONS ---

model Chore {
  id            String    @id @default(uuid())
  householdId   String
  title         String
  assigneeId    String?   // Linked to HouseholdMember
  
  // Home Assistant Integration
  haEntityId    String?   // e.g., "binary_sensor.kitchen_dishes"
  
  recurrence    String?   // CRON string
  dueDate       DateTime?
  isCompleted   Boolean   @default(false)
  
  household     Household @relation(fields: [householdId], references: [id])
}

model Integration {
  id            String    @id @default(uuid())
  householdId   String
  type          String    // "HOME_ASSISTANT", "WEBHOOK"
  config        Json      // { "webhookUrl": "...", "apiKey": "..." }
  
  household     Household @relation(fields: [householdId], references: [id])
}