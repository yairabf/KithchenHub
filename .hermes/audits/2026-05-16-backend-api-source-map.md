# Backend API Source Map

Generated from backend source for documentation cleanup.

## Modules

- `audit`
- `auth`
- `chores`
- `dashboard`
- `health`
- `households`
- `import`
- `premium-demo`
- `recipes`
- `settings`
- `shopping`
- `storage`
- `subscriptions`
- `supabase`
- `users`

## Controllers and routes

- `GET /{ path: 'auth', version: '1' }/me` — `getCurrentUser` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/auth/controllers/auth.controller.ts`
- `GET /{ path: 'auth', version: '1' }/verify-email` — `verifyEmailGet` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/auth/controllers/auth.controller.ts`
- `POST /{ path: 'auth', version: '1' }/google` — `authenticateGoogle` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/auth/controllers/auth.controller.ts`
- `POST /{ path: 'auth', version: '1' }/login` — `login` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/auth/controllers/auth.controller.ts`
- `POST /{ path: 'auth', version: '1' }/refresh` — `refreshToken` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/auth/controllers/auth.controller.ts`
- `POST /{ path: 'auth', version: '1' }/register` — `register` (public)
  Source: `backend/src/modules/auth/controllers/auth.controller.ts`
- `POST /{ path: 'auth', version: '1' }/resend-verification` — `resendVerification` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/auth/controllers/auth.controller.ts`
- `POST /{ path: 'auth', version: '1' }/sync` — `syncData` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/auth/controllers/auth.controller.ts`
- `POST /{ path: 'auth', version: '1' }/verify-email` — `verifyEmailPost` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/auth/controllers/auth.controller.ts`
- `GET /{ path: 'auth', version: '1' }/google/callback` — `handleGoogleCallback` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/auth/controllers/oauth.controller.ts`
- `GET /{ path: 'auth', version: '1' }/google/start` — `startGoogleAuth` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/auth/controllers/oauth.controller.ts`
- `DELETE /{ path: 'chores', version: '1' }/:id` — `deleteChore` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/chores/controllers/chores.controller.ts`
- `GET /{ path: 'chores', version: '1' }` — `getChores` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/chores/controllers/chores.controller.ts`
- `GET /{ path: 'chores', version: '1' }/stats` — `getStats` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/chores/controllers/chores.controller.ts`
- `PATCH /{ path: 'chores', version: '1' }/:id` — `updateChore` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/chores/controllers/chores.controller.ts`
- `PATCH /{ path: 'chores', version: '1' }/:id/status` — `toggleCompletion` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/chores/controllers/chores.controller.ts`
- `POST /{ path: 'chores', version: '1' }` — `createChore` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/chores/controllers/chores.controller.ts`
- `POST /{ path: 'chores', version: '1' }/:id/restore` — `restoreChore` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/chores/controllers/chores.controller.ts`
- `GET /{ path: 'dashboard', version: '1' }/summary` — `getSummary` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/dashboard/controllers/dashboard.controller.ts`
- `GET /{ path: 'client-links', version: '1' }` — `getClientLinks` (public)
  Source: `backend/src/modules/health/controllers/client-links.controller.ts`
- `GET /{ path: 'deploy-info', version: '1' }` — `getDeployInfo` (public)
  Source: `backend/src/modules/health/controllers/deploy-info.controller.ts`
- `GET /{ path: 'health', version: '1' }` — `checkHealth` (public)
  Source: `backend/src/modules/health/controllers/health.controller.ts`
- `GET /{ path: 'health', version: '1' }/detailed` — `checkDetailed` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/health/controllers/health.controller.ts`
- `GET /{ path: 'health', version: '1' }/live` — `checkLiveness` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/health/controllers/health.controller.ts`
- `GET /{ path: 'health', version: '1' }/ready` — `checkReadiness` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/health/controllers/health.controller.ts`
- `GET /version` — `getVersionInfo` (public)
  Source: `backend/src/modules/health/controllers/version.controller.ts`
- `DELETE /{ path: 'household', version: '1' }/members/:id` — `removeMember` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/households/controllers/households.controller.ts`
- `GET /{ path: 'household', version: '1' }` — `getHousehold` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/households/controllers/households.controller.ts`
- `POST /{ path: 'household', version: '1' }` — `createHousehold` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/households/controllers/households.controller.ts`
- `POST /{ path: 'household', version: '1' }/invite` — `inviteMember` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/households/controllers/households.controller.ts`
- `POST /{ path: 'household', version: '1' }/join` — `joinHousehold` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/households/controllers/households.controller.ts`
- `PUT /{ path: 'household', version: '1' }` — `updateHousehold` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/households/controllers/households.controller.ts`
- `GET /{ path: 'invite', version: '1' }/validate` — `validateInviteCode` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/households/controllers/invite.controller.ts`
- `POST /{ path: 'import', version: '1' }` — `importData` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/import/controllers/import.controller.ts`
- `GET /{ path: 'premium/demo', version: '1' }` — `getPremiumDemo` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/premium-demo/controllers/premium-demo.controller.ts`
- `GET /{ path: 'recipes', version: '1' }/images/search` — `searchImages` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/recipes/controllers/recipe-images.controller.ts`
- `POST /{ path: 'recipes', version: '1' }/:id/image` — `uploadImage` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/recipes/controllers/recipe-images.controller.ts`
- `DELETE /{ path: 'recipes', version: '1' }/:id` — `deleteRecipe` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/recipes/controllers/recipes.controller.ts`
- `GET /{ path: 'recipes', version: '1' }` — `getRecipes` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/recipes/controllers/recipes.controller.ts`
- `GET /{ path: 'recipes', version: '1' }/:id` — `getRecipe` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/recipes/controllers/recipes.controller.ts`
- `POST /{ path: 'recipes', version: '1' }` — `createRecipe` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/recipes/controllers/recipes.controller.ts`
- `POST /{ path: 'recipes', version: '1' }/:id/cook` — `cookRecipe` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/recipes/controllers/recipes.controller.ts`
- `PUT /{ path: 'recipes', version: '1' }/:id` — `updateRecipe` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/recipes/controllers/recipes.controller.ts`
- `DELETE /{ path: 'groceries', version: '1' }/:id` — `deleteList` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `DELETE /{ path: 'groceries', version: '1' }/:id` — `deleteItem` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `GET /{ path: 'groceries', version: '1' }` — `getLists` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `GET /{ path: 'groceries', version: '1' }/:id` — `getListDetails` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `GET /{ path: 'groceries', version: '1' }/aggregate` — `getShoppingData` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `GET /{ path: 'groceries', version: '1' }/by-category` — `getGroceriesByCategory` (public)
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `GET /{ path: 'groceries', version: '1' }/categories` — `getCategories` (public)
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `GET /{ path: 'groceries', version: '1' }/custom` — `getCustomItems` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `GET /{ path: 'groceries', version: '1' }/frequent` — `getFrequentItems` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `GET /{ path: 'groceries', version: '1' }/main` — `getMainList` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `GET /{ path: 'groceries', version: '1' }/names` — `getCatalogDisplayNames` (public)
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `GET /{ path: 'groceries', version: '1' }/search` — `searchGroceries` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `PATCH /{ path: 'groceries', version: '1' }/:id` — `updateList` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `PATCH /{ path: 'groceries', version: '1' }/:id` — `updateItem` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `POST /{ path: 'groceries', version: '1' }` — `createList` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `POST /{ path: 'groceries', version: '1' }/:id/items` — `addItems` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `POST /{ path: 'subscriptions/reconcile', version: '1' }/:provider` — `reconcileProviderState` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/subscriptions/controllers/subscription-reconciliation.controller.ts`
- `DELETE /{ path: 'subscriptions/support', version: '1' }/households/:householdId/premium-override` — `clearPremiumOverride` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/subscriptions/controllers/subscription-support-overrides.controller.ts`
- `POST /{ path: 'subscriptions/support', version: '1' }/households/:householdId/premium-override` — `setPremiumOverride` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/subscriptions/controllers/subscription-support-overrides.controller.ts`
- `POST /{ path: 'subscriptions/webhooks', version: '1' }/:provider` — `handleProviderWebhook` (public)
  Source: `backend/src/modules/subscriptions/controllers/subscription-webhooks.controller.ts`
- `DELETE /{ path: 'users', version: '1' }/me` — `deleteAccount` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/users/controllers/users.controller.ts`
- `GET /{ path: 'users', version: '1' }/me/export` — `exportData` (auth/guarded unless controller-level decorator says otherwise)
  Source: `backend/src/modules/users/controllers/users.controller.ts`

## DTO classes

- `backend/src/modules/auth/dtos/auth-response.dto.ts`: PremiumStatusSummaryDto, UserResponseDto, HouseholdSummaryDto, AuthResponseDto
- `backend/src/modules/auth/dtos/google-auth.dto.ts`: GoogleAuthDto
- `backend/src/modules/auth/dtos/guest-auth.dto.ts`: GuestAuthDto
- `backend/src/modules/auth/dtos/login.dto.ts`: LoginDto
- `backend/src/modules/auth/dtos/refresh-token.dto.ts`: RefreshTokenDto
- `backend/src/modules/auth/dtos/register.dto.ts`: RegisterDto
- `backend/src/modules/auth/dtos/resend-verification.dto.ts`: ResendVerificationDto
- `backend/src/modules/auth/dtos/sync-data.dto.ts`: SyncShoppingItemDto, SyncShoppingListDto, SyncRecipeIngredientDto, SyncRecipeInstructionDto, SyncRecipeDto, SyncChoreDto, SyncDataDto
- `backend/src/modules/auth/dtos/user-creation-household.dto.ts`: UserCreationHouseholdDto
- `backend/src/modules/auth/dtos/verify-email.dto.ts`: VerifyEmailDto
- `backend/src/modules/chores/dtos/chore-list-response.dto.ts`: ChoreDto, ChoreListResponseDto
- `backend/src/modules/chores/dtos/chore-stats-response.dto.ts`: ChoreStatsDto
- `backend/src/modules/chores/dtos/create-chore.dto.ts`: CreateChoreDto
- `backend/src/modules/chores/dtos/toggle-completion.dto.ts`: ToggleCompletionDto
- `backend/src/modules/chores/dtos/update-chore.dto.ts`: UpdateChoreDto
- `backend/src/modules/dashboard/dtos/dashboard-summary-response.dto.ts`: RecentActivityDto, DashboardSummaryDto
- `backend/src/modules/households/dtos/create-household.dto.ts`: CreateHouseholdDto
- `backend/src/modules/households/dtos/household-response.dto.ts`: HouseholdMemberDto, HouseholdResponseDto
- `backend/src/modules/households/dtos/invite-member.dto.ts`: InviteMemberDto
- `backend/src/modules/households/dtos/join-household.dto.ts`: JoinHouseholdDto
- `backend/src/modules/households/dtos/update-household.dto.ts`: UpdateHouseholdDto
- `backend/src/modules/import/dto/import.dto.ts`: ImportRecipeDto, ImportShoppingListDto, ImportRequestDto, ImportResponseDto
- `backend/src/modules/recipes/dtos/cook-recipe.dto.ts`: CookRecipeDto
- `backend/src/modules/recipes/dtos/create-recipe.dto.ts`: IngredientInputDto, InstructionInputDto, CreateRecipeDto
- `backend/src/modules/recipes/dtos/recipe-detail-response.dto.ts`: RecipeIngredientDto, RecipeInstructionDto, RecipeDetailDto
- `backend/src/modules/recipes/dtos/recipe-list-response.dto.ts`: RecipeListItemDto
- `backend/src/modules/recipes/dtos/update-recipe.dto.ts`: UpdateRecipeDto
- `backend/src/modules/shopping/dtos/add-items.dto.ts`: ShoppingItemInputDto, AddItemsDto
- `backend/src/modules/shopping/dtos/catalog-display-name.dto.ts`: CatalogDisplayNameDto
- `backend/src/modules/shopping/dtos/create-list.dto.ts`: CreateListDto
- `backend/src/modules/shopping/dtos/frequent-items.dto.ts`: FrequentShoppingItemDto, FrequentShoppingItemsResponseDto
- `backend/src/modules/shopping/dtos/grocery-search-response.dto.ts`: GrocerySearchItemDto
- `backend/src/modules/shopping/dtos/shopping-list-response.dto.ts`: ShoppingListSummaryDto, ShoppingItemDto, ShoppingListDetailDto, ShoppingDataItemDto, ShoppingDataDto
- `backend/src/modules/shopping/dtos/update-item.dto.ts`: UpdateItemDto
- `backend/src/modules/shopping/dtos/update-list.dto.ts`: UpdateListDto
- `backend/src/modules/subscriptions/dtos/set-premium-override.dto.ts`: SetPremiumOverrideDto
- `backend/src/modules/users/dtos/delete-account.dto.ts`: DeleteAccountDto
- `backend/src/modules/users/dtos/user-export.dto.ts`: UserExportSummaryDto, HouseholdExportSummaryDto, ActivityExportSummaryDto, UserExportDto

## Prisma models

- `Household`
- `HouseholdSubscription`
- `HouseholdEntitlementOverride`
- `BillingProviderEvent`
- `User`
- `HouseholdInvite`
- `RefreshToken`
- `ShoppingList`
- `ShoppingItem`
- `HouseholdItemFrequency`
- `MasterGroceryCatalog`
- `CatalogItemI18n`
- `CatalogItemAlias`
- `CatalogTag`
- `CatalogItemTag`
- `CustomItem`
- `Recipe`
- `Chore`
- `ImportBatch`
- `ImportMapping`
- `SyncIdempotencyKey`
- `AuditLog`

## Prisma enums
