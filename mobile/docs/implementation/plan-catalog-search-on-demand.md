# Plan: Catalog Search On-Demand (No Full Load on Login)

**Created:** 2025-02-08  
**Status:** Planning  
**Goal:** Stop calling `GET /groceries/search?q=` on app/screen load. Call the search API only when the user actually types in a search bar, to avoid huge responses (e.g. 50k items) and reduce bandwidth/memory.

---

## 1. Current State

### 1.1 What happens today
- **On mount:** `useCatalog()` runs and calls `catalogService.getCatalogData()` → `getGroceryItems()` → **`GET /groceries/search?q=`** (empty query).
- Backend `searchGroceries('')` runs a `findMany` with no `where` filter → returns **all** rows in `masterGroceryCatalog` (e.g. 50k items).
- **Search bar:** `GrocerySearchBar` receives the full `items` array and **filters in memory** by `searchQuery`. No API call on keystroke.

### 1.2 Where catalog is used
| Consumer | Uses | Notes |
|----------|------|--------|
| **DashboardScreen** | `groceryItems`, `frequentlyAddedItems` | Suggested items (first 8), GrocerySearchBar |
| **ShoppingListsScreen** | `groceryItems`, `categories`, `frequentlyAddedItems` | Categories grid, search bar, quick add |
| **RecipesScreen** | `groceryItems` | GrocerySearchBar for ingredient picker |
| **ShoppingListPanel** | `groceryItems` | Search/autocomplete |
| **ShoppingQuickActionModal** | `groceryItems` | Via `shoppingService.getShoppingData()` → includes catalog |
| **AddRecipeModal** | `groceryItems` (optional) | Ingredient picker |

### 1.3 Backend today
- **GET /groceries/search?q=** – returns all matching items; empty `q` → no filter → full table.
- **GET /groceries/categories** – returns unique category **names** (string[]). Lightweight, no full catalog.

---

## 2. Target Behavior

- **Initial load:** Do **not** call `GET /groceries/search?q=`. Load only lightweight data needed for first paint (categories, optionally a small “frequently added” set or empty).
- **Search:** When the user types in any grocery search bar, call **`GET /groceries/search?q=<trimmed query>`** (with debounce). Use the response as the suggestion list for that search bar.
- **Categories:** Load on mount via **GET /groceries/categories** and build UI category list from it (no full catalog required).
- **Frequently added:** Either empty on first load, or from a small cached set / future endpoint; not from a full catalog fetch.

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  On app/screen mount                                             │
│  • useCatalog() / catalogService                                  │
│    - GET /groceries/categories  (lightweight)                     │
│    - groceryItems = []  (or from last search cache, see below)    │
│    - frequentlyAddedItems = [] or small cached set               │
│  • No GET /groceries/search?q=                                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  When user types in GrocerySearchBar (debounced, e.g. 300ms)     │
│  • If query.trim() === '' → show no results / clear suggestions   │
│  • If query.trim() !== ''                                         │
│    - GET /groceries/search?q=<encoded query>                      │
│    - Use response as items for dropdown                           │
│    - Optional: cache last search result per screen for back-navigation │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Implementation Steps

### 4.1 Backend (optional but recommended)

**Goal:** Make empty search safe and explicit.

| Step | Action |
|------|--------|
| B1 | In `ShoppingService.searchGroceries(query)`: if `searchTerm === ''`, return `[]` (or require `q` and return 400). Do not run `findMany` with no filter. |
| B2 | (Optional) Add a reasonable `take` limit (e.g. 50) for search results to cap response size even for broad queries. |

**Files:** `backend/src/modules/shopping/services/shopping.service.ts`, controller if you add validation.

---

### 4.2 Catalog service (mobile)

**Goal:** No full-catalog fetch on load; add explicit search-by-query.

| Step | Action |
|------|--------|
| C1 | Add `searchGroceries(query: string): Promise<GroceryItem[]>` that calls **`GET /groceries/search?q=${encodeURIComponent(query.trim())}`** only when `query.trim() !== ''`. On empty string return `[]`. Use existing `mapGroceryItem`, merge with custom items if desired (and cache custom items as today). |
| C2 | Add `getCategoriesOnly(): Promise<Category[]>` (or equivalent) that calls **GET /groceries/categories** and maps the string[] to the app’s `Category[]` shape (id, localId, name, itemCount: 0, etc.) so UI does not need full grocery list for categories. |
| C3 | Change `getGroceryItems()` so it **does not** call the search API. Options: (a) Return `[]` when no query; or (b) remove/repurpose it for “initial load” and have it only return cached custom items + categories from getCategoriesOnly. Prefer (a) for clarity: “full list” is no longer supported on load. |
| C4 | Update `getCatalogData()` for initial load: call only `getCategoriesOnly()` (or GET /groceries/categories), set `groceryItems: []`, `frequentlyAddedItems: []` (or from cache if you add it). No call to search with empty `q`. |
| C5 | Keep custom items flow: still call **GET /shopping-items/custom** for signed-in users and merge into search results when appropriate (e.g. in `searchGroceries` or in the hook that drives the search bar). |

**Files:** `mobile/src/common/services/catalogService.ts`, `mobile/src/common/utils/catalogUtils.ts` (if you add a “categories from names only” builder).

---

### 4.3 useCatalog hook (mobile)

**Goal:** Initial load uses only categories (and optional frequently-added); no full catalog.

| Step | Action |
|------|--------|
| H1 | Change `loadCatalogData()` so it fetches only what’s needed for first paint: categories (via new catalog method that uses GET /groceries/categories), empty (or cached) grocery items, empty (or cached) frequently added. No `getGroceryItems()` that hits search with empty `q`. |
| H2 | Expose a **`searchGroceries(query: string): Promise<GroceryItem[]>`** from the hook (delegating to catalogService.searchGroceries) for components that need server-side search. |

**Files:** `mobile/src/common/hooks/useCatalog.ts`.

---

### 4.4 GrocerySearchBar: server-side search

**Goal:** Search bar gets suggestions from the API when the user types, not from a preloaded full list.

| Step | Action |
|------|--------|
| S1 | Add optional **server-side search** mode: e.g. `searchMode?: 'local' | 'remote'`. When `remote`, the bar does not use `items` for filtering; it calls a callback like `onSearchQueryChange(query: string)` and receives `searchResults` (or `items` that are the last search result) from the parent. |
| S2 | Parent (Dashboard, ShoppingListsScreen, etc.) when `searchMode='remote'`: on mount pass `items={[]}` and a handler that debounces (e.g. 300ms) the query and calls `catalogService.searchGroceries(query)` (or useCatalog’s search), then sets state with the result and passes it as `items` to the bar (or a dedicated `searchResults` prop). |
| S3 | When `query.trim() === ''`, parent passes empty list so the bar shows no suggestions (or “type to search” hint). No API call. |
| S4 | Optional: allow a hybrid – use `items` for “recent” or “frequently added” when query is empty, and switch to API results when query is non-empty. |

**Files:** `mobile/src/features/shopping/components/GrocerySearchBar/GrocerySearchBar.tsx`, `types.ts`; each screen that uses the bar (Dashboard, ShoppingListsScreen, RecipesScreen, ShoppingListPanel, ShoppingQuickActionModal).

---

### 4.5 Screens that use catalog

| Screen / component | Change |
|--------------------|--------|
| **DashboardScreen** | Use categories from useCatalog (no full list). For the search bar, use remote search (debounced searchGroceries). Suggested items: use `frequentlyAddedItems` (empty on first load or from cache). |
| **ShoppingListsScreen** | Same: categories from useCatalog; GrocerySearchBar in remote mode with debounced search. |
| **RecipesScreen** | GrocerySearchBar in remote mode. |
| **ShoppingListPanel** | Receives `groceryItems` from parent; parent (ShoppingListsScreen) passes search results when in context of a search, or empty. Ensure panel works with empty list and remote search. |
| **ShoppingQuickActionModal** | Today it gets `groceryItems` from `shoppingService.getShoppingData()`. RemoteShoppingService calls `getGroceryItems()` (catalog). Change so quick-add modal uses remote search only: no full catalog; search bar triggers searchGroceries(query) and shows those results. May require passing a search callback or using useCatalog’s search inside the modal. |
| **AddRecipeModal** | If it uses grocery items for ingredient picker, use remote search (or empty until search). |

---

### 4.6 Categories from names only

Today `buildCategoriesFromGroceries(items)` needs a full list to compute itemCount per category. Backend returns only category **names**.

| Step | Action |
|------|--------|
| G1 | Add a small helper or use existing catalogUtils: build a minimal `Category[]` from `string[]` (id, localId, name from string, itemCount: 0, image/backgroundColor defaults). Use this for initial load from GET /groceries/categories. |
| G2 | If you need itemCount for categories without full catalog, backend could later add a “categories with counts” endpoint; until then, 0 or “—” is acceptable. |

**Files:** `mobile/src/common/utils/catalogUtils.ts`, `mobile/src/common/services/catalogService.ts`.

---

## 5. API Contract Summary

| Endpoint | When to call | Notes |
|----------|----------------|-------|
| **GET /groceries/search?q=** | Only when user has typed a non-empty search query (debounced). | Backend should return `[]` when `q` is empty. |
| **GET /groceries/categories** | On initial catalog load (once per app/session or when opening shopping/dashboard). | Lightweight; use for category list on mount. |
| **GET /shopping-items/custom** | As today (e.g. when loading catalog for signed-in users). | Merge with search results if desired. |

---

## 6. Testing Strategy

- **Unit:** CatalogService: `getGroceryItems()` no longer calls search with empty q; new `searchGroceries(q)` calls with non-empty q only. useCatalog: initial load does not trigger search.
- **Unit:** GrocerySearchBar in remote mode: when query is empty, no search call; when query is set, debounced call with correct q.
- **Integration:** Login → open dashboard/shopping → no GET /groceries/search?q= in network log; typing in search bar triggers GET /groceries/search?q=<typed>.
- **Backend:** searchGroceries('') returns []; searchGroceries('milk') returns matching items (and optionally capped).

---

## 7. Success Criteria

- No request to **GET /groceries/search?q=** (or with empty `q`) on app or screen load.
- Request to **GET /groceries/search?q=<query>** occurs only after the user has typed a non-empty query (with debounce).
- Categories for the UI load from **GET /groceries/categories** on initial load.
- All screens that use the grocery search bar still allow search and add-to-list; suggestions come from the search API only when the user types.

---

## 8. Risks / Follow-ups

- **Offline:** With no full catalog cached, search won’t work offline unless you add a small cache of recent searches or a minimal fallback list; document or add in a follow-up.
- **Backend limit:** Adding a `take` limit on search prevents one very broad query from returning 50k items; recommend doing it in backend.
- **Frequently added:** If “frequently added” is important on first paint, consider a small dedicated endpoint or client-side cache of last N added items; otherwise empty on first load is acceptable.
