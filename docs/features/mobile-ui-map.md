# Mobile UI Feature Map

Last updated: 2026-05-24

Purpose: source-backed map of current mobile feature areas for humans and agents. Use this as the navigation layer before editing individual feature docs.

## Source basis

- `mobile/App.tsx`
- `mobile/src/navigation/RootNavigator.tsx`
- `mobile/src/navigation/AuthStackNavigator.tsx`
- `mobile/src/navigation/MainNavigator.tsx`
- `mobile/src/navigation/MainTabsScreen.tsx`
- `mobile/src/features/**`
- `mobile/src/common/**`
- `mobile/src/contexts/**`

## Navigation shape

### Bootstrap

- `mobile/App.tsx` mounts the app-level providers and navigation entry point.
- `RootNavigator` chooses between authenticated/main app flow and auth/onboarding flow.
- `MainNavigator` wraps the main app in `NetworkProvider` and `AppLifecycleProvider`, and runs `useSyncQueue()` so queued local changes can sync when network/app lifecycle allows.

### Auth/onboarding stack

Source: `mobile/src/navigation/AuthStackNavigator.tsx`

Screens:

- `Login` → `mobile/src/features/auth/screens/LoginScreen.tsx`
- `Register` → `mobile/src/features/auth/screens/RegisterScreen.tsx`
- `EnterInviteCode` → `mobile/src/features/auth/screens/EnterInviteCodeScreen.tsx`
- `HouseholdName` → `mobile/src/features/auth/screens/HouseholdNameScreen.tsx`
- `HouseholdOnboarding` → `mobile/src/features/onboarding/screens/HouseholdOnboardingScreen.tsx`

The initial auth route depends on user/household state:

- no user → `Login`
- user with `showHouseholdNameScreen` → `HouseholdName`
- user without `householdId` → `HouseholdOnboarding`

### Main tabs

Source: `mobile/src/navigation/MainTabsScreen.tsx`

Tabs, in order:

1. `Dashboard`
2. `Shopping`
3. `Chores`
4. `Recipes`
5. `Settings`

The tab container keeps visited screens mounted and animates screen transitions with Reanimated. Shared modal flows live at this level:

- shopping quick-action modal: `ShoppingQuickActionModal`
- chore creation modal: `ChoreDetailsModal`
- recipe detail view: `RecipeDetailScreen`
- offline status UI: `OfflineBanner`, `OfflinePill`

The main stack also includes:

- `PremiumPaywall` → `mobile/src/features/subscription/screens/PremiumPaywallScreen.tsx`
- `SupportTicket` → `mobile/src/features/support/screens/SupportTicketScreen.tsx`

## Feature areas

### Auth and onboarding

Source directories:

- `mobile/src/features/auth/`
- `mobile/src/features/onboarding/`
- `mobile/src/features/households/services/`
- `mobile/src/contexts/AuthContext.tsx`
- `mobile/src/contexts/HouseholdContext.tsx`

Current screens/components/services include:

- email login/register with verification-aware flow
- Google sign-in button and OAuth sign-in hook
- guest data import modal
- invite-code entry and validation
- household name/onboarding flow
- token/session storage services

### Dashboard

Source: `mobile/src/features/dashboard/`

Current screen/components include:

- `DashboardScreen`
- `QuickAddCard`
- `FrequentlyAddedSection`
- `ImportantChoresCard`
- `QuickStatsRow` / `QuickStatCard`
- `useDashboardChores`
- `buildDashboardFrequentItems`

Important intent: keep dashboard as a lightweight utility surface, primarily for quick add, frequently added items, and important chores.

### Shopping

Source: `mobile/src/features/shopping/`

Current screen/components/services include:

- `ShoppingListsScreen`
- `ShoppingQuickActionModal`
- `ShoppingListPanel`
- `GrocerySearchBar`
- `CategoriesGrid`, `CategoryModal`, `CategoryPicker`
- `CreateListModal`, `CreateCustomItemModal`
- `FrequentlyAddedGrid`
- `IngredientConflictModal`
- shopping/catalog services, repositories, hooks, normalization utilities

Important intent: shopping is the top-priority feature; preserve fast, low-friction add/delete/list behavior.

### Recipes

Source: `mobile/src/features/recipes/`

Current screen/components/services include:

- `RecipesScreen`
- `RecipeDetailScreen`
- `RecipeCard`
- `AddRecipeModal`
- `RecipeIngredients`, `IngredientCard`, `UnitPicker`
- `RecipeImageSearchModal`
- recipe API/cache/services and image-search service

Important intent: recipes should remain easy to read while cooking and tightly connected to shopping through ingredient actions.

### Chores

Source: `mobile/src/features/chores/`

Current screen/components/services include:

- `ChoresScreen`
- `ChoreCard`
- `ChoresProgressCard`
- `ChoresSection`
- `ProgressRing`
- `ChoreDetailsModal`
- `ChoresQuickActionModal`
- chore service and chore factory utilities

Important intent: preserve progress visibility, simple today/upcoming organization, assignment, date/time, swipe/delete, and quick-add behavior.

### Settings, account, legal, support, and premium

Source directories:

- `mobile/src/features/settings/`
- `mobile/src/features/support/`
- `mobile/src/features/subscription/`

Current screen/components/services include:

- `SettingsScreen`
- `ManageHouseholdModal`
- `InviteMemberModal`
- `LanguageSelectorModal`
- `LegalConsentGate`, `LegalConsentModal`
- `SupportTicketScreen`
- `ImportDataModal`
- `PremiumSection`, `PremiumDemoSection`
- `PremiumPaywallScreen`
- account, support ticket, premium demo, purchase, RevenueCat, and subscription API services

Important intent: settings is now more than basic profile settings; it is also where account/privacy/legal, guided support intake, household management, language, and premium/subscription surfaces are exposed. The signed-in mobile support flow is backend-first via protected `POST /api/v1/support/tickets`; it forwards tickets to `yair.solutions.19@gmail.com` by Resend and keeps `Email support instead` as the mailto fallback with recommended Gmail label `KitchenHub/Support/Issues/New` in generated fallback packets.

## Source-backed doc status

Preserve/update:

- `docs/features/shopping.md` — product intent is useful; add/use this map for current source structure.
- `docs/features/recipes.md` — product intent is useful; source now also includes recipe image search/upload support.
- `docs/features/dashboard.md` — product intent is useful and should remain focused on utility, not dashboard bloat.
- `docs/features/chores.md` — needs source-structure correction; source has more components than the older header claims.
- `docs/features/settings.md` — source-structure corrected for legal, import, premium, invite, support intake, account services, and language support.
- `docs/features/auth.md` — needs source-structure correction; auth now includes register, invite code, household name, onboarding context, OAuth hook, session/token services, and guest import support.

Do not use screenshots or old inline snippets as proof that current behavior exists. Verify important behavior in current source and tests first.
