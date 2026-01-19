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

- **File**: `src/features/shopping/screens/ShoppingListsScreen.tsx`
- **Purpose**: Complex shopping list management with two-column layout
- **Key functionality**:
  - Header showing selected list name and total item count
  - Two-column layout: shopping lists & items (left), categories discovery (right)
  - Multiple modal interactions (quantity, create list, category, all items, quick add)
  - Floating action button for quick add

#### Code Snippet - State Management

```typescript
const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>(mockShoppingLists);
const [selectedList, setSelectedList] = useState<ShoppingList>(mockShoppingLists[0]);
const [allItems, setAllItems] = useState<ShoppingItem[]>(mockItems);
const [selectedGroceryItem, setSelectedGroceryItem] = useState<GroceryItem | null>(null);
const [showQuantityModal, setShowQuantityModal] = useState(false);
const [showCreateListModal, setShowCreateListModal] = useState(false);
const [showCategoryModal, setShowCategoryModal] = useState(false);
const [showAllItemsModal, setShowAllItemsModal] = useState(false);
const [showQuickAddModal, setShowQuickAddModal] = useState(false);
```

## Components

### ShoppingListPanel

- **File**: `src/features/shopping/components/ShoppingListPanel/`
- **Purpose**: Left column containing list selector and shopping items
- **Features**:
  - Horizontal drawer showing all shopping lists
  - Search bar for finding groceries
  - Swipeable shopping item rows with quantity controls
  - "New List" button

### GrocerySearchBar

- **File**: `src/features/shopping/components/GrocerySearchBar/`
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

- **File**: `src/features/shopping/components/CategoriesGrid/`
- **Purpose**: Visual category tiles for browsing groceries
- **Features**:
  - Grid of category cards with images and item counts
  - "See all" button for full item view
  - Category background overlays

### FrequentlyAddedGrid

- **File**: `src/features/shopping/components/FrequentlyAddedGrid/`
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

- **File**: `src/features/shopping/components/CategoryModal/`
- **Purpose**: Modal showing all items within a selected category
- **Features**:
  - Scrollable list of items
  - Item selection and quick-add options

### AllItemsModal

- **File**: `src/features/shopping/components/AllItemsModal/`
- **Purpose**: Complete grocery database browser
- **Features**:
  - View all available groceries (111 items in database)
  - Search/filter functionality
  - Expandable category accordions
  - Select or quick-add items

### ShoppingQuickActionModal

- **File**: `src/features/shopping/components/ShoppingQuickActionModal/`
- **Purpose**: Quick add modal accessible from floating button
- **Features**:
  - List switcher (bubble buttons to select list)
  - Integrated grocery search bar
  - Rapid item additions

## Key Types

```typescript
interface ShoppingItem {
  id: string;
  name: string;
  image: string;
  quantity: number;
  category: string;
  listId: string;
}

interface ShoppingList {
  id: string;
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
- **Mock data**: Uses `mockGroceriesDB` (111 items), `mockShoppingLists`, `mockItems`, `mockCategories`
- **Computed values**: `filteredItems` filtered by selected list, `totalItems` sum of quantities

## Key Dependencies

- `react-native-gesture-handler` - GestureDetector for swipe interactions
- `react-native-reanimated` - Smooth swipe animations
- `mockGroceriesDB` - Grocery database with images and categories
- `CenteredModal` - Shared modal component

## UI Flow

1. User selects a shopping list from horizontal drawer
2. Items in that list appear below with quantity controls
3. User can search for groceries or browse categories
4. Clicking an item opens quantity modal to confirm addition
5. Quick-add button adds items with default quantity instantly
6. Swipe items to delete them from the list
