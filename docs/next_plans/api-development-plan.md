# Kitchen Hub - API & Backend Development Plan

## 1. Architectural Strategy

We will adopt a **Local-First, Hybrid** architecture. The backend is designed to run self-hosted (Docker) while supporting mobile synchronization and smart home integration.

* **Protocol:** Hybrid approach using **REST** (for standard CRUD) and **MQTT** (for real-time Home Assistant events).
* **Framework:** **Fastify** (Node.js).
    * *Rationale:* High performance, low overhead for local servers, and first-class TypeScript support.
* **Validation:** **Zod**.
    * *Rationale:* Allows sharing validation schemas directly between the React Native frontend and the backend, ensuring data consistency.
* **Documentation:** **OpenAPI (Swagger)**.
    * *Rationale:* Auto-generated from Fastify schemas. Crucial for generating "REST Commands" for Home Assistant.
* **Database:** **PostgreSQL** with **Prisma ORM**.
    * *Rationale:* Enforces strict relationships (Inventory ↔ Shopping Lists) while allowing `JSONB` flexibility for complex recipe steps.

## 2. Directory Structure (Feature-Based)

The backend structure mirrors the frontend's feature-based approach to improve maintainability and cohesion.

```text
/src
  /modules
    /auth          # Google OAuth, Guest Sessions, JWT issuing
    /household     # Member management, Settings
    /inventory     # MasterItem logic, Global Search, Image Serving
    /shopping      # Lists, Items, "Smart Add" Logic
    /recipes       # Recipe CRUD, Scaling, Parsing
    /chores        # Task logic, Recurrence calculation, HA Triggers
    /sync          # Offline synchronization logic
  /shared
    /database      # Prisma Client instance
    /mqtt          # MQTT Broker connection & Topic definitions
    /storage       # Local file system handler (for self-hosted images)
  app.ts           # Main entry point
  config.ts        # Environment variables (DB_URL, MQTT_HOST)