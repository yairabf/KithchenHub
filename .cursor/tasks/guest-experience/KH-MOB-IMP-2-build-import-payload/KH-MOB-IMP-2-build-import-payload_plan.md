# KH-MOB-IMP-2 - Build import payload & call API

**Epic:** Guest Experience
**Created:** 2026-01-22
**Status:** Planning

## Overview
This task implements the logic to gather "local" guest data (currently a mix of mock data and persisted AsyncStorage) and submit it to the backend `POST /api/v1/import` endpoint. It also includes the UI to trigger this action and show progress/success/failure.

## Architecture

### New Files
- `mobile/src/services/import/importService.ts`: The main service responsible for gathering data and calling the API.
- `mobile/src/services/import/types.ts`: Types matching the backend DTOs.
- `mobile/src/features/settings/components/ImportDataModal.tsx`: UI component for the import initiation and progress.

### Components Affected
- `mobile/src/features/settings/screens/SettingsScreen.tsx`: Add "Import Data" entry point (or ensure it's accessible).
- `mobile/src/services/api.ts`: Ensure `api` client can handle the request (already generic, so no changes expected).

### Data Sources (Guest Data)
Since the app currently uses a mix of mock data and limited persistence for Guest Mode, the import service will source data as follows:
1.  **Recipes**: `LocalRecipeService.getRecipes()` (currently returns `mockRecipes`).
2.  **Shopping Lists**: Directly import `mockShoppingLists` (simulating local persistence).
3.  **Chores**: Directly import `mockChores` (simulating local persistence).
4.  **Household Members**: Read from `AsyncStorage` key `@kitchen_hub_household_members`.

## Implementation Steps

### 1. Define Types
Create `mobile/src/services/import/types.ts` to mirror the backend `ImportRequestDto` and `ImportResponseDto`.

### 2. Implement ImportService
Create `mobile/src/services/import/importService.ts` with:
- `gatherLocalData()`: Fetches data from all sources.
- `submitImport(data)`: Calls `api.post('/import', data)`.
- Error handling and type mapping.

### 3. Create Unit Tests
Create `mobile/src/services/import/importService.spec.ts` to test:
- Data gathering logic (mocking the sources).
- API call construction.
- Error handling.

### 4. Implement UI
Create `mobile/src/features/settings/components/ImportDataModal.tsx` containing:
- "Importing..." state.
- Success confirmation.
- Error/Retry state.

### 5. Integration
Connect the UI to a button (e.g., in Settings or a dedicated "Complete Setup" card).

## Verification Plan

### Automated Tests
Run unit tests for the new service:
`npm test mobile/src/services/import/importService.spec.ts`

### Manual Verification
1.  Start the backend (if available) and mobile app.
2.  Navigate to the Settings/Import screen.
3.  Tap "Import Data".
4.  Verify the progress indicator shows.
5.  **Mock Success**: Since backend might not be fully running on localhost for the emulator without config, verify the *Network Request* is sent (logs) or mock the API response to test the Success UI.
6.  **Mock Failure**: Mock an API failure and verify the Retry UI appears.
