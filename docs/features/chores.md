# Chores Feature

## Overview

The Chores feature provides household chore tracking with a visual progress ring, swipeable cards for today's and upcoming chores, and the ability to assign chores to household members. It features a responsive layout that adapts between single-column (mobile) and two-column (tablet) layouts.

## Screenshots

### Main Chores View
![Chores Main](../screenshots/chores/chores-main.png)

### Edit Chore Modal
![Edit Chore Modal](../screenshots/chores/chores-edit-modal.png)

### Quick Add Chore Modal
![Quick Add Modal](../screenshots/chores/chores-quick-add-modal.png)

## Screens

### ChoresScreen

- **File**: `mobile/src/features/chores/screens/ChoresScreen.tsx`
- **Purpose**: Comprehensive chore management with progress tracking
- **Key functionality**:
  - Header with home icon and "HOME CHORES" title
  - Progress ring showing completion percentage for today's chores
  - Responsive layout: single-column (mobile) or two-column (768px+)
  - Two sections: "TODAY'S CHORES" and "UPCOMING CHORES"
  - Swipeable chore cards with edit and delete capabilities
  - Floating action button to add chores
  - **Mock Data Toggle**: Loads chores via `choresService.getChores()` based on `config.mockData.enabled`

#### Props Interface

```typescript
interface ChoresScreenProps {
  onOpenChoresModal?: () => void;
  onRegisterAddChoreHandler?: (handler: (newChore: {
    name: string;
    icon: string;
    assignee?: string;
    dueDate: string;
    dueTime?: string;
    section: 'today' | 'thisWeek';
  }) => void) => void;
}
```

#### Code Snippet - Progress Calculation

```typescript
const progress = useMemo(() => {
  const total = todayChores.length;
  const completed = todayChores.filter(c => c.completed).length;
  const progressValue = total > 0 ? (completed / total) * 100 : 0;
  return progressValue;
}, [todayChores]);
```

#### Code Snippet - Responsive Layout

```typescript
const { width } = useWindowDimensions();
const isWideScreen = width >= 768;

// Renders different layouts based on isWideScreen
{isWideScreen ? (
  <View style={styles.wideLayout}>
    {/* Two-column layout */}
  </View>
) : (
  <View style={styles.narrowLayout}>
    {/* Single-column layout */}
  </View>
)}
```

## Components

### ProgressRing

- **File**: `mobile/src/features/chores/components/ProgressRing/`
- **Purpose**: Animated circular progress indicator
- **Props**:

```typescript
interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  progressColor?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  showEmoji?: boolean;
}
```

- **Features**:
  - SVG-based progress visualization
  - Dynamic color progression (gray -> yellow -> green)
  - Smooth animations with 1000ms duration
  - Shows percentage and thumbs-up emoji when >= 75%
  - Uses react-native-reanimated for animations

### SwipeableWrapper (from common components)

- **File**: `mobile/src/common/components/SwipeableWrapper/`
- **Purpose**: Reusable gesture-driven wrapper component for swipe-to-delete functionality
- **Usage**: Used in ChoresScreen to wrap chore cards
- **Features**:
  - Pan gesture handler for swipe-to-delete
  - Swipe left or right to delete (30% threshold or high velocity)
  - Animated background reveals trash icon
  - Smooth spring animations
  - Direction locking to prevent multi-directional swipes

### ChoreDetailsModal

- **File**: `mobile/src/features/chores/components/ChoreDetailsModal/`
- **Purpose**: Edit existing chore details
- **Features**:
  - Edit chore name and icon
  - Change assignee selection
  - Update due date and time
  - Date/time picker integration

### ChoresQuickActionModal

- **File**: `mobile/src/features/chores/components/ChoresQuickActionModal/`
- **Purpose**: Quick chore creation form
- **Features**:
  - Chore name input
  - Icon selection
  - Assignee picker
  - Due date and time selection
  - Section selection (today/this week)

## Entity Creation (New)

The feature implementation now uses a Factory Pattern to separate business logic from UI components and ensure TDD compliance.

- **Factory**: `mobile/src/features/chores/utils/choreFactory.ts`
- **Tests**: `mobile/src/features/chores/utils/__tests__/choreFactory.test.ts`
- **Logic**: Generates `localId` using `expo-crypto` UUIDs.

```typescript
// Example usage
import { createChore } from '../utils/choreFactory';
const newChore = createChore(choreData);
```

## Key Types

```typescript
interface Chore {
  id: string;
  localId: string; // Stable UUID
  name: string;
  icon: string;
  assignee?: string;
  dueDate: string;
  dueTime?: string;
  completed: boolean;
  section: 'today' | 'thisWeek' | 'recurring';
}

export type AddChoreHandler = (newChore: {
  name: string;
  icon: string;
  assignee?: string;
  dueDate: string;
  dueTime?: string;
  section: 'today' | 'thisWeek';
}) => void;
```

## State Management

- **Local state**:
  - `chores` - Array of Chore objects (loaded from service)
  - `selectedChore` - Currently selected chore for editing
  - `showDetailsModal` - Modal visibility for editing chore details
  - `showShareModal` - Modal visibility for sharing chores list
- **Service**: `createChoresService(isMockEnabled)` factory creates service instance
  - Loads chores via `choresService.getChores()` on mount
  - Switches between mock and API based on `config.mockData.enabled`
- **Computed values**:
  - `todayChores` - Filtered chores for today section
  - `upcomingChores` - Filtered chores for this week/recurring
  - `shareText` - Formatted text for sharing (memoized)
  - `isWideScreen` - Responsive breakpoint detection (>= 768px)
- **Parent communication**:
  - `onOpenChoresModal` - Callback to open quick add modal
  - `onRegisterAddChoreHandler` - Registers add function with parent

## Service Layer

The feature uses a **Strategy Pattern** with a **Factory Pattern** to handle data fetching, switching transparently between local mocks and backend API based on environment configuration.

- **Factory**: `createChoresService(isMockEnabled: boolean)` (`mobile/src/features/chores/services/choresService.ts`)
  - Returns `LocalChoresService` when `isMockEnabled` is true
  - Returns `RemoteChoresService` when `isMockEnabled` is false
- **Interface**: `IChoresService`
  - `getChores(): Promise<Chore[]>` - Returns all chores
- **Strategies**:
  - `LocalChoresService`: Returns mock data from `mockChores`
  - `RemoteChoresService`: Calls backend via `api.ts` (`/chores` endpoint), maps DTOs to Chore objects
- **Configuration**: `config.mockData.enabled` (`mobile/src/config/index.ts`)
  - Controlled by `EXPO_PUBLIC_USE_MOCK_DATA` environment variable
- **API Client**: `mobile/src/services/api.ts` - Generic HTTP client wrapper

## Key Dependencies

- `react-native-gesture-handler` - GestureDetector for swipe interactions
- `react-native-reanimated` - Smooth animations for progress ring and swipes
- `config` - Application configuration (`mobile/src/config/index.ts`) for mock data toggle
- `createChoresService` - Service factory for selecting mock/real data source
- `SwipeableWrapper` - Shared component from `common/components` for swipe-to-delete
- `ScreenHeader` - Shared header component with actions
- `ShareModal` - Shared modal component for sharing functionality
- `formatChoresText` - Utility function for formatting chores for sharing
- `mockChores` - Initial chore data (used by LocalChoresService)
- `api` - HTTP client (`mobile/src/services/api.ts`) for remote service calls
- `pastelColors` - Theme colors for card backgrounds
- `useWindowDimensions` - For responsive layout detection

## UI Flow

1. User views chores split into "Today" and "Upcoming" sections
2. Progress ring shows percentage of today's chores completed
3. Tap chore card to toggle completion status
4. Tap edit icon on chore to open details modal
5. Swipe chore left/right to delete it
6. Click FAB to open quick add modal for new chores
7. Assign chores to household members (Mom, Dad, Kids, All)

## Responsive Behavior

- **Mobile (< 768px)**: Single column layout
  - Progress ring at top
  - Today's chores below
  - Upcoming chores at bottom

- **Tablet (>= 768px)**: Two column layout
  - Left column: Progress ring + Today's chores
  - Right column: Upcoming chores
