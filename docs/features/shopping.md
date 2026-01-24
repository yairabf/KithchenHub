# Shopping Feature

## Overview

The Shopping feature provides comprehensive shopping list management with the ability to create multiple lists, browse groceries by category, search and add items, and track quantities. It's the most complex feature in the app with multiple components and modals.

## Screenshots

### Main Shopping View
![Shopping Main](../screenshots/shopping/shopping-main.png)

### Quick Add Modal
![Quick Add Modal](../screenshots/shopping/shopping-quick-add-modal.png)

### Search Dropdown
![Search Dropdown](../screenshots/shopping/shopping-search-dropdown.png)

### Category Modal
![Category Modal](../screenshots/shopping/shopping-category-modal.png)

### All Items Modal
![All Items Modal](../screenshots/shopping/shopping-all-items-modal.png)

### New List Modal
![New List Modal](../screenshots/shopping/shopping-new-list-modal.png)

## Screens

### ShoppingListsScreen

- **File**: `mobile/src/features/shopping/screens/ShoppingListsScreen.tsx`
- **Purpose**: Complex shopping list management with two-column layout
- **Key functionality**:
  - Header showing selected list name and total item count
  - Two-column layout: shopping lists & items (left), categories discovery (right)
  - Multiple modal interactions (quantity, create list, category, all items, quick add)
  - Floating action button for quick add
  - **Guest Support**: Loads private list data from local mocks for guest users while signed-in users use the API

#### Code Snippet - Service Initialization

```typescript
// Determine data mode based on user authentication state
const userMode = useMemo(() => {
  if (config.mockData.enabled) {
    return 'guest' as const;
  }
  return determineUserDataMode(user);
}, [user]);

const shoppingService = useMemo(
  () => createShoppingService(userMode),
  [userMode]
);

useEffect(() => {
  const loadShoppingData = async () => {
    const data = await shoppingService.getShoppingData();
    setShoppingLists(data.shoppingLists);
    setAllItems(data.shoppingItems);
    setGroceryItems(data.groceryItems);
    setCategories(data.categories);
    setFrequentlyAddedItems(data.frequentlyAddedItems);
  };
  loadShoppingData();
}, [shoppingService]);
```

## Components

### ShoppingListPanel

- **File**: `mobile/src/features/shopping/components/ShoppingListPanel/`
- **Purpose**: Left column containing list selector and shopping items
- **Features**:
  - Horizontal drawer showing all shopping lists
  - Search bar for finding groceries
  - Swipeable shopping item rows with quantity controls
  - "New List" button

### GrocerySearchBar

- **File**: `mobile/src/features/shopping/components/GrocerySearchBar/`
- **Purpose**: Smart search component with dropdown results
- **Props**:

```typescript
interface GrocerySearchBarProps {
  items: GroceryItem[];
  onSelectItem: (item: GroceryItem) => void;
  onQuickAddItem: (item: GroceryItem) => void;

  placeholder?: string;
  variant?: 'surface' | 'background';
  showShadow?: boolean;
  maxResults?: number;  // default: 8
  allowCustomItems?: boolean;  // allow adding items not in database

  // Controlled state
  value?: string;
  onChangeText?: (text: string) => void;

  containerStyle?: ViewStyle;
  dropdownStyle?: ViewStyle;
}
```

- **Features**:
  - Filter by name or category
  - Support for custom item creation
  - Quick-add buttons for rapid multi-item addition
  - Dropdown showing up to 8 results

### CategoriesGrid

- **File**: `mobile/src/features/shopping/components/CategoriesGrid/`
- **Purpose**: Visual category tiles for browsing groceries
- **Features**:
  - Grid of category cards with images and item counts
  - "See all" button for full item view
  - Category background overlays

### FrequentlyAddedGrid

- **File**: `mobile/src/features/shopping/components/FrequentlyAddedGrid/`
- **Purpose**: Quick access grid showing frequently added items
- **Props**:

```typescript
interface FrequentlyAddedGridProps {
  items: GroceryItem[];
  onItemPress: (item: GroceryItem) => void;
}
```

- **Features**:
  - Displays up to 8 frequently added items
  - Grid layout with item images and names
  - Quick add functionality with tap
  - Auto-hides when no items available

### CategoryModal

- **File**: `mobile/src/features/shopping/components/CategoryModal/`
- **Purpose**: Modal showing all items within a selected category
- **Features**:
  - Scrollable list of items
  - Item selection and quick-add options

### AllItemsModal

- **File**: `mobile/src/features/shopping/components/AllItemsModal/`
- **Purpose**: Complete grocery database browser
- **Features**:
  - View all available groceries (111 items in database)
  - Search/filter functionality
  - Expandable category accordions
  - Select or quick-add items

### ShoppingQuickActionModal

- **File**: `mobile/src/features/shopping/components/ShoppingQuickActionModal/`
- **Purpose**: Quick add modal accessible from floating button
- **Features**:
  - List switcher (bubble buttons to select list)
  - Integrated grocery search bar
  - Rapid item additions

## Entity Creation (New)

The feature implementation now uses a Factory Pattern to separate business logic from UI components and ensure TDD compliance.

- **Factory**: `mobile/src/features/shopping/utils/shoppingFactory.ts`
- **Tests**: `mobile/src/features/shopping/utils/__tests__/shoppingFactory.test.ts`
- **Logic**: Generates `localId` using `expo-crypto` UUIDs.

```typescript
// Example usage
import { createShoppingItem } from '../utils/shoppingFactory';
const newItem = createShoppingItem(groceryItem, listId, quantity);
```

## Key Types

```typescript
interface ShoppingItem {
  id: string; // Legacy ID
  localId: string; // Stable UUID
  name: string;
  image: string;
  quantity: number;
  category: string;
  listId: string;
}

interface ShoppingList {
  id: string; // Legacy ID
  localId: string; // Stable UUID
  name: string;
  itemCount: number;
  icon: IoniconsName;
  color: string;
}

interface GroceryItem {
  id: string;
  name: string;
  image: string;
  category: string;
  defaultQuantity: number;
}
```

## State Management

- **Local state**: All state managed within ShoppingListsScreen via `useState`
  - `shoppingLists` - All shopping lists
  - `selectedList` - Currently active list
  - `allItems` - All shopping items across lists
  - `groceryItems` - Grocery database items
  - `categories` - Category definitions
  - `frequentlyAddedItems` - Frequently added grocery items
  - Various modal visibility states
- **Service**: `createShoppingService(mode)` factory creates service instance based on data mode
  - Loads all data via `shoppingService.getShoppingData()` on mount
  - Mode determined by `determineUserDataMode()`: 'guest' for guest users or when `config.mockData.enabled` is true, 'signed-in' for authenticated users
- **Computed values**: `activeList` memoized from selectedList or first list, `filteredItems` filtered by selected list

## Service Layer

The feature uses a **Strategy Pattern** with a **Factory Pattern** to handle data fetching, switching transparently between local guest storage and backend API based on user authentication state.

- **Factory**: `createShoppingService(mode: 'guest' | 'signed-in')` (`mobile/src/features/shopping/services/shoppingService.ts`)
  - Returns `LocalShoppingService` when mode is 'guest'
  - Returns `RemoteShoppingService` when mode is 'signed-in'
  - Validates service compatibility with data mode
- **Interface**: `IShoppingService`
  - `getShoppingData(): Promise<ShoppingData>` - Returns all shopping-related data
- **ShoppingData**: Includes `shoppingLists`, `shoppingItems`, `categories`, `groceryItems`, `frequentlyAddedItems`
- **Strategies**:
  - `LocalShoppingService`: 
    - Reads lists and items from `guestStorage` (AsyncStorage) instead of mocks
    - Returns empty arrays when no guest data exists (not mock data)
    - Still provides reference data (categories, groceryItems, frequentlyAddedItems) from mocks as these are not user-created
  - `RemoteShoppingService`: Calls backend via `api.ts` (`/groceries/search`, `/shopping-lists`, `/shopping-lists/{id}` endpoints)
- **Guest Storage**: `mobile/src/common/utils/guestStorage.ts`
  - `getShoppingLists()`: Retrieves lists from AsyncStorage key `@kitchen_hub_guest_shopping_lists`
  - `getShoppingItems()`: Retrieves items from AsyncStorage key `@kitchen_hub_guest_shopping_items`
  - `saveShoppingLists(lists)`: Persists lists to AsyncStorage
  - `saveShoppingItems(items)`: Persists items to AsyncStorage
  - Returns empty arrays when no data exists or on parse errors
  - Validates data format (ensures array and required fields)
- **Configuration**: `config.mockData.enabled` (`mobile/src/config/index.ts`)
  - Controlled by `EXPO_PUBLIC_USE_MOCK_DATA` environment variable
  - When enabled, forces 'guest' mode regardless of user authentication state
  - Guest users always use 'guest' mode (local service)
- **API Client**: `mobile/src/services/api.ts` - Generic HTTP client wrapper

## Guest User Data Separation

The shopping feature implements guest user data separation to ensure guest users use local storage while signed-in users use cloud sync, preventing API call failures in production.

### Service Selection Pattern

Service selection is determined by data mode based on user authentication state:

```typescript
const { user } = useAuth();
const userMode = useMemo(() => {
  if (config.mockData.enabled) {
    return 'guest' as const;
  }
  return determineUserDataMode(user);
}, [user]);

const shoppingService = useMemo(
  () => createShoppingService(userMode),
  [userMode]
);
```

**Behavior**:
- **Development** (`config.mockData.enabled = true`): Always uses `LocalShoppingService` (guest mode) regardless of auth state
- **Production + Guest User** (`config.mockData.enabled = false` + `user.isGuest = true`): Uses `LocalShoppingService` which reads from AsyncStorage (no API calls)
- **Production + Signed-in User** (`config.mockData.enabled = false` + authenticated): Uses `RemoteShoppingService` (cloud sync)

### List Selection Utilities

To prevent stale list state when switching between mock and remote data sources, the feature uses selection utilities:

- **File**: `mobile/src/features/shopping/utils/selectionUtils.ts`
- **Functions**:
  - `getSelectedList()`: Selects the best matching list, preserving the current selection when valid, falling back to first list
  - `getActiveListId()`: Validates and preserves active list ID when switching data sources
- **Tests**: `mobile/src/features/shopping/utils/__tests__/selectionUtils.test.ts` - Parameterized tests covering all scenarios

This ensures that when a user switches from guest (local) to signed-in (remote), the selected list remains valid or gracefully falls back to the first available list.

## Key Dependencies

- `react-native-gesture-handler` - GestureDetector for swipe interactions
- `react-native-reanimated` - Smooth swipe animations
- `config` - Application configuration (`mobile/src/config/index.ts`) for mock data toggle
- `createShoppingService` - Service factory for selecting guest/signed-in data source based on mode
- `guestStorage` - Guest data persistence utilities (`mobile/src/common/utils/guestStorage.ts`)
- `determineUserDataMode` - Utility to determine data mode from user state (`mobile/src/common/types/dataModes.ts`)
- `getSelectedList`, `getActiveListId` - Selection utilities from `utils/selectionUtils.ts` for preventing stale list state
- `mockGroceriesDB` - Grocery database with images and categories (used by LocalShoppingService)
- `mockShoppingLists`, `mockItems`, `mockCategories` - Mock data (used by LocalShoppingService)
- `api` - HTTP client (`mobile/src/services/api.ts`) for remote service calls
- `useAuth` - Auth context hook for determining user state
- `CenteredModal` - Shared modal component
- `ScreenHeader` - Shared header component
- `useResponsive` - Responsive layout hook

## UI Flow

1. User selects a shopping list from horizontal drawer
2. Items in that list appear below with quantity controls
3. User can search for groceries or browse categories
4. Clicking an item opens quantity modal to confirm addition
5. Quick-add button adds items with default quantity instantly
6. Swipe items to delete them from the list
