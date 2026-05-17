# Mobile/UI Source Map

Generated: 2026-05-16

## Source basis

- `mobile/src/app/**`
- `mobile/src/features/**`
- `mobile/src/components/**`
- `mobile/src/services/**`
- `mobile/src/stores/**`

## App route files

## Feature directories

### `mobile/src/features/auth`
- TS/TSX files: 21
- Areas: (root) (1), components (7), contexts (1), hooks (1), screens (5), services (4), utils (2)
  - `mobile/src/features/auth/components/GoogleSignInButton/GoogleSignInButton.tsx` — exports: GoogleSignInButton
  - `mobile/src/features/auth/components/GoogleSignInButton/index.ts`
  - `mobile/src/features/auth/components/GoogleSignInButton/styles.ts` — exports: styles
  - `mobile/src/features/auth/components/GoogleSignInButton/types.ts`
  - `mobile/src/features/auth/components/GuestDataImportModal/GuestDataImportModal.tsx` — exports: GuestDataImportModal
  - `mobile/src/features/auth/components/GuestDataImportModal/__tests__/GuestDataImportModal.test.tsx`
  - `mobile/src/features/auth/components/GuestDataImportModal/index.ts`
  - `mobile/src/features/auth/contexts/OnboardingContext.tsx` — exports: OnboardingProvider, useOnboarding
  - `mobile/src/features/auth/hooks/useOAuthSignIn.ts` — exports: useOAuthSignIn
  - `mobile/src/features/auth/index.ts`
  - `mobile/src/features/auth/screens/EnterInviteCodeScreen.tsx` — exports: EnterInviteCodeScreen
  - `mobile/src/features/auth/screens/HouseholdNameScreen.tsx` — exports: HouseholdNameScreen
  - `mobile/src/features/auth/screens/LoginScreen.tsx` — exports: LoginScreen
  - `mobile/src/features/auth/screens/RegisterScreen.tsx` — exports: RegisterScreen
  - `mobile/src/features/auth/screens/__tests__/LoginScreen.test.tsx`
  - `mobile/src/features/auth/services/authApi.ts` — exports: authApi
  - `mobile/src/features/auth/services/sessionManager.test.ts`
  - `mobile/src/features/auth/services/sessionManager.ts`
  - `mobile/src/features/auth/services/tokenStorage.ts` — exports: tokenStorage
  - `mobile/src/features/auth/utils/__tests__/userVerification.test.ts`
  - `mobile/src/features/auth/utils/userVerification.ts` — exports: NEW_HOUSEHOLD_VERIFICATION_WINDOW_MINUTES, verifyHouseholdIsNewlyCreated, mapUserResponseToUser

### `mobile/src/features/chores`
- TS/TSX files: 41
- Areas: (root) (2), components (31), screens (4), services (2), utils (2)
  - `mobile/src/features/chores/components/ChoreCard/ChoreCard.spec.tsx`
  - `mobile/src/features/chores/components/ChoreCard/ChoreCard.tsx` — exports: ChoreCard
  - `mobile/src/features/chores/components/ChoreCard/__tests__/ChoreCard.layout.test.tsx`
  - `mobile/src/features/chores/components/ChoreCard/__tests__/ChoreCard.test.tsx`
  - `mobile/src/features/chores/components/ChoreCard/index.ts`
  - `mobile/src/features/chores/components/ChoreCard/styles.ts` — exports: styles
  - `mobile/src/features/chores/components/ChoreCard/types.ts`
  - `mobile/src/features/chores/components/ChoreDetailsModal/ChoreDetailsModal.tsx` — exports: ChoreDetailsModal
  - `mobile/src/features/chores/components/ChoreDetailsModal/__tests__/ChoreDetailsModal.test.tsx`
  - `mobile/src/features/chores/components/ChoreDetailsModal/index.ts`
  - `mobile/src/features/chores/components/ChoreDetailsModal/styles.ts` — exports: styles
  - `mobile/src/features/chores/components/ChoreDetailsModal/types.ts`
  - `mobile/src/features/chores/components/ChoresProgressCard/ChoresProgressCard.tsx` — exports: ChoresProgressCard
  - `mobile/src/features/chores/components/ChoresProgressCard/__tests__/ChoresProgressCard.test.tsx`
  - `mobile/src/features/chores/components/ChoresProgressCard/index.ts`
  - `mobile/src/features/chores/components/ChoresProgressCard/styles.ts` — exports: styles
  - `mobile/src/features/chores/components/ChoresProgressCard/types.ts`
  - `mobile/src/features/chores/components/ChoresQuickActionModal/ChoresQuickActionModal.tsx` — exports: ChoresQuickActionModal
  - `mobile/src/features/chores/components/ChoresQuickActionModal/__tests__/ChoresQuickActionModal.test.tsx`
  - `mobile/src/features/chores/components/ChoresQuickActionModal/index.ts`
  - `mobile/src/features/chores/components/ChoresQuickActionModal/styles.ts` — exports: styles
  - `mobile/src/features/chores/components/ChoresQuickActionModal/types.ts`
  - `mobile/src/features/chores/components/ChoresSection/ChoresSection.tsx` — exports: ChoresSection
  - `mobile/src/features/chores/components/ChoresSection/__tests__/ChoresSection.test.tsx`
  - `mobile/src/features/chores/components/ChoresSection/index.ts`
  - `mobile/src/features/chores/components/ChoresSection/styles.ts` — exports: styles
  - `mobile/src/features/chores/components/ChoresSection/types.ts`
  - `mobile/src/features/chores/components/ProgressRing/ProgressRing.tsx` — exports: ProgressRing
  - `mobile/src/features/chores/components/ProgressRing/index.ts`
  - `mobile/src/features/chores/components/ProgressRing/styles.ts` — exports: styles
  - `mobile/src/features/chores/components/ProgressRing/types.ts`
  - `mobile/src/features/chores/constants.ts` — exports: CHORE_ICONS
  - `mobile/src/features/chores/index.ts`
  - `mobile/src/features/chores/screens/ChoresScreen.tsx` — exports: ChoresScreen
  - `mobile/src/features/chores/screens/__tests__/ChoresScreen.deletion.test.tsx`
  - ... 6 more files

### `mobile/src/features/dashboard`
- TS/TSX files: 31
- Areas: (root) (1), components (23), hooks (1), screens (4), utils (2)
  - `mobile/src/features/dashboard/components/FrequentlyAddedSection/FrequentlyAddedSection.tsx` — exports: FrequentlyAddedSection
  - `mobile/src/features/dashboard/components/FrequentlyAddedSection/__tests__/FrequentlyAddedSection.test.tsx`
  - `mobile/src/features/dashboard/components/FrequentlyAddedSection/index.ts`
  - `mobile/src/features/dashboard/components/FrequentlyAddedSection/styles.ts` — exports: styles
  - `mobile/src/features/dashboard/components/FrequentlyAddedSection/types.ts`
  - `mobile/src/features/dashboard/components/ImportantChoresCard/ImportantChoresCard.tsx` — exports: ImportantChoresCard
  - `mobile/src/features/dashboard/components/ImportantChoresCard/index.ts`
  - `mobile/src/features/dashboard/components/ImportantChoresCard/styles.ts` — exports: styles
  - `mobile/src/features/dashboard/components/ImportantChoresCard/types.ts`
  - `mobile/src/features/dashboard/components/QuickAddCard/QuickAddCard.tsx` — exports: QuickAddCard
  - `mobile/src/features/dashboard/components/QuickAddCard/__tests__/QuickAddCard.test.tsx`
  - `mobile/src/features/dashboard/components/QuickAddCard/index.ts`
  - `mobile/src/features/dashboard/components/QuickAddCard/styles.ts` — exports: styles
  - `mobile/src/features/dashboard/components/QuickAddCard/types.ts`
  - `mobile/src/features/dashboard/components/QuickStats/QuickStatCard.tsx` — exports: QuickStatCard
  - `mobile/src/features/dashboard/components/QuickStats/QuickStatsRow.tsx` — exports: QuickStatsRow
  - `mobile/src/features/dashboard/components/QuickStats/index.ts`
  - `mobile/src/features/dashboard/components/QuickStats/styles.ts` — exports: styles
  - `mobile/src/features/dashboard/components/QuickStats/types.ts`
  - `mobile/src/features/dashboard/components/TextBlock/TextBlock.tsx` — exports: TextBlock
  - `mobile/src/features/dashboard/components/TextBlock/TitleSubtitleWrapper.tsx` — exports: TitleSubtitleWrapper
  - `mobile/src/features/dashboard/components/TextBlock/index.ts`
  - `mobile/src/features/dashboard/components/TextBlock/styles.ts` — exports: styles
  - `mobile/src/features/dashboard/hooks/useDashboardChores.ts` — exports: useDashboardChores
  - `mobile/src/features/dashboard/index.ts`
  - `mobile/src/features/dashboard/screens/DashboardScreen.tsx` — exports: DashboardScreen
  - `mobile/src/features/dashboard/screens/__tests__/DashboardScreen.test.tsx`
  - `mobile/src/features/dashboard/screens/styles.ts` — exports: styles
  - `mobile/src/features/dashboard/screens/types.ts`
  - `mobile/src/features/dashboard/utils/__tests__/dashboardFrequentItems.test.ts`
  - `mobile/src/features/dashboard/utils/dashboardFrequentItems.ts` — exports: buildDashboardFrequentItems

### `mobile/src/features/households`
- TS/TSX files: 2
- Areas: services (2)
  - `mobile/src/features/households/services/householdApi.ts` — exports: householdApi
  - `mobile/src/features/households/services/inviteApi.ts` — exports: inviteApi

### `mobile/src/features/onboarding`
- TS/TSX files: 1
- Areas: screens (1)
  - `mobile/src/features/onboarding/screens/HouseholdOnboardingScreen.tsx` — exports: HouseholdOnboardingScreen

### `mobile/src/features/recipes`
- TS/TSX files: 68
- Areas: (root) (1), components (43), constants (3), hooks (2), screens (12), services (4), utils (3)
  - `mobile/src/features/recipes/components/AddRecipeModal/AddRecipeModal.tsx` — exports: AddRecipeModal
  - `mobile/src/features/recipes/components/AddRecipeModal/index.ts`
  - `mobile/src/features/recipes/components/AddRecipeModal/styles.ts` — exports: styles
  - `mobile/src/features/recipes/components/AddRecipeModal/types.ts`
  - `mobile/src/features/recipes/components/IngredientCard/IngredientCard.tsx` — exports: IngredientCard
  - `mobile/src/features/recipes/components/IngredientCard/index.ts`
  - `mobile/src/features/recipes/components/IngredientCard/styles.ts` — exports: styles
  - `mobile/src/features/recipes/components/IngredientCard/types.ts`
  - `mobile/src/features/recipes/components/InstructionStep/InstructionStep.tsx` — exports: InstructionStep
  - `mobile/src/features/recipes/components/InstructionStep/index.ts`
  - `mobile/src/features/recipes/components/InstructionStep/styles.ts` — exports: styles
  - `mobile/src/features/recipes/components/InstructionStep/types.ts`
  - `mobile/src/features/recipes/components/RecipeCard/RecipeCard.tsx` — exports: RecipeCard
  - `mobile/src/features/recipes/components/RecipeCard/index.ts`
  - `mobile/src/features/recipes/components/RecipeCard/styles.ts` — exports: styles
  - `mobile/src/features/recipes/components/RecipeCard/types.ts`
  - `mobile/src/features/recipes/components/RecipeContentWrapper/RecipeContentWrapper.tsx` — exports: RecipeContentWrapper
  - `mobile/src/features/recipes/components/RecipeContentWrapper/index.ts`
  - `mobile/src/features/recipes/components/RecipeContentWrapper/styles.ts` — exports: styles
  - `mobile/src/features/recipes/components/RecipeContentWrapper/types.ts`
  - `mobile/src/features/recipes/components/RecipeHeader/RecipeHeader.tsx` — exports: RecipeHeader
  - `mobile/src/features/recipes/components/RecipeHeader/index.ts`
  - `mobile/src/features/recipes/components/RecipeHeader/styles.ts` — exports: styles
  - `mobile/src/features/recipes/components/RecipeHeader/types.ts`
  - `mobile/src/features/recipes/components/RecipeImageSearchModal/RecipeImageSearchModal.tsx` — exports: RecipeImageSearchModal
  - `mobile/src/features/recipes/components/RecipeImageSearchModal/__tests__/RecipeImageSearchModal.test.tsx`
  - `mobile/src/features/recipes/components/RecipeImageSearchModal/index.ts`
  - `mobile/src/features/recipes/components/RecipeImageSearchModal/styles.ts` — exports: styles
  - `mobile/src/features/recipes/components/RecipeImageSearchModal/types.ts`
  - `mobile/src/features/recipes/components/RecipeIngredients/RecipeIngredients.tsx` — exports: RecipeIngredients
  - `mobile/src/features/recipes/components/RecipeIngredients/__tests__/RecipeIngredients.test.tsx`
  - `mobile/src/features/recipes/components/RecipeIngredients/index.ts`
  - `mobile/src/features/recipes/components/RecipeIngredients/styles.ts` — exports: styles
  - `mobile/src/features/recipes/components/RecipeIngredients/types.ts`
  - `mobile/src/features/recipes/components/RecipeSteps/RecipeSteps.tsx` — exports: RecipeSteps
  - ... 33 more files

### `mobile/src/features/settings`
- TS/TSX files: 32
- Areas: (root) (1), components (24), screens (2), services (3), utils (2)
  - `mobile/src/features/settings/components/ImportDataModal.spec.tsx`
  - `mobile/src/features/settings/components/ImportDataModal.tsx` — exports: ImportDataModal
  - `mobile/src/features/settings/components/InviteMemberModal.test.tsx`
  - `mobile/src/features/settings/components/InviteMemberModal.tsx` — exports: InviteMemberModal
  - `mobile/src/features/settings/components/LanguageSelectorModal/LanguageSelectorModal.test.tsx`
  - `mobile/src/features/settings/components/LanguageSelectorModal/LanguageSelectorModal.tsx` — exports: LanguageSelectorModal
  - `mobile/src/features/settings/components/LanguageSelectorModal/index.ts`
  - `mobile/src/features/settings/components/LanguageSelectorModal/types.ts`
  - `mobile/src/features/settings/components/LegalConsentGate.tsx` — exports: LegalConsentGate
  - `mobile/src/features/settings/components/LegalConsentModal/LegalConsentModal.tsx` — exports: LegalConsentModal
  - `mobile/src/features/settings/components/LegalConsentModal/index.ts`
  - `mobile/src/features/settings/components/LegalConsentModal/styles.ts` — exports: styles
  - `mobile/src/features/settings/components/ManageHouseholdModal/ManageHouseholdModal.test.tsx`
  - `mobile/src/features/settings/components/ManageHouseholdModal/ManageHouseholdModal.tsx` — exports: ManageHouseholdModal
  - `mobile/src/features/settings/components/ManageHouseholdModal/index.ts`
  - `mobile/src/features/settings/components/ManageHouseholdModal/styles.ts` — exports: styles
  - `mobile/src/features/settings/components/ManageHouseholdModal/types.ts`
  - `mobile/src/features/settings/components/PremiumDemoSection.tsx` — exports: PremiumDemoSection
  - `mobile/src/features/settings/components/PremiumSection/PremiumSection.test.tsx`
  - `mobile/src/features/settings/components/PremiumSection/PremiumSection.tsx` — exports: PremiumSection
  - `mobile/src/features/settings/components/PremiumSection/index.ts`
  - `mobile/src/features/settings/components/__tests__/LegalConsentGate.test.tsx`
  - `mobile/src/features/settings/components/__tests__/LegalConsentModal.test.tsx`
  - `mobile/src/features/settings/components/__tests__/PremiumDemoSection.test.tsx`
  - `mobile/src/features/settings/index.ts`
  - `mobile/src/features/settings/screens/SettingsScreen.tsx` — exports: SettingsScreen
  - `mobile/src/features/settings/screens/__tests__/SettingsScreen.test.tsx`
  - `mobile/src/features/settings/services/__tests__/accountService.spec.ts`
  - `mobile/src/features/settings/services/accountService.ts` — exports: accountService
  - `mobile/src/features/settings/services/premiumDemoApi.ts` — exports: premiumDemoApi
  - `mobile/src/features/settings/utils/__tests__/errorMessages.spec.ts`
  - `mobile/src/features/settings/utils/errorMessages.ts` — exports: getDeleteAccountErrorMessage

### `mobile/src/features/shopping`
- TS/TSX files: 88
- Areas: (root) (1), components (52), constants (1), hooks (3), screens (8), services (8), types (1), utils (14)
  - `mobile/src/features/shopping/components/AllItemsModal/AllItemsModal.tsx` — exports: AllItemsModal
  - `mobile/src/features/shopping/components/AllItemsModal/__tests__/AllItemsModal.test.tsx`
  - `mobile/src/features/shopping/components/AllItemsModal/index.ts`
  - `mobile/src/features/shopping/components/AllItemsModal/styles.ts` — exports: styles
  - `mobile/src/features/shopping/components/AllItemsModal/types.ts`
  - `mobile/src/features/shopping/components/CategoriesGrid/CategoriesGrid.tsx` — exports: CategoriesGrid
  - `mobile/src/features/shopping/components/CategoriesGrid/CategoriesGridItem.tsx` — exports: CategoriesGridItem
  - `mobile/src/features/shopping/components/CategoriesGrid/__tests__/CategoriesGrid.test.tsx`
  - `mobile/src/features/shopping/components/CategoriesGrid/__tests__/CategoriesGridItem.test.tsx`
  - `mobile/src/features/shopping/components/CategoriesGrid/index.ts`
  - `mobile/src/features/shopping/components/CategoriesGrid/styles.ts` — exports: TILE_GAP, NAME_ZONE_MIN_HEIGHT, styles
  - `mobile/src/features/shopping/components/CategoriesGrid/types.ts`
  - `mobile/src/features/shopping/components/CategoryModal/CategoryModal.tsx` — exports: CategoryModal
  - `mobile/src/features/shopping/components/CategoryModal/index.ts`
  - `mobile/src/features/shopping/components/CategoryModal/styles.ts` — exports: styles
  - `mobile/src/features/shopping/components/CategoryModal/types.ts`
  - `mobile/src/features/shopping/components/CategoryPicker/CategoryPicker.tsx` — exports: CategoryPicker
  - `mobile/src/features/shopping/components/CategoryPicker/__tests__/CategoryPicker.test.tsx`
  - `mobile/src/features/shopping/components/CategoryPicker/index.ts`
  - `mobile/src/features/shopping/components/CategoryPicker/styles.ts` — exports: DROPDOWN_VISIBLE_ITEMS, DROPDOWN_ITEM_HEIGHT, DROPDOWN_MAX_HEIGHT
  - `mobile/src/features/shopping/components/CreateCustomItemModal/CreateCustomItemModal.tsx` — exports: CreateCustomItemModal
  - `mobile/src/features/shopping/components/CreateCustomItemModal/index.ts`
  - `mobile/src/features/shopping/components/CreateCustomItemModal/styles.ts` — exports: styles
  - `mobile/src/features/shopping/components/CreateCustomItemModal/types.ts`
  - `mobile/src/features/shopping/components/CreateListModal/CreateListModal.tsx` — exports: CreateListModal
  - `mobile/src/features/shopping/components/CreateListModal/index.ts`
  - `mobile/src/features/shopping/components/CreateListModal/styles.ts` — exports: styles
  - `mobile/src/features/shopping/components/CreateListModal/types.ts`
  - `mobile/src/features/shopping/components/FrequentlyAddedGrid/FrequentlyAddedGrid.tsx` — exports: FrequentlyAddedGrid
  - `mobile/src/features/shopping/components/FrequentlyAddedGrid/FrequentlyAddedGridItem.tsx` — exports: FrequentlyAddedGridItem
  - `mobile/src/features/shopping/components/FrequentlyAddedGrid/index.ts`
  - `mobile/src/features/shopping/components/FrequentlyAddedGrid/styles.ts` — exports: styles
  - `mobile/src/features/shopping/components/FrequentlyAddedGrid/types.ts`
  - `mobile/src/features/shopping/components/GrocerySearchBar/GrocerySearchBar.tsx` — exports: GrocerySearchBar
  - `mobile/src/features/shopping/components/GrocerySearchBar/__tests__/GrocerySearchBar.test.tsx`
  - ... 53 more files

### `mobile/src/features/subscription`
- TS/TSX files: 6
- Areas: screens (2), services (4)
  - `mobile/src/features/subscription/screens/PremiumPaywallScreen.tsx` — exports: PremiumPaywallScreen
  - `mobile/src/features/subscription/screens/__tests__/PremiumPaywallScreen.test.tsx`
  - `mobile/src/features/subscription/services/__tests__/purchaseService.test.ts`
  - `mobile/src/features/subscription/services/purchaseService.ts` — exports: resolveRevenueCatApiKey, createPurchaseService, PurchaseServiceUnavailableError, RevenueCatPurchaseService
  - `mobile/src/features/subscription/services/revenueCatNativeAdapter.ts` — exports: createRevenueCatSdk
  - `mobile/src/features/subscription/services/subscriptionApi.ts` — exports: subscriptionApi

## Keyword/source density
- `shopping`: 2441 mentions; sample files: mobile/src/__tests__/integration/guestNoSync.test.ts, mobile/src/common/__tests__/utils/i18nMock.ts, mobile/src/common/components/BottomPillNav/BottomPillNav.tsx, mobile/src/common/components/BottomPillNav/types.ts, mobile/src/common/components/CenteredModal/CenteredModal.tsx
- `recipe`: 2782 mentions; sample files: mobile/src/__tests__/integration/guestNoSync.test.ts, mobile/src/common/components/BottomPillNav/BottomPillNav.tsx, mobile/src/common/components/BottomPillNav/types.ts, mobile/src/common/components/CardSkeleton/CardSkeleton.tsx, mobile/src/common/components/CenteredModal/CenteredModal.tsx
- `chore`: 2157 mentions; sample files: mobile/src/__tests__/integration/guestNoSync.test.ts, mobile/src/common/components/BottomPillNav/BottomPillNav.tsx, mobile/src/common/components/BottomPillNav/types.ts, mobile/src/common/components/CenteredModal/CenteredModal.tsx, mobile/src/common/components/EntityFormModal/EntityFormModal.tsx
- `dashboard`: 91 mentions; sample files: mobile/src/common/components/BottomPillNav/BottomPillNav.tsx, mobile/src/common/components/BottomPillNav/types.ts, mobile/src/common/components/ScreenHeader/__tests__/ScreenHeader.test.tsx, mobile/src/features/dashboard/components/FrequentlyAddedSection/FrequentlyAddedSection.tsx, mobile/src/features/dashboard/components/ImportantChoresCard/ImportantChoresCard.tsx
- `settings`: 81 mentions; sample files: mobile/src/common/components/BottomPillNav/BottomPillNav.tsx, mobile/src/common/components/BottomPillNav/types.ts, mobile/src/common/components/ScreenHeader/ScreenHeader.tsx, mobile/src/common/hooks/useReducedMotion.ts, mobile/src/config/index.ts
- `auth`: 587 mentions; sample files: mobile/src/common/guards/__tests__/guestNoSyncGuardrails.test.ts, mobile/src/common/guards/guestNoSyncGuardrails.ts, mobile/src/common/hooks/__tests__/useCachedEntities.test.tsx, mobile/src/common/hooks/useCachedEntities.ts, mobile/src/common/hooks/useSyncQueue.ts
- `onboarding`: 82 mentions; sample files: mobile/src/features/auth/contexts/OnboardingContext.tsx, mobile/src/features/auth/screens/EnterInviteCodeScreen.tsx, mobile/src/features/auth/screens/LoginScreen.tsx, mobile/src/features/auth/screens/__tests__/LoginScreen.test.tsx, mobile/src/features/households/services/inviteApi.ts
- `household`: 805 mentions; sample files: mobile/src/common/repositories/__tests__/cacheAwareShoppingRepository.realtime.test.ts, mobile/src/common/repositories/cacheAwareShoppingRepository.ts, mobile/src/common/services/__tests__/catalogService.spec.ts, mobile/src/common/services/catalogService.ts, mobile/src/common/types/__tests__/dataModes.test.ts
- `subscription`: 64 mentions; sample files: mobile/src/common/hooks/__tests__/useCachedEntities.test.tsx, mobile/src/common/hooks/__tests__/useKeyboardHeight.test.ts, mobile/src/common/hooks/useKeyboardHeight.ts, mobile/src/common/hooks/useReducedMotion.ts, mobile/src/contexts/AppLifecycleContext.tsx
- `premium`: 310 mentions; sample files: mobile/src/contexts/AuthContext.tsx, mobile/src/features/auth/services/authApi.ts, mobile/src/features/auth/utils/__tests__/userVerification.test.ts, mobile/src/features/auth/utils/userVerification.ts, mobile/src/features/settings/components/PremiumDemoSection.tsx
- `sync`: 2939 mentions; sample files: mobile/src/__tests__/integration/guestNoSync.test.ts, mobile/src/common/components/OfflinePill/OfflinePill.tsx, mobile/src/common/components/ShareModal/ShareModal.tsx, mobile/src/common/components/SyncStatusIndicator/SyncStatusIndicator.tsx, mobile/src/common/components/SyncStatusIndicator/index.ts
- `offline`: 248 mentions; sample files: mobile/src/common/components/OfflineBanner.tsx, mobile/src/common/components/OfflinePill/OfflinePill.tsx, mobile/src/common/components/OfflinePill/index.ts, mobile/src/common/components/OfflinePill/styles.ts, mobile/src/common/components/OfflinePill/types.ts
- `guest`: 792 mentions; sample files: mobile/src/__tests__/integration/guestNoSync.test.ts, mobile/src/common/guards/__tests__/guestNoSyncGuardrails.test.ts, mobile/src/common/guards/guestNoSyncGuardrails.ts, mobile/src/common/hooks/useCatalog.ts, mobile/src/common/services/catalogService.ts