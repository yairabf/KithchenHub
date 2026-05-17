# Feature Docs Source Cross-Check Notes

Date: 2026-05-16

## Source inspected

Docs:

- `docs/features/mobile-ui-map.md`
- `docs/features/auth.md`
- `docs/features/dashboard.md`
- `docs/features/shopping.md`
- `docs/features/recipes.md`
- `docs/features/chores.md`
- `docs/features/settings.md`

Mobile source:

- `mobile/src/navigation/MainNavigator.tsx`
- `mobile/src/navigation/MainTabsScreen.tsx`
- `mobile/src/features/auth/screens/LoginScreen.tsx`
- `mobile/src/features/auth/screens/RegisterScreen.tsx`
- `mobile/src/features/auth/screens/EnterInviteCodeScreen.tsx`
- `mobile/src/features/auth/screens/HouseholdNameScreen.tsx`
- `mobile/src/features/dashboard/screens/DashboardScreen.tsx`
- `mobile/src/features/dashboard/components/FrequentlyAddedSection/FrequentlyAddedSection.tsx`
- `mobile/src/features/chores/screens/ChoresScreen.tsx`
- `mobile/src/features/chores/components/ChoreCard/ChoreCard.tsx`
- `mobile/src/features/settings/screens/SettingsScreen.tsx`
- `mobile/src/features/settings/components/ManageHouseholdModal.tsx`
- source search across `mobile/src/features/recipes` and `mobile/src/features/shopping`

## Docs updated

- `docs/features/auth.md`
- `docs/features/dashboard.md`
- `docs/features/chores.md`
- `docs/features/settings.md`
- `docs/project/RECENT_CHANGES.md`

## Corrections made

### Auth

- Added current auth/onboarding screens beyond `LoginScreen`: `RegisterScreen`, `EnterInviteCodeScreen`, `HouseholdNameScreen`, and `HouseholdOnboardingScreen`.
- Documented email/password login and registration, invite-context Google sign-in, legal links from `LegalLinksContext`, and household-name redirect after OAuth.
- Replaced overly narrow persistence note with auth/session/token service references.

### Dashboard

- Replaced placeholder-only Frequently Added language with source-backed behavior.
- Documented signed-in path: read cached frequent items, call `shoppingService.getFrequentItems(8)`, cache non-empty results, and use the same quick-add handler for search and frequent-item tiles.
- Documented duplicate rapid-tap guard and optimistic update behavior.

### Chores

- Corrected `ChoreCard` location from internal `ChoresScreen` component to `mobile/src/features/chores/components/ChoreCard/ChoreCard.tsx`.
- Removed stale sync-status-indicator claim from `ChoreCard` docs; current component shows icon/title/assignee/recurrence/due time and supports swipe delete/edit/toggle.
- Corrected cache-first language to match shared `getCached()` behavior documented in `docs/architecture/mobile-offline-cache-sync.md`.
- Removed stale `mockChores` dependency from key dependencies.

### Settings

- Updated overview and feature list to include premium, invite, legal-link, and delete-account flows.
- Corrected `ManageHouseholdModal` behavior: it lists members from `HouseholdContext`, protects default members, and exposes invite/share actions instead of an inline add-member field.
- Added local state references for invite modal visibility/initial action, `LegalLinksContext`, and `accountService.deleteMyAccount()`.

## Archive decision

No docs were archived. Existing feature docs remain useful and were patched in place.

## Remaining weaker areas

- `docs/features/shopping.md` and `docs/features/recipes.md` looked broadly aligned from the source searches, but they are still dense and could benefit from a deeper line-by-line pass if needed.
- Screenshot freshness was not visually revalidated in this pass; only screenshot file presence was checked.
