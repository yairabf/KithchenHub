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
const isMockDataEnabled = config.mockData.enabled;
const shouldUseMockData = isMockDataEnabled || !user || user.isGuest;
const shoppingService = useMemo(
  () => createShoppingService(shouldUseMockData),
  [shouldUseMockData]
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
- **Service**: `createShoppingService(isMockEnabled)` factory creates service instance
  - Loads all data via `shoppingService.getShoppingData()` on mount
  - Switches between mock and API based on `config.mockData.enabled` or guest status
- **Computed values**: `activeList` memoized from selectedList or first list, `filteredItems` filtered by selected list

## Service Layer

The feature uses a **Strategy Pattern** with a **Factory Pattern** to handle data fetching, switching transparently between local mocks and backend API based on environment configuration.

- **Factory**: `createShoppingService(isMockEnabled: boolean)` (`mobile/src/features/shopping/services/shoppingService.ts`)
  - Returns `LocalShoppingService` when `isMockEnabled` is true
  - Returns `RemoteShoppingService` when `isMockEnabled` is false
- **Interface**: `IShoppingService`
  - `getShoppingData(): Promise<ShoppingData>` - Returns all shopping-related data
- **ShoppingData**: Includes `shoppingLists`, `shoppingItems`, `categories`, `groceryItems`, `frequentlyAddedItems`
- **Strategies**:
  - `LocalShoppingService`: Returns mock data from `mockShoppingLists`, `mockItems`, `mockCategories`, `mockGroceriesDB`
  - `RemoteShoppingService`: Calls backend via `api.ts` (`/groceries/search`, `/shopping-lists`, `/shopping-lists/{id}` endpoints)
- **Configuration**: `config.mockData.enabled` (`mobile/src/config/index.ts`)
  - Controlled by `EXPO_PUBLIC_USE_MOCK_DATA` environment variable
  - Guest users always use local data regardless of the flag
- **API Client**: `mobile/src/services/api.ts` - Generic HTTP client wrapper

## Key Dependencies

- `react-native-gesture-handler` - GestureDetector for swipe interactions
- `react-native-reanimated` - Smooth swipe animations
- `config` - Application configuration (`mobile/src/config/index.ts`) for mock data toggle
- `createShoppingService` - Service factory for selecting mock/real data source
- `mockGroceriesDB` - Grocery database with images and categories (used by LocalShoppingService)
- `mockShoppingLists`, `mockItems`, `mockCategories` - Mock data (used by LocalShoppingService)
- `api` - HTTP client (`mobile/src/services/api.ts`) for remote service calls
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
