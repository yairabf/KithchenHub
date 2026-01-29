# Dashboard Feature

## Overview

The Dashboard feature serves as the home screen of Kitchen Hub, providing users with a quick overview of their household management tasks and quick-action widgets. It displays a header with clock and date, an "Add to Shopping List" card with search and suggested items, quick stat cards (Shopping Lists, Saved Recipes), and an "Important Chores" section with today's chores. No separate greeting section is shown.

## Screenshot

![Dashboard Screen](../screenshots/dashboard/dashboard-main.png)

## Screens

### DashboardScreen

- **File**: `mobile/src/features/dashboard/screens/DashboardScreen.tsx`
- **Purpose**: Main dashboard with shopping widget, quick stats, and today's chores
- **Key functionality**:
  - Header with Kitchen Hub logo, live clock and date (time on all devices; full date on tablet), notification button, and user profile (role: "KITCHEN LEAD" or "Guest", display name, avatar)
  - "Add to Shopping List" card with GrocerySearchBar, mic button, add button, and suggested item chips (from catalog/frequently added); tapping a suggestion adds the item to the active list (quantity 1) or increments existing
  - Quick stat cards: Shopping Lists, Saved Recipes (each navigates to the corresponding tab)
  - "Important Chores" list: today's chores with avatar, name, status (Done/Pending), assignee, due date/time; tap to toggle completion; "View All" and "Add Household Task" open Chores tab or chore modal
  - Two-column responsive layout (tablet: 7/5 flex; phone: single column)

#### Props Interface

Defined in `mobile/src/features/dashboard/screens/types.ts`:

```typescript
import type { TabKey } from '../../../common/components/BottomPillNav';

export interface DashboardScreenProps {
  onOpenShoppingModal: (buttonPosition?: { x: number; y: number; width: number; height: number }) => void;
  onOpenChoresModal: () => void;
  onNavigateToTab: (tab: TabKey) => void;
}
```

#### Code Snippet - Quick Stats

```typescript
const QUICK_STATS = [
  { icon: 'basket-outline' as const, label: 'Shopping Lists', value: '2 Active', route: 'Shopping' as TabKey, iconBgStyle: 'shopping' as const },
  { icon: 'book-outline' as const, label: 'Saved Recipes', value: '12 Items', route: 'Recipes' as TabKey, iconBgStyle: 'recipes' as const },
];
```

#### Code Snippet - Clock and Date

Time and date use shared utilities and a mounted-safe interval:

```typescript
const [currentTime, setCurrentTime] = useState(() => new Date());
const isMountedRef = useRef(true);
useEffect(() => {
  isMountedRef.current = true;
  const timer = setInterval(() => {
    if (isMountedRef.current) setCurrentTime(new Date());
  }, 1000);
  return () => { isMountedRef.current = false; clearInterval(timer); };
}, []);
const formattedTime = formatTimeForDisplay(currentTime);
const formattedDate = formatDateForDisplay(currentTime);
```

## Hooks

### useDashboardChores

- **File**: `mobile/src/features/dashboard/hooks/useDashboardChores.ts`
- **Purpose**: Load today's chores and toggle completion for the dashboard. Uses the same data source as ChoresScreen: signed-in uses `CacheAwareChoreRepository` and `useCachedEntities('chores')`; guest uses `createChoresService('guest')` and local state. Today's list is filtered by `section === 'today'` (filterTodayChores).
- **Returns**: Exported as `UseDashboardChoresReturn`: `{ todayChores, toggleChore, isLoading }`
- **Data mode**: `determineUserDataMode(user)` and `config.mockData.enabled` drive `userMode`; `createChoresService(userMode)` and (when signed-in) `CacheAwareChoreRepository` are used internally.

## Components

The dashboard screen composes:

- **GrocerySearchBar** (from `features/shopping`) – search and quick-add for groceries in the "Add to Shopping List" card
- **SafeImage** (from `common/components`) – avatar and chore assignee images

All other UI is inline in DashboardScreen.

## UI Sections

### Header

- Kitchen Hub logo (grid icon in dark rounded square); "Kitchen Hub" text on tablet only
- Live clock (12h format) and full date on tablet
- Notification bell with red badge
- Vertical separator
- User profile: role label ("KITCHEN LEAD" or "Guest"), display name (tablet only), avatar (Google photo or DiceBear fallback)

### Add to Shopping List Card (Left Column)

- Title "Add to Shopping List", subtitle "Running low on something? Put it down now.", "Main List" badge
- GrocerySearchBar with mic and add buttons
- "Suggested Items" label and chips (from catalog/frequently added); tap adds to list or increments quantity

### Quick Stats Row

- Shopping Lists card – navigates to Shopping tab
- Saved Recipes card – navigates to Recipes tab

### Important Chores (Right Column)

- Section title, subtitle, "View All" link
- List of today's chores: avatar, name, status badge (Done/Pending), assignee, due date/time; tap toggles completion
- "Add Household Task" button (dashed border)

## State Management

- **AuthContext**: User data via `useAuth()` for display name, role, avatar
- **useCatalog**: `groceryItems`, `frequentlyAddedItems` for search and suggestions (suggested items: up to `SUGGESTED_ITEMS_MAX` = 8 from frequently added, else from catalog)
- **useDashboardChores**: `todayChores`, `toggleChore`, `isLoading` for chores section; signed-in path uses `CacheAwareChoreRepository` and `useCachedEntities('chores')`; guest path uses `createChoresService('guest')` and local `guestChores`/`guestLoading`; data mode from `determineUserDataMode(user)` and `config.mockData.enabled`
- **createShoppingService** + **getActiveListId**: Active list id for adding suggested items; service created with `shouldUseMockData ? 'guest' : 'signed-in'` where `shouldUseMockData = config.mockData.enabled || !user || user?.isGuest`; `activeListId` is set in `useEffect` via `shoppingService.getShoppingData()` then `getActiveListId(data.shoppingLists, current)`
- **Local state**: `searchValue`, `activeListId`, `currentTime` (for clock); `shoppingButtonRef` for modal position (used in `openShoppingModal` with `measureInWindow`)

## Key Dependencies

- `@expo/vector-icons` – Ionicons
- `dayjs` – via `formatTimeForDisplay` / `formatDateForDisplay` from `common/utils/dateTimeUtils`
- **Hooks**: `useAuth`, `useResponsive`, `useCatalog`, `useDashboardChores`
- **Components**: `GrocerySearchBar`, `SafeImage` (shopping feature + common)
- **Services/utils**: `createShoppingService`, `getActiveListId` (shopping); `createChoresService`, `CacheAwareChoreRepository`, `useCachedEntities` (chores, used inside useDashboardChores)
- **Config**: `config.mockData.enabled`; types: `TabKey` (BottomPillNav), `GroceryItem`, `ShoppingItem`
- Theme: `colors`, `spacing`, `borderRadius`, `typography`, `shadows`, `componentSize`, `zIndex`

## Layout Notes

- Two-column grid: left column flex 7, right column flex 5 on tablet; single column on phone
- Left: Add to Shopping List card, then quick stats row
- Right: Important Chores card
- Content padding: horizontal lg, top lg, bottom 120px for bottom nav
- Dropdown z-index: input row uses `zIndex.dropdown + 1` so GrocerySearchBar dropdown stays above suggested items
