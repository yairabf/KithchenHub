# Catalog Usage Inventory - Plan

**Epic:** Architecture Cross-Cutting Foundations  
**Created:** January 25, 2026  
**Status:** Planning

## Overview

Complete inventory of all catalog (MasterGroceryCatalog) usage points across the codebase. This document identifies:
- All screens and components that consume catalog data
- All hooks and services that fetch catalog data
- Backend endpoints and services that provide catalog data
- Current implementation status
- Missing implementations and gaps

## Current Implementation Status

### Backend Implementation ✅

#### Database Schema
- **Location**: `backend/src/infrastructure/database/prisma/schema.prisma`
- **Model**: `MasterGroceryCatalog`
  - Fields: `id`, `name`, `category`, `defaultUnit`, `imageUrl`, `defaultQuantity`
  - Relations: `ShoppingItem.catalogItemId` → `MasterGroceryCatalog.id` (optional FK)
- **RLS Policy**: Read-only access (`FOR SELECT USING (true)`)
- **Seed Data**: 111 items migrated from mobile mock database

#### API Endpoints
- **Location**: `backend/src/modules/shopping/controllers/shopping.controller.ts`
- **Controller**: `GroceriesController`
  - `GET /groceries/search?q={query}` - Public endpoint, no auth required
  - `GET /groceries/categories` - Public endpoint, no auth required
- **Service Methods**: `ShoppingService`
  - `searchGroceries(query: string): Promise<GrocerySearchItemDto[]>`
  - `getCategories(): Promise<string[]>`
  - `getCatalogItemOrThrow(catalogItemId: string)` - Private helper
  - `buildItemData()` - Builds shopping item from catalog defaults

#### Shopping Item Integration
- **Location**: `backend/src/modules/shopping/dtos/add-items.dto.ts`
- **DTO**: `ShoppingItemInputDto`
  - `catalogItemId?: string` - New field
  - `masterItemId?: string` - Legacy field (backward compatibility)
  - Validation: Requires `name` if neither catalog ID is provided
- **Service Logic**: `ShoppingService.createItemFromInput()`
  - Accepts `catalogItemId` or `masterItemId`
  - Fetches catalog item and applies defaults (name, category, unit, quantity)
  - Falls back to custom input if no catalog ID provided

### Mobile Implementation Status

#### Catalog Data Fetching

**1. RemoteShoppingService** ✅
- **Location**: `mobile/src/features/shopping/services/RemoteShoppingService.ts`
- **Method**: `getGroceryItems(): Promise<GroceryItem[]>`
  - Calls: `api.get<GrocerySearchItemDto[]>('/groceries/search?q=')`
  - Maps DTO to `GroceryItem` format
  - Used by: `getShoppingData()` method
- **Status**: ✅ Implemented for signed-in users

**2. CacheAwareShoppingRepository** ✅
- **Location**: `mobile/src/common/repositories/cacheAwareShoppingRepository.ts`
- **Method**: `getGroceryItems(): Promise<GroceryItem[]>`
  - Calls: `api.get<GrocerySearchItemDto[]>('/groceries/search?q=')`
  - Returns empty array on network errors (graceful degradation)
  - **Note**: Catalog data is NOT cached (always fetched fresh)
- **Status**: ✅ Implemented for signed-in users

**3. LocalShoppingService** ⚠️
- **Location**: `mobile/src/features/shopping/services/LocalShoppingService.ts`
- **Method**: `getShoppingData()`
  - Uses: `mockGroceriesDB` from `mobile/src/data/groceryDatabase.ts`
  - **Status**: ⚠️ Uses mock data instead of API (guest mode fallback)

**4. Direct API Calls** ⚠️
- **Location**: `mobile/src/features/recipes/screens/RecipesScreen.tsx` (line 167)
- **Code**: `api.get<GrocerySearchItemDto[]>('/groceries/search?q=')`
- **Context**: Guest user fallback when repository unavailable
- **Status**: ⚠️ Inline API call (should use shared helper)

#### Catalog Data Consumption

**Screens:**

1. **ShoppingListsScreen** ✅
   - **Location**: `mobile/src/features/shopping/screens/ShoppingListsScreen.tsx`
   - **Catalog Usage**:
     - `groceryItems` state - All catalog items for search
     - `categories` state - Categories built from catalog items
     - `frequentlyAddedItems` state - First 8 catalog items
   - **Data Source**:
     - Signed-in: `repository.getShoppingData()` (line 134, 172)
     - Guest: `shoppingService.getShoppingData()` (line 148)
   - **Components Using Catalog**:
     - `GrocerySearchBar` - Receives `groceryItems` prop
     - `CategoriesGrid` - Receives `categories` prop
     - `FrequentlyAddedGrid` - Receives `frequentlyAddedItems` prop
   - **Status**: ✅ Implemented

2. **RecipesScreen** ⚠️
   - **Location**: `mobile/src/features/recipes/screens/RecipesScreen.tsx`
   - **Catalog Usage**:
     - `groceryItems` state - For recipe ingredient selection
   - **Data Source**:
     - Signed-in: `repository.getShoppingData()` (line 151)
     - Guest: Direct API call `api.get('/groceries/search?q=')` (line 167)
     - Fallback: `mockGroceriesDB` on network error (line 160, 188)
   - **Status**: ⚠️ Inconsistent pattern (direct API call for guest, should use service)

**Components:**

1. **GrocerySearchBar** ✅
   - **Location**: `mobile/src/features/shopping/components/GrocerySearchBar/GrocerySearchBar.tsx`
   - **Props**: `items: GroceryItem[]` - Catalog items to search
   - **Functionality**:
     - Real-time search filtering (name and category)
     - Dropdown results (max 8 items)
     - Custom item creation (optional)
     - Quick-add buttons
   - **Status**: ✅ Fully implemented

2. **CategoriesGrid** ✅
   - **Location**: `mobile/src/features/shopping/components/CategoriesGrid/CategoriesGrid.tsx`
   - **Props**: `categories: Category[]` - Categories built from catalog
   - **Functionality**: Visual grid of category tiles with item counts
   - **Status**: ✅ Fully implemented

3. **CategoryModal** ✅
   - **Location**: `mobile/src/features/shopping/components/CategoryModal/CategoryModal.tsx`
   - **Props**: `items: GroceryItem[]` - Filtered catalog items for category
   - **Functionality**: Side panel modal showing all items in a category
   - **Status**: ✅ Fully implemented

4. **AllItemsModal** ✅
   - **Location**: `mobile/src/features/shopping/components/AllItemsModal/AllItemsModal.tsx`
   - **Props**: `items: GroceryItem[]` - All catalog items
   - **Functionality**:
     - Search bar for filtering
     - Category grouping with expand/collapse
     - Shows all 111 catalog items
   - **Status**: ✅ Fully implemented

5. **FrequentlyAddedGrid** ✅
   - **Location**: `mobile/src/features/shopping/components/FrequentlyAddedGrid/FrequentlyAddedGrid.tsx`
   - **Props**: `items: GroceryItem[]` - First 8 catalog items
   - **Functionality**: Quick-access grid for rapid item addition
   - **Status**: ✅ Fully implemented

#### Catalog Data Transformation

**Category Building:**
- **Location**: 
  - `mobile/src/features/shopping/services/RemoteShoppingService.ts` (line 57)
  - `mobile/src/common/repositories/cacheAwareShoppingRepository.ts` (line 107)
- **Function**: `buildCategoriesFromGroceries(items: GroceryItem[]): Category[]`
- **Logic**: Groups items by category, generates deterministic UUIDs, assigns pastel colors
- **Status**: ✅ Implemented (duplicated in two places)

**Frequently Added Items:**
- **Location**: Same as above
- **Function**: `buildFrequentlyAddedItems(items: GroceryItem[]): GroceryItem[]`
- **Logic**: Returns first 8 items from catalog
- **Status**: ✅ Implemented (duplicated in two places)

#### Hooks

**No Dedicated Catalog Hooks** ❌
- **Status**: ❌ Missing
- **Current Pattern**: Catalog data fetched directly in screens/services via:
  - `repository.getShoppingData()` (signed-in)
  - `shoppingService.getShoppingData()` (guest)
  - Direct API calls (RecipesScreen guest fallback)
- **Issue**: No reusable hook for catalog data fetching
- **Impact**: Code duplication, inconsistent error handling, no loading states

#### Catalog Caching

**No Catalog Cache** ⚠️
- **Status**: ⚠️ Not implemented
- **Current Behavior**: Catalog always fetched fresh from API
- **Expected Behavior** (per DATA_MODES_SPEC.md):
  - Primary: Backend API (`/groceries/*` endpoints)
  - Fallback: Local cache (`@kitchen_hub_catalog_cache`)
- **Storage Key**: `@kitchen_hub_catalog_cache` (defined in `dataModeStorage.ts` but not used)
- **Issue**: No fallback cache for offline scenarios

## Missing Implementations

### 1. Catalog Hook ❌

**Missing**: Reusable React hook for catalog data fetching

**Requirements**:
- Fetch grocery items from API
- Fallback to cache on network error
- Fallback to mock data if cache empty
- Loading and error states
- Works for both guest and signed-in users
- Handles categories and frequently added items transformation

**Suggested Implementation**:
```typescript
// mobile/src/common/hooks/useCatalog.ts
export function useCatalog() {
  return {
    groceryItems: GroceryItem[];
    categories: Category[];
    frequentlyAddedItems: GroceryItem[];
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
  };
}
```

### 2. Catalog Cache Implementation ❌

**Missing**: Local cache for catalog data with fallback strategy

**Requirements**:
- Cache catalog data in AsyncStorage (`@kitchen_hub_catalog_cache`)
- Cache categories separately (`@kitchen_hub_catalog_categories`)
- Fallback strategy: API → Cache → Mock data
- Cache invalidation strategy (TTL or manual refresh)
- Works for both guest and signed-in users

**Suggested Implementation**:
```typescript
// mobile/src/common/services/catalogService.ts
export class CatalogService {
  async getGroceryItems(): Promise<GroceryItem[]> {
    // Try API first
    try {
      const items = await api.get('/groceries/search?q=');
      await this.cacheGroceryItems(items);
      return items;
    } catch (error) {
      // Fallback to cache
      const cached = await this.getCachedGroceryItems();
      if (cached.length > 0) return cached;
      // Fallback to mock
      return mockGroceriesDB;
    }
  }
}
```

### 3. Normalized API + Fallback Pattern ⚠️

**Missing**: Shared helper for catalog API calls with fallback

**Current Issues**:
- Direct API calls in `RecipesScreen` (line 167)
- Different error handling patterns across services
- No consistent fallback strategy

**Suggested Implementation**:
```typescript
// mobile/src/common/utils/catalogApi.ts
export async function fetchCatalogWithFallback<T>(
  apiCall: () => Promise<T>,
  cacheKey: string,
  fallback: T
): Promise<T> {
  try {
    const data = await apiCall();
    await cacheCatalogData(cacheKey, data);
    return data;
  } catch (error) {
    if (error instanceof NetworkError) {
      const cached = await getCachedCatalogData<T>(cacheKey);
      return cached ?? fallback;
    }
    throw error;
  }
}
```

### 4. Categories API Endpoint Usage ❌

**Missing**: Usage of `/groceries/categories` endpoint

**Current Behavior**: Categories built client-side from grocery items
- `buildCategoriesFromGroceries()` groups items by category
- Generates deterministic UUIDs
- Assigns pastel colors

**Backend Endpoint**: `GET /groceries/categories` exists but unused

**Options**:
1. **Keep client-side building** (current) - More flexible, includes item counts
2. **Use backend endpoint** - Simpler, but loses item counts and visual metadata
3. **Hybrid** - Use backend for category list, build metadata client-side

**Recommendation**: Keep client-side building (more flexible for UI needs)

### 5. Catalog Item ID Usage in Mobile ❌

**Missing**: Mobile app doesn't send `catalogItemId` when creating shopping items

**Backend Support**: ✅
- `ShoppingItemInputDto` accepts `catalogItemId`
- Service applies catalog defaults when ID provided

**Mobile Support**: ❌
- Shopping items created with only `name`, `quantity`, `unit`, `category`
- No `catalogItemId` sent to backend
- Missing opportunity for:
  - Automatic default quantity/unit from catalog
  - Catalog item tracking/analytics
  - Future features (price tracking, nutritional info)

**Impact**: Low (app works without it, but loses catalog integration benefits)

## Complete Catalog Usage Inventory

### Backend Files

1. **Schema**: `backend/src/infrastructure/database/prisma/schema.prisma`
   - `MasterGroceryCatalog` model (line 102)
   - `ShoppingItem.catalogItemId` FK (line 83, 94)

2. **Controller**: `backend/src/modules/shopping/controllers/shopping.controller.ts`
   - `GroceriesController` (line 23)
   - `GET /groceries/search` (line 27)
   - `GET /groceries/categories` (line 33)

3. **Service**: `backend/src/modules/shopping/services/shopping.service.ts`
   - `searchGroceries()` (line 101)
   - `getCategories()` (line 127)
   - `getCatalogItemOrThrow()` (line 44)
   - `buildItemData()` (line 64)
   - `createItemFromInput()` (line 361)

4. **DTOs**:
   - `backend/src/modules/shopping/dtos/grocery-search-response.dto.ts`
   - `backend/src/modules/shopping/dtos/add-items.dto.ts` (line 16, 20)

5. **Repository**: `backend/src/modules/shopping/repositories/shopping.repository.ts`
   - `createItem()` accepts `catalogItemId` (line 92, 103)

### Mobile Files

#### Services

1. **RemoteShoppingService**: `mobile/src/features/shopping/services/RemoteShoppingService.ts`
   - `getGroceryItems()` (line 308)
   - `buildCategoriesFromGroceries()` (line 57)
   - `buildFrequentlyAddedItems()` (line 82)

2. **CacheAwareShoppingRepository**: `mobile/src/common/repositories/cacheAwareShoppingRepository.ts`
   - `getGroceryItems()` (line 223)
   - `buildCategoriesFromGroceries()` (line 107)
   - `getShoppingData()` uses catalog (line 704)

3. **LocalShoppingService**: `mobile/src/features/shopping/services/LocalShoppingService.ts`
   - Uses `mockGroceriesDB` (line 34)

#### Screens

1. **ShoppingListsScreen**: `mobile/src/features/shopping/screens/ShoppingListsScreen.tsx`
   - State: `groceryItems`, `categories`, `frequentlyAddedItems` (line 68-70)
   - Data loading: Lines 132-182
   - Component usage: Lines 772-775

2. **RecipesScreen**: `mobile/src/features/recipes/screens/RecipesScreen.tsx`
   - State: `groceryItems` (line 120)
   - Data loading: Lines 142-203
   - Direct API call: Line 167

#### Components

1. **GrocerySearchBar**: `mobile/src/features/shopping/components/GrocerySearchBar/GrocerySearchBar.tsx`
   - Props: `items: GroceryItem[]` (line 16)
   - Search logic: Lines 46-55

2. **CategoriesGrid**: `mobile/src/features/shopping/components/CategoriesGrid/CategoriesGrid.tsx`
   - Props: `categories: Category[]` (line 11)

3. **CategoryModal**: `mobile/src/features/shopping/components/CategoryModal/CategoryModal.tsx`
   - Props: `items: GroceryItem[]` (line 20)

4. **AllItemsModal**: `mobile/src/features/shopping/components/AllItemsModal/AllItemsModal.tsx`
   - Props: `items: GroceryItem[]` (line 20)
   - Grouping: Lines 43-52

5. **FrequentlyAddedGrid**: `mobile/src/features/shopping/components/FrequentlyAddedGrid/FrequentlyAddedGrid.tsx`
   - Props: `items: GroceryItem[]`

#### Data Files

1. **Mock Database**: `mobile/src/data/groceryDatabase.ts`
   - `mockGroceriesDB` - 111 items (line 5)

#### Types

1. **GroceryItem**: `mobile/src/features/shopping/components/GrocerySearchBar/types.ts`
   - Used throughout for catalog item representation

2. **Category**: `mobile/src/mocks/shopping/index.ts`
   - Used for category representation

## Summary

### ✅ Implemented

- Backend catalog API (search, categories)
- Database schema with RLS policies
- Shopping item catalog reference (backend)
- Mobile catalog consumption in shopping screens
- Catalog components (search bar, categories, modals)
- Category and frequently added items transformation

### ⚠️ Partially Implemented

- Guest mode catalog access (uses mock data, should use API)
- Catalog error handling (inconsistent patterns)
- Catalog caching (storage key defined but not used)

### ❌ Missing

- Reusable catalog hook (`useCatalog`)
- Catalog cache implementation with fallback
- Normalized API + fallback helper
- Mobile app sending `catalogItemId` when creating items
- Usage of `/groceries/categories` endpoint (optional)

## Catalog Data Usage Shapes

### Data Structure Expectations

**Grocery Items:**
- **Format**: Flat array (`GroceryItem[]`)
- **Structure**: 
  ```typescript
  interface GroceryItem {
    id: string;
    name: string;
    image: string;
    category: string;
    defaultQuantity: number;
  }
  ```
- **Usage Pattern**: Components receive flat arrays and perform their own filtering/grouping
  - `GrocerySearchBar`: Filters by name/category in real-time
  - `AllItemsModal`: Groups by category internally (`Record<string, GroceryItem[]>`)
  - `CategoryModal`: Receives pre-filtered items for specific category
  - `FrequentlyAddedGrid`: Receives first 8 items (already filtered)

**Categories:**
- **Format**: Separate array (`Category[]`)
- **Structure**:
  ```typescript
  interface Category {
    id: string;
    localId: string;  // Deterministic UUID
    name: string;
    itemCount: number;
    image: string;
    backgroundColor: string;
  }
  ```
- **Source**: Built from grocery items using `buildCategoriesFromGroceries()`
- **Usage**: `CategoriesGrid` displays category tiles with metadata

**Frequently Added Items:**
- **Format**: Flat array (`GroceryItem[]`)
- **Source**: First 8 items from catalog (`items.slice(0, 8)`)
- **Usage**: `FrequentlyAddedGrid` for quick access

### Data Separation

**Catalog Items vs Shopping Items:**
- **Separate, not merged**: Catalog items (reference data) and shopping items (user data) are kept separate
- **Lookup pattern**: Shopping items reference catalog items by matching name
  - Example: `findMatchingGrocery(groceryItems, item.name)` in `shoppingRealtime.ts`
  - Used to enrich shopping items with catalog metadata (image, category)
- **No merging**: No combined array of catalog + shopping items
- **Catalog is read-only**: Catalog items are never modified, only referenced

### Service Return Shape

**Current Pattern:**
```typescript
interface ShoppingData {
  shoppingLists: ShoppingList[];
  shoppingItems: ShoppingItem[];
  categories: Category[];           // Built from catalog
  groceryItems: GroceryItem[];       // Flat array from API
  frequentlyAddedItems: GroceryItem[]; // First 8 from catalog
}
```

**All arrays are flat** - No pre-grouping or merging at service level.

### Component Expectations

1. **GrocerySearchBar**: Expects flat `GroceryItem[]`, filters internally
2. **CategoriesGrid**: Expects `Category[]` with metadata
3. **CategoryModal**: Expects pre-filtered `GroceryItem[]` for one category
4. **AllItemsModal**: Expects flat `GroceryItem[]`, groups by category internally
5. **FrequentlyAddedGrid**: Expects flat `GroceryItem[]` (first 8 items)

### Implications for Refactoring

**If introducing caching/normalization:**
- ✅ Keep flat array format - components expect this
- ✅ Keep categories separate - don't merge into grocery items
- ✅ Keep catalog and shopping items separate - current pattern is correct
- ✅ Cache can store flat arrays - no need for grouped format
- ⚠️ Consider caching categories separately - they're derived but expensive to rebuild

## Next Steps

### Implementation Todos

1. **Search catalog usage**
   - Search codebase for all references to catalog APIs (`/groceries/search`, `/groceries/categories`)
   - Identify all constants and type definitions related to catalog
   - Document API call patterns and error handling approaches

2. **Document mobile consumers**
   - Document all mobile screens that use catalog data (ShoppingListsScreen, RecipesScreen)
   - Document all hooks that fetch or transform catalog data (none currently)
   - Document all services that fetch catalog (RemoteShoppingService, CacheAwareShoppingRepository, LocalShoppingService)
   - Document all components that consume catalog (GrocerySearchBar, CategoriesGrid, CategoryModal, AllItemsModal, FrequentlyAddedGrid)

3. **Document backend consumers**
   - Document backend services that provide catalog (ShoppingService.searchGroceries, getCategories)
   - Document backend endpoints (GroceriesController)
   - Document database schema and RLS policies
   - Document DTOs and validation rules

4. **Create catalog hook**
   - Centralize catalog data fetching with loading/error states
   - Implement fallback: API → Cache → Mock
   - Return flat arrays matching current component expectations
   - Transform to categories and frequently added items

5. **Implement catalog cache**
   - Add local cache for grocery items (`@kitchen_hub_catalog_cache`)
   - Add local cache for categories (`@kitchen_hub_catalog_categories`)
   - Implement cache invalidation strategy (TTL or manual refresh)
   - Ensure cache stores flat arrays (not grouped)

6. **Normalize API pattern**
   - Create shared helper for catalog API calls with fallback
   - Replace direct API calls in RecipesScreen
   - Standardize error handling across all catalog consumers

7. **Update guest mode**
   - Replace mock data usage with API calls (with fallback)
   - Ensure guest users can access public catalog endpoints
   - Maintain offline fallback to mock data

8. **Add catalogItemId support** (optional enhancement)
   - Send `catalogItemId` when creating shopping items from catalog
   - Enable automatic default quantity/unit from catalog
   - Track catalog item usage for analytics
