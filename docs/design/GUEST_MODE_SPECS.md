# Guest Mode Specifications

## Overview

Guest Mode is a local-first "try before sign-up" experience that lets users explore the core KitchenHub flows without creating an account. This document defines the user-facing limitations, persistence rules, and messaging boundaries for Guest Mode.

Source-backed architecture reference: [`docs/architecture/DATA_MODES_SPEC.md`](../architecture/DATA_MODES_SPEC.md).
Guest storage decision: [`docs/architecture/GUEST_STORAGE_DECISION.md`](../architecture/GUEST_STORAGE_DECISION.md).

## 1. Core principles

1. **Local-only:** Guest-created data stays on the user's device in AsyncStorage-backed guest storage. It is not sent to the backend unless the user signs in and chooses to import it.
2. **No sync:** Guest data does not sync across devices.
3. **No household sharing:** Guest users cannot invite/join household members or share household-scoped data.
4. **Frictionless entry:** Users can enter the app without email or credentials.
5. **Clear upgrade path:** Users should understand that account creation enables backup, sync, and household collaboration.

## 2. Current feature boundaries

Current Guest Mode should be described around the active product surfaces:

- **Shopping lists:** local-only guest shopping data.
- **Recipes:** local-only guest recipe data.
- **Chores:** local-only guest chore data.
- **Settings/profile:** limited local settings and sign-in/import prompts.
- **Household sharing/invites:** unavailable until signed in.
- **Cloud sync / cross-device access:** unavailable until signed in.

Do not document Pantry Management or Meal Planning as active Guest Mode surfaces unless those features are added to current source and the mobile feature map is updated.

## 3. Data persistence and import

- **Persistence:** Guest data persists while the app remains installed and local app data is not cleared by the OS/user.
- **Storage backend:** AsyncStorage v1 via guest storage utilities; see `mobile/src/common/utils/guestStorage.ts` and `mobile/src/common/utils/guestStorageHelpers.ts`.
- **Import path:** When a Guest user signs in, the app can prompt to import existing local guest data into the signed-in account.
- **User choice:** If the user declines import, guest data should not be silently uploaded.
- **Data loss:** App uninstall or OS-level clear-data actions can remove Guest Mode data permanently.

## 4. User messaging and copy

### 4.1 Onboarding / welcome

Context: the first screen a user sees.

- **Primary action:** sign up / log in / get started.
- **Secondary action:** continue as guest / use offline.
- **Guest disclaimer:**

> Guest Mode saves data only on this device. Sign in to back up your data, sync across devices, and share with your household.

### 4.2 Settings / profile

Context: top of the Settings page for a guest user.

- **Status indicator:** Guest Mode / local-only account.
- **Banner:**

> You are using a local account. Sign in to back up your recipes, shopping lists, and chores and share with your household.

### 4.3 Household or sync blockers

Context: user tries to access household sharing, invite, or cloud-only behavior.

- **Headline:** Sync your household.
- **Body:**

> To share shopping lists, recipes, and chores with your household, create or sign in to a KitchenHub account.

- **Actions:** Sign in / Not now.

### 4.4 Sign-up import prompt

Context: after a guest user signs in and local guest data exists.

- **Copy:**

> Keep your existing local data? We can import your guest shopping lists, recipes, and chores into your account.

## 5. Documentation guardrail

This file describes product behavior and user-facing limits. For exact storage keys, mode guards, import DTOs, and sync restrictions, use the architecture spec and current source files, especially:

- `docs/architecture/DATA_MODES_SPEC.md`
- `docs/architecture/GUEST_STORAGE_DECISION.md`
- `mobile/src/common/utils/guestStorage.ts`
- `mobile/src/common/storage/dataModeStorage.ts`
- `mobile/src/services/import/importService.ts`
