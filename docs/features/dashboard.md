# Dashboard Feature

## Overview

The Dashboard feature serves as the home screen of Kitchen Hub, providing users with a quick overview of their household management tasks and quick-action widgets. It displays a personalized greeting based on time of day, summary cards for shopping lists, chores, and recipes, plus quick-action buttons.

## Screenshot

![Dashboard Screen](../screenshots/dashboard/dashboard-main.png)

## Screens

### DashboardScreen

- **File**: `mobile/src/features/dashboard/screens/DashboardScreen.tsx`
- **Purpose**: Main dashboard with overview widgets and quick-action access
- **Key functionality**:
  - Header with Kitchen Hub logo and recipe search bar
  - Notification button with badge indicator
  - User profile section with avatar (Google photo or DiceBear fallback)
  - Time-based greeting (Good Morning/Afternoon/Evening)
  - Overview cards showing summary of Shopping Lists, Today's Chores, and Recipes
  - Quick-action widget buttons for adding to shopping list and creating chores
  - Two-column responsive layout

#### Props Interface

```typescript
interface DashboardScreenProps {
  onOpenShoppingModal: (buttonPosition?: { x: number; y: number; width: number; height: number }) => void;
  onOpenChoresModal: () => void;
  onNavigateToTab: (tab: TabKey) => void;
}
```

#### Code Snippet - Greeting Logic

```typescript
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning!';
  if (hour < 18) return 'Good Afternoon!';
  return 'Good Evening!';
};
```

#### Code Snippet - Overview Items

```typescript
const overviewItems = [
  { icon: 'basket-outline' as const, title: 'Shopping Lists', sub: '3 active lists', route: 'Shopping' as TabKey },
  { icon: 'clipboard-outline' as const, title: "Today's Chores", sub: '3 tasks pending', route: 'Chores' as TabKey },
  { icon: 'restaurant-outline' as const, title: 'Recipes', sub: '6 saved recipes', route: 'Recipes' as TabKey },
];
```

## Components

This feature has no separate components - all UI is contained within the DashboardScreen.

## UI Sections

### Header
- Kitchen Hub logo (grid icon in dark square)
- Search bar for recipes
- Notification bell with badge
- User profile with role label ("KITCHEN LEAD") and avatar

### Greeting Section
- Dynamic greeting based on time of day
- Subtitle: "Manage your home seamlessly."

### Overview Cards (Left Column)
- Shopping Lists card - shows count of active lists
- Today's Chores card - shows pending tasks
- Recipes card - shows saved recipes count
- "Add Widget" placeholder button

### Quick Action Widgets (Right Column)
- "Add to Shopping List" widget - opens shopping modal with button position for animation
- "Add New Chore" widget - opens chores modal

## State Management

- **AuthContext**: User data via `useAuth()` hook for profile display
- **Local state**:
  - `searchQuery` - Search input text
  - `shoppingButtonRef` - Ref for measuring button position for modal animations

## Key Dependencies

- `@expo/vector-icons` - Ionicons for all icons
- `AuthContext` - User profile data
- `BottomPillNav` - TabKey type for navigation
- Theme system (`colors`, `spacing`, `borderRadius`, `typography`, `shadows`, `componentSize`)

## Layout Notes

- Uses a two-column grid layout (`mainGrid`)
- Left column (flex: 1) contains overview cards
- Right column (flex: 1.2) contains widget buttons
- Widget cards have fixed max dimensions (217x217) with 1:1 aspect ratio
- Content has bottom padding of 120px to accommodate bottom navigation
