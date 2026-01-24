# 002 - Guest Data Import Modal

**Epic:** Product Improvements (KH-PROD-IMP)
**Created:** 2026-01-21
**Status:** Planning

## Overview
Implement a modal that prompts users to import their guest mode data after a successful sign-in. This modal should appear only once per sign-in session and only if local guest data exists.

## Architecture
- **New Component:** `mobile/src/features/auth/components/GuestDataImportModal.tsx`
  - Reuses `CenteredModal`.
  - Content: Header "Found existing data", Body text "We found recipes/plans from your guest session. Would you like to import them?", Buttons "Import local data" (Primary), "Not now" (Secondary).
- **State Management:** `AuthContext.tsx`
  - Needs to track if the prompt has been shown/dismissed (persisted in AsyncStorage with key `@kitchen_hub_guest_import_prompt_shown`).
  - Logic to detect "Guest Data":
    - We will simply check if the user was previously logged in as a guest (check `previousUser` state or similar before overwriting with Google User).
    - If `AsyncStorage.getItem('@kitchen_hub_user')` returns a guest user, we flag `hasGuestData = true`.
    - *Refinement*: To be more precise, we should check if there are any *actual* data items (recipes, shopping list) associated with the guest. I will add a check for existence of data keys if I find them (e.g. `@kitchen_hub_recipes`, `@kitchen_hub_shopping_list`).
    - *Fall back*: If no data storage is found yet (since this is early dev), I will simulate "Guest Data" if the previous user was a Guest.
  - New `importGuestData` function in AuthContext (placeholder for now, or copy data if possible).

## Implementation Steps
1.  **Create Modal Component:**
    -   Implement `GuestDataImportModal` using `CenteredModal`.
2.  **Update AuthContext:**
  -   Modify `signInWithGoogle` to:
        1.  Check current user state (is it guest?).
        2.  Check for `Import Prompt` status.
        3.  If Guest + Not Prompted -> Set `showImportModal` state in Context (or return flag).
        4.  Proceed with Sign In.
    -   Add `importGuestData` function (Stub for now, to be implemented with actual data copying).
    -   Add `markImportPromptShown` function to save `@kitchen_hub_guest_import_prompt_shown`.
3.  **Integrate in LoginScreen:**
    -   Add `GuestDataImportModal` to `LoginScreen`.
    -   Trigger it after successful Google Sign-In if conditions are met.
4.  **Persistence Logic:**
    -   Use `AsyncStorage` key `@kitchen_hub_guest_import_prompt_shown` (boolean).
    -   If "Not now" is clicked -> set to `true`.
    -   If "Import" is clicked -> run import logic -> set to `true`.
    -   Modal check: `!promptShown && previousUserWasGuest`.

## Testing Strategy
-   **Manual Verification:**
    1.  Start clean install.
    2.  Use as Guest (create some dummy data if possible, or just be in guest mode).
    3.  Sign In with Google.
    4.  Verify Modal appears.
    5.  Click "Not now".
    6.  Sign out and Sign in again -> Verify Modal does NOT appear (or based on exact requirement interpretation).
