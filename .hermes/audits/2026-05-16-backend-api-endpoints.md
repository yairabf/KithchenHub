# Backend API Endpoint Inventory

Generated from controller decorators; use as a cleanup aid, not a replacement for Swagger/source review.

## Endpoints
- `POST /api/v1/auth/google` — Public; `authenticateGoogle`
  Source: `backend/src/modules/auth/controllers/auth.controller.ts`
- `GET /api/v1/auth/google/callback` — Public; `handleGoogleCallback`
  Source: `backend/src/modules/auth/controllers/oauth.controller.ts`
- `GET /api/v1/auth/google/start` — Public; `startGoogleAuth`
  Source: `backend/src/modules/auth/controllers/oauth.controller.ts`
- `POST /api/v1/auth/login` — Public; `login`
  Source: `backend/src/modules/auth/controllers/auth.controller.ts`
- `GET /api/v1/auth/me` — Protected; `getCurrentUser`
  Source: `backend/src/modules/auth/controllers/auth.controller.ts`
- `POST /api/v1/auth/refresh` — Public; `refreshToken`
  Source: `backend/src/modules/auth/controllers/auth.controller.ts`
- `POST /api/v1/auth/register` — Public; `register`
  Source: `backend/src/modules/auth/controllers/auth.controller.ts`
- `POST /api/v1/auth/resend-verification` — Public; `resendVerification`
  Source: `backend/src/modules/auth/controllers/auth.controller.ts`
- `POST /api/v1/auth/sync` — Protected; `syncData`
  Source: `backend/src/modules/auth/controllers/auth.controller.ts`
- `GET /api/v1/auth/verify-email` — Public; `verifyEmailGet`
  Source: `backend/src/modules/auth/controllers/auth.controller.ts`
- `POST /api/v1/auth/verify-email` — Public; `verifyEmailPost`
  Source: `backend/src/modules/auth/controllers/auth.controller.ts`
- `GET /api/v1/chores` — Protected; `getChores`
  Source: `backend/src/modules/chores/controllers/chores.controller.ts`
- `POST /api/v1/chores` — Protected; `createChore`
  Source: `backend/src/modules/chores/controllers/chores.controller.ts`
- `DELETE /api/v1/chores/:id` — Protected; `deleteChore`
  Source: `backend/src/modules/chores/controllers/chores.controller.ts`
- `PATCH /api/v1/chores/:id` — Protected; `updateChore`
  Source: `backend/src/modules/chores/controllers/chores.controller.ts`
- `POST /api/v1/chores/:id/restore` — Protected; `restoreChore`
  Source: `backend/src/modules/chores/controllers/chores.controller.ts`
- `PATCH /api/v1/chores/:id/status` — Protected; `toggleCompletion`
  Source: `backend/src/modules/chores/controllers/chores.controller.ts`
- `GET /api/v1/chores/stats` — Protected; `getStats`
  Source: `backend/src/modules/chores/controllers/chores.controller.ts`
- `GET /api/v1/dashboard/summary` — Protected; `getSummary`
  Source: `backend/src/modules/dashboard/controllers/dashboard.controller.ts`
- `GET /api/v1/groceries/by-category` — Public; `getGroceriesByCategory`
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `GET /api/v1/groceries/categories` — Public; `getCategories`
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `GET /api/v1/groceries/names` — Public; `getCatalogDisplayNames`
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `GET /api/v1/groceries/search` — Public; `searchGroceries`
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `GET /api/v1/health` — Public; `checkHealth`
  Source: `backend/src/modules/health/controllers/health.controller.ts`
- `GET /api/v1/health/detailed` — Public; `checkDetailed`
  Source: `backend/src/modules/health/controllers/health.controller.ts`
- `GET /api/v1/health/live` — Public; `checkLiveness`
  Source: `backend/src/modules/health/controllers/health.controller.ts`
- `GET /api/v1/health/ready` — Public; `checkReadiness`
  Source: `backend/src/modules/health/controllers/health.controller.ts`
- `GET /api/v1/household` — Protected; `getHousehold`
  Source: `backend/src/modules/households/controllers/households.controller.ts`
- `POST /api/v1/household` — Protected; `createHousehold`
  Source: `backend/src/modules/households/controllers/households.controller.ts`
- `PUT /api/v1/household` — Protected; `updateHousehold`
  Source: `backend/src/modules/households/controllers/households.controller.ts`
- `POST /api/v1/household/invite` — Protected; `inviteMember`
  Source: `backend/src/modules/households/controllers/households.controller.ts`
- `POST /api/v1/household/join` — Protected; `joinHousehold`
  Source: `backend/src/modules/households/controllers/households.controller.ts`
- `DELETE /api/v1/household/members/:id` — Protected; `removeMember`
  Source: `backend/src/modules/households/controllers/households.controller.ts`
- `POST /api/v1/import` — Protected; `importData`
  Source: `backend/src/modules/import/controllers/import.controller.ts`
- `GET /api/v1/invite/validate` — Public; `validateInviteCode`
  Source: `backend/src/modules/households/controllers/invite.controller.ts`
- `GET /api/v1/recipes` — Protected; `getRecipes`
  Source: `backend/src/modules/recipes/controllers/recipes.controller.ts`
- `POST /api/v1/recipes` — Protected; `createRecipe`
  Source: `backend/src/modules/recipes/controllers/recipes.controller.ts`
- `DELETE /api/v1/recipes/:id` — Protected; `deleteRecipe`
  Source: `backend/src/modules/recipes/controllers/recipes.controller.ts`
- `GET /api/v1/recipes/:id` — Protected; `getRecipe`
  Source: `backend/src/modules/recipes/controllers/recipes.controller.ts`
- `PUT /api/v1/recipes/:id` — Protected; `updateRecipe`
  Source: `backend/src/modules/recipes/controllers/recipes.controller.ts`
- `POST /api/v1/recipes/:id/cook` — Protected; `cookRecipe`
  Source: `backend/src/modules/recipes/controllers/recipes.controller.ts`
- `POST /api/v1/recipes/:id/image` — Protected; `uploadImage`
  Source: `backend/src/modules/recipes/controllers/recipe-images.controller.ts`
- `GET /api/v1/recipes/images/search` — Protected; `searchImages`
  Source: `backend/src/modules/recipes/controllers/recipe-images.controller.ts`
- `DELETE /api/v1/shopping-items/:id` — Protected; `deleteItem`
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `PATCH /api/v1/shopping-items/:id` — Protected; `updateItem`
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `GET /api/v1/shopping-items/custom` — Protected; `getCustomItems`
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `GET /api/v1/shopping-items/frequent` — Protected; `getFrequentItems`
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `GET /api/v1/shopping-lists` — Protected; `getLists`
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `POST /api/v1/shopping-lists` — Protected; `createList`
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `DELETE /api/v1/shopping-lists/:id` — Protected; `deleteList`
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `GET /api/v1/shopping-lists/:id` — Protected; `getListDetails`
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `PATCH /api/v1/shopping-lists/:id` — Protected; `updateList`
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `POST /api/v1/shopping-lists/:id/items` — Protected; `addItems`
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `GET /api/v1/shopping-lists/aggregate` — Protected; `getShoppingData`
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `GET /api/v1/shopping-lists/main` — Protected; `getMainList`
  Source: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- `DELETE /api/v1/users/me` — Protected; `deleteAccount`
  Source: `backend/src/modules/users/controllers/users.controller.ts`
- `GET /api/v1/users/me/export` — Protected; `exportData`
  Source: `backend/src/modules/users/controllers/users.controller.ts`