# 002 - Set Up Supabase Project & Core Services

**Epic:** Backend Infrastructure & Data Architecture
**Created:** 2026-01-22
**Status:** Planning

## Overview
Initialize the Supabase project and enable core backend services required for the application. This includes configuring the project, setting up environment variables, and verifying the connection to PostgreSQL and Realtime services.

## Architecture
- **Components affected**: Backend configuration, Environment setup.
- **New files to create**: 
    - `backend/src/config/supabase.ts` (or similar config file)
- **Files to modify**:
    - `backend/.env.example`
    - `backend/package.json` (add dependencies)
    - `backend/src/app.module.ts` (potentially to import config)
- **Dependencies required**:
    - `@supabase/supabase-js`

## Implementation Steps
1.  **Project Initialization**:
    - Create Supabase project (Simulator/Manual step or CLI if applicable).
    - Initialize local configuration if using CLI.
2.  **Environment Configuration**:
    - Add `SUPABASE_URL` and `SUPABASE_KEY` (and `SUPABASE_SERVICE_ROLE_KEY` if needed) to `.env`.
    - Update `.env.example`.
3.  **Backend Integration**:
    - Install `@supabase/supabase-js`.
    - Create a Supabase client factory/service.
4.  **Verification**:
    - Create a script or test to connect to Supabase.
    - Test Realtime subscription (e.g., listen to a table).

## Testing Strategy
- **Unit tests**: Mock Supabase client.
- **Manual verification**: Run a script that connects to the remote/local Supabase instance and logs success.
- **Realtime verification**: Subscribe to a channel and trigger an event (insert row).

## Success Criteria
- [ ] Supabase project credentials are in `.env`.
- [ ] Application can connect to Supabase PostgreSQL.
- [ ] Realtime subscriptions are active and receiving events.
