# KH-MOB-IMP-4 — Clear local guest data flow

**Epic:** Guest Experience
**Created:** 2026-01-22
**Status:** Planning

## Overview
Implement a UI flow to clear guest-mode local data after a successful import. This ensures users can clean up their local device storage and remove guest data once it has been safely migrated to the server.

UI Changes:
- Update `ImportDataModal` to show a "Clear local data" option after successful import.
- Add a confirmation dialog before clearing data.

## Architecture
- **Mobile Client**:
    - `ImportDataModal.tsx`:
        - State machine update: `idle` -> `loading` -> `success` -> (`clearing_prompt`?) -> `cleared` or closed.
        - Add logic to handle "Clear Data" click.
        - Add `Alert` for confirmation.
    - `AuthContext.tsx`:
        - Use existing `clearGuestData` function.
        - Enhance `clearGuestData` if necessary to clean up more than just the flag (e.g. AsyncStorage keys).

## Implementation Steps
1.  **Modify `ImportDataModal`**:
    - Update the `success` view to include "Clear local data" button (primary) and "Keep & Close" button (secondary).
    - Implement `handleClearData` function:
        - Show `Alert.alert` with "Clear Local Data?", "This will remove all guest data from this device. This action cannot be undone.", ["Cancel", "Clear"].
        - On "Clear": call `AuthContext.clearGuestData()`, then close modal or show "Data Cleared" toast/message.
2.  **Verify `clearGuestData`**:
    - Ensure `AuthContext.clearGuestData` correctly removes `HAS_GUEST_DATA_KEY`.
    - (Optional) Add logic to clear specific entity keys if identified.

## Verification Plan

### Automated Tests
- **Unit Tests**:
    - Create `ImportDataModal.spec.tsx` (if not exists) or update it.
    - Test:
        - Renders success state.
        - Clicking "Clear local data" shows confirmation.
        - Confirming calls `clearGuestData`.
        - Cancelling does not call `clearGuestData`.
        - "Keep & Close" closes modal without clearing.

### Manual Verification
1.  Start app in Guest Mode.
2.  Create some guest data (if possible/mocked).
3.  Sign In -> Trigger Import.
4.  Wait for Import Success.
5.  Verify "Clear local data" button appears.
6.  Click "Clear local data".
7.  Verify Confirmation Alert appears.
8.  Click "Cancel" -> Alert closes, nothing happens.
9.  Click "Clear" -> `clearGuestData` is called (check logs/debug), Modal closes.
10. Verify Guest Data is gone (e.g. `hasGuestData` is false).
