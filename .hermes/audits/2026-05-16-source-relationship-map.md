# KitchenHub Source Relationship Map

Generated: 2026-05-16T21:43:54

Purpose: supplemental source relationship map for documentation cleanup.

## Prisma schema
- Path: backend/src/infrastructure/database/prisma/schema.prisma
- Models: 22
  - Household
  - HouseholdSubscription
  - HouseholdEntitlementOverride
  - BillingProviderEvent
  - User
  - HouseholdInvite
  - RefreshToken
  - ShoppingList
  - ShoppingItem
  - HouseholdItemFrequency
  - MasterGroceryCatalog
  - CatalogItemI18n
  - CatalogItemAlias
  - CatalogTag
  - CatalogItemTag
  - CustomItem
  - Recipe
  - Chore
  - ImportBatch
  - ImportMapping
  - SyncIdempotencyKey
  - AuditLog

## Backend controllers
### backend/src/modules/auth/controllers/auth.controller.ts
- Class: AuthController
- Controller: { path: 'auth', version: '1' }
- Post 'google' -> authenticateGoogle()
- Post 'register' -> register()
- Post 'login' -> login()
- Get 'verify-email' -> verifyEmailGet()
- Post 'verify-email' -> verifyEmailPost()
- Post 'resend-verification' -> resendVerification()
- Post 'sync' -> syncData()
- Post 'refresh' -> refreshToken()
- Get 'me' -> getCurrentUser()
### backend/src/modules/auth/controllers/oauth.controller.ts
- Class: OAuthController
- Controller: { path: 'auth', version: '1' }
- Get 'google/start' -> startGoogleAuth()
- Get 'google/callback' -> handleGoogleCallback()
### backend/src/modules/chores/controllers/chores.controller.ts
- Class: ChoresController
- Controller: { path: 'chores', version: '1' }
- Get  -> getChores()
- Post  -> createChore()
- Patch ':id' -> updateChore()
- Patch ':id/status' -> toggleCompletion()
- Get 'stats' -> getStats()
- Delete ':id' -> deleteChore()
- Post ':id/restore' -> restoreChore()
### backend/src/modules/dashboard/controllers/dashboard.controller.ts
- Class: DashboardController
- Controller: { path: 'dashboard', version: '1' }
- Get 'summary' -> getSummary()
### backend/src/modules/health/controllers/client-links.controller.ts
- Class: ClientLinksController
- Controller: { path: 'client-links', version: '1' }
- Get  -> getClientLinks()
### backend/src/modules/health/controllers/deploy-info.controller.ts
- Class: DeployInfoController
- Controller: { path: 'deploy-info', version: '1' }
- Get  -> getDeployInfo()
### backend/src/modules/health/controllers/health.controller.ts
- Class: HealthController
- Controller: { path: 'health', version: '1' }
- Get  -> checkHealth()
- Get 'live' -> checkLiveness()
- Get 'ready' -> checkReadiness()
- Get 'detailed' -> checkDetailed()
### backend/src/modules/health/controllers/version.controller.ts
- Class: VersionController
- Controller: 'version'
- Get  -> getVersionInfo()
### backend/src/modules/households/controllers/households.controller.ts
- Class: HouseholdsController
- Controller: { path: 'household', version: '1' }
- Post  -> createHousehold()
- Get  -> getHousehold()
- Put  -> updateHousehold()
- Post 'invite' -> inviteMember()
- Delete 'members/:id' -> removeMember()
- Post 'join' -> joinHousehold()
### backend/src/modules/households/controllers/invite.controller.ts
- Class: InviteController
- Controller: { path: 'invite', version: '1' }
- Get 'validate' -> validateInviteCode()
### backend/src/modules/import/controllers/import.controller.ts
- Class: ImportController
- Controller: { path: 'import', version: '1' }
- Post  -> importData()
### backend/src/modules/premium-demo/controllers/premium-demo.controller.ts
- Class: PremiumDemoController
- Controller: { path: 'premium/demo', version: '1' }
- Get  -> getPremiumDemo()
### backend/src/modules/recipes/controllers/recipe-images.controller.ts
- Class: RecipeImagesController
- Controller: { path: 'recipes', version: '1' }
- Get 'images/search' -> searchImages()
- Post ':id/image' -> uploadImage()
### backend/src/modules/recipes/controllers/recipes.controller.ts
- Class: RecipesController
- Controller: { path: 'recipes', version: '1' }
- Get  -> getRecipes()
- Post  -> createRecipe()
- Get ':id' -> getRecipe()
- Put ':id' -> updateRecipe()
- Post ':id/cook' -> cookRecipe()
- Delete ':id' -> deleteRecipe()
### backend/src/modules/shopping/controllers/shopping.controller.ts
- Class: GroceriesController
- Controller: { path: 'groceries', version: '1' }
- Get 'search' -> searchGroceries()
- Get 'by-category' -> getGroceriesByCategory()
- Get 'categories' -> getCategories()
- Get 'names' -> getCatalogDisplayNames()
- Get  -> getLists()
- Get 'main' -> getMainList()
- Get 'aggregate' -> getShoppingData()
- Post  -> createList()
- Get ':id' -> getListDetails()
- Patch ':id' -> updateList()
- Delete ':id' -> deleteList()
- Post ':id/items' -> addItems()
- Get 'custom' -> getCustomItems()
- Get 'frequent' -> getFrequentItems()
- Patch ':id' -> updateItem()
- Delete ':id' -> deleteItem()
### backend/src/modules/subscriptions/controllers/subscription-reconciliation.controller.ts
- Class: SubscriptionReconciliationController
- Controller: { path: 'subscriptions/reconcile', version: '1' }
- Post ':provider' -> reconcileProviderState()
### backend/src/modules/subscriptions/controllers/subscription-support-overrides.controller.ts
- Class: SubscriptionSupportOverridesController
- Controller: { path: 'subscriptions/support', version: '1' }
- Post 'households/:householdId/premium-override' -> setPremiumOverride()
- Delete 'households/:householdId/premium-override' -> clearPremiumOverride()
### backend/src/modules/subscriptions/controllers/subscription-webhooks.controller.ts
- Class: SubscriptionWebhooksController
- Controller: { path: 'subscriptions/webhooks', version: '1' }
- Post ':provider' -> handleProviderWebhook()
### backend/src/modules/users/controllers/users.controller.ts
- Class: UsersController
- Controller: { path: 'users', version: '1' }
- Delete 'me' -> deleteAccount()
- Get 'me/export' -> exportData()

## Mobile contexts
- mobile/src/contexts/AppLifecycleContext.tsx
- mobile/src/contexts/AuthContext.tsx
- mobile/src/contexts/HouseholdContext.tsx
- mobile/src/contexts/LegalLinksContext.tsx
- mobile/src/contexts/NetworkContext.tsx
- mobile/src/features/auth/contexts/OnboardingContext.tsx

## Mobile hooks
- mobile/src/common/hooks/__tests__/useClickOutside.test.ts
- mobile/src/common/hooks/__tests__/useKeyboardHeight.test.ts
- mobile/src/common/hooks/__tests__/useSyncStatus.test.ts
- mobile/src/common/hooks/useCachedEntities.ts
- mobile/src/common/hooks/useCatalog.ts
- mobile/src/common/hooks/useClickOutside.ts
- mobile/src/common/hooks/useDebouncedRemoteSearch.ts
- mobile/src/common/hooks/useKeyboardHeight.ts
- mobile/src/common/hooks/useRecipeImage.ts
- mobile/src/common/hooks/useReducedMotion.ts
- mobile/src/common/hooks/useResponsive.ts
- mobile/src/common/hooks/useSyncQueue.ts
- mobile/src/common/hooks/useSyncStatus.ts
- mobile/src/features/auth/hooks/useOAuthSignIn.ts
- mobile/src/features/auth/utils/__tests__/userVerification.test.ts
- mobile/src/features/auth/utils/userVerification.ts
- mobile/src/features/dashboard/hooks/useDashboardChores.ts
- mobile/src/features/recipes/hooks/useRecipes.spec.ts
- mobile/src/features/recipes/hooks/useRecipes.ts
- mobile/src/features/shopping/hooks/__tests__/useShoppingRealtime.test.ts
- mobile/src/features/shopping/hooks/useShoppingRealtime.ts

## Mobile services
- mobile/src/common/services/__tests__/catalogService.spec.ts
- mobile/src/common/services/catalogService.ts
- mobile/src/features/chores/services/choresService.spec.ts
- mobile/src/features/chores/services/choresService.ts
- mobile/src/features/recipes/services/recipeImageSearchService.spec.ts
- mobile/src/features/recipes/services/recipeImageSearchService.ts
- mobile/src/features/recipes/services/recipeService.spec.ts
- mobile/src/features/recipes/services/recipeService.ts
- mobile/src/features/settings/services/__tests__/accountService.spec.ts
- mobile/src/features/settings/services/accountService.ts
- mobile/src/features/shopping/services/LocalShoppingService.spec.ts
- mobile/src/features/shopping/services/LocalShoppingService.ts
- mobile/src/features/shopping/services/RemoteShoppingService.ts
- mobile/src/features/shopping/services/__tests__/RemoteShoppingService.catalogIdentity.test.ts
- mobile/src/features/shopping/services/__tests__/RemoteShoppingService.mapItemToInputDto.test.ts
- mobile/src/features/shopping/services/__tests__/RemoteShoppingService.namePreservation.test.ts
- mobile/src/features/shopping/services/shoppingService.spec.ts
- mobile/src/features/shopping/services/shoppingService.ts
- mobile/src/features/subscription/services/__tests__/purchaseService.test.ts
- mobile/src/features/subscription/services/purchaseService.ts
- mobile/src/services/householdService.ts
- mobile/src/services/imageUploadService.spec.ts
- mobile/src/services/imageUploadService.ts
- mobile/src/services/import/importService.spec.ts
- mobile/src/services/import/importService.ts

## Backend guards/interceptors/filters
### backend_guards
- backend/src/common/guards/entitlement.guard.ts
- backend/src/common/guards/household.guard.ts
- backend/src/common/guards/jwt-auth.guard.ts
- backend/src/common/versioning/version.guard.ts
- backend/src/modules/recipes/guards/recipe-image-rate-limit.guard.ts
### backend_interceptors
- backend/src/common/interceptors/logging.interceptor.ts
- backend/src/common/interceptors/request-context.interceptor.ts
- backend/src/common/interceptors/transform.interceptor.ts
- backend/src/common/versioning/deprecation.interceptor.ts
### backend_filters
- backend/src/common/filters/http-exception.filter.ts
- backend/src/common/filters/sentry-exception.filter.ts
- backend/src/infrastructure/database/filters/soft-delete.filter.ts

## Backend services
- backend/src/common/logger/logger.service.ts
- backend/src/common/logger/structured-logger.service.ts
- backend/src/common/monitoring/sentry.service.ts
- backend/src/common/services/uuid.service.ts
- backend/src/infrastructure/cache/memory-cache.service.ts
- backend/src/infrastructure/database/prisma/prisma.service.ts
- backend/src/modules/audit/services/audit.service.ts
- backend/src/modules/auth/services/auth-cleanup.service.ts
- backend/src/modules/auth/services/auth.service.ts
- backend/src/modules/auth/services/email.service.ts
- backend/src/modules/auth/services/oauth-state.service.ts
- backend/src/modules/chores/services/chores.service.ts
- backend/src/modules/dashboard/services/dashboard.service.ts
- backend/src/modules/health/services/client-links.service.ts
- backend/src/modules/health/services/health.service.ts
- backend/src/modules/households/services/households.service.ts
- backend/src/modules/import/services/import.service.ts
- backend/src/modules/premium-demo/services/premium-demo.service.ts
- backend/src/modules/recipes/images/image-processing.service.ts
- backend/src/modules/recipes/services/recipe-image-rate-limit.service.ts
- backend/src/modules/recipes/services/recipe-image-search.service.ts
- backend/src/modules/recipes/services/recipe-images.service.ts
- backend/src/modules/recipes/services/recipes.service.ts
- backend/src/modules/shopping/services/shopping.service.ts
- backend/src/modules/storage/storage.service.ts
- backend/src/modules/subscriptions/providers/billing-provider-registry.service.ts
- backend/src/modules/subscriptions/providers/revenuecat-billing-provider.service.ts
- backend/src/modules/subscriptions/services/subscription-reconciliation.service.ts
- backend/src/modules/subscriptions/services/subscription-support-overrides.service.ts
- backend/src/modules/subscriptions/services/subscription-webhooks.service.ts
- backend/src/modules/subscriptions/services/subscriptions.service.ts
- backend/src/modules/supabase/supabase.service.ts
- backend/src/modules/users/services/users.service.ts