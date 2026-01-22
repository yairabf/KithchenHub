# 001 - Enable Google Authentication

**Epic:** User Authentication
**Created:** 2026-01-22
**Status:** Planning

## Overview
Enable Google OAuth via Supabase and ensure authenticated users are correctly mapped to the `public.users` table in the database. This includes setting up an automatic sync between Supabase's internal auth system and our application's `users` table.

## User Review Required

> [!IMPORTANT]
> This change involves modifying the `User.id` from `cuid()` to a UUID to match Supabase's `auth.users` ID. This is a breaking change for any existing data in the `users` table.

## Proposed Changes

### Database & Prisma

#### [MODIFY] [schema.prisma](file:///Users/yairabramovitch/Documents/workspace/KithchenHub/backend/src/infrastructure/database/prisma/schema.prisma)
- Change `User.id` from `String @id @default(cuid())` to `String @id`.
- Update all `userId` and `assigneeId` fields in other models to match the new ID type.

#### [NEW] [user-sync-trigger.sql](file:///Users/yairabramovitch/Documents/workspace/KithchenHub/backend/src/infrastructure/database/migrations/user-sync-trigger.sql)
- SQL function `handle_new_user()` to insert into `public.users`.
- Trigger `on_auth_user_created` on `auth.users`.

### Backend

#### [MODIFY] [auth.service.ts](file:///Users/yairabramovitch/Documents/workspace/KithchenHub/backend/src/modules/auth/services/auth.service.ts)
- Update `findOrCreateGoogleUser` to expect users to be primarily managed/created by Supabase.
- Refactor token verification if necessary to support Supabase-issued tokens (or keep current flow where backend issues its own tokens after verifying Supabase identity).

### Mobile

#### [MODIFY] [AuthContext.tsx](file:///Users/yairabramovitch/Documents/workspace/KithchenHub/mobile/src/contexts/AuthContext.tsx)
- Integrate `@supabase/supabase-js`.
- Implement `signInWithGoogle` using `supabase.auth.signInWithOAuth`.
- Fetch and set user profile from `public.users` after sign-in.

---

## Supabase Configuration (Manual Steps)
1. Go to Supabase Dashboard -> Authentication -> Providers.
2. Enable Google.
3. Configure "Client ID" and "Client Secret" (to be provided by the developer).
4. Add the redirect URI: `https://[PROJECT_REF].supabase.co/auth/v1/callback`.

## Verification Plan

### Automated Tests
- Since TDD is required, I will create a test for the user creation trigger if possible (via SQL or integration test).
- Update backend auth tests to reflect the new user ID structure.
- **Backend**: `npm run test` in `/backend`.
- **Mobile**: `npm run test` in `/mobile`.

### Manual Verification
1. Open mobile app.
2. Click "Sign in with Google".
3. Verify redirect to Google login.
4. Verify record creation in `public.users` table.
5. Verify successful navigation to Home Screen.
6. Test Logout.
