# Kitchen Hub 🏠 - Detailed Documentation

> A comprehensive full-stack household management application

![iOS](https://img.shields.io/badge/iOS-supported-4CAF50) ![Android](https://img.shields.io/badge/Android-supported-4CAF50) ![Web](https://img.shields.io/badge/Web-supported-4CAF50) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue) ![NestJS](https://img.shields.io/badge/NestJS-10.0.0-E0234E) ![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020)

---

## 📋 Table of Contents

- [About](#-about)
- [Screenshots](#-screenshots)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Running the App](#-running-the-app)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [Key Features Deep Dive](#-key-features-deep-dive)
- [Development](#-development)
- [Documentation](#-documentation)
- [Configuration](#-configuration)
- [Design System](#-design-system)
- [Troubleshooting](#-troubleshooting)
- [Contact & Support](#-contact--support)

---

## 🎯 About

### What is Kitchen Hub?

Kitchen Hub is a modern, full-stack household management application consisting of a React Native/Expo mobile app and a NestJS REST API. It provides a unified solution for managing shopping lists, organizing recipes, tracking chores, and maintaining household organization across iOS, Android, and Web platforms.

### Problem It Solves

Managing a household involves juggling multiple tasks: remembering what to buy at the grocery store, keeping track of recipes, ensuring chores get done, and coordinating with family members. Kitchen Hub consolidates all these needs into a single, intuitive application.

### Key Value Propositions

- **Comprehensive Grocery Management**: Access a database of 111 categorized grocery items with smart search and category browsing
- **Recipe Organization**: Store, discover, and organize recipes with seamless ingredient-to-shopping list integration
- **Chore Tracking**: Visualize progress with interactive charts and manage task assignments
- **Cross-Platform**: Works seamlessly on iOS, Android, and web browsers
- **Flexible Authentication**: Use Google sign-in for sync or guest mode for privacy
- **Responsive Design**: Optimized layouts for phones and tablets

### Target Users

- Families managing shared household responsibilities
- Individuals looking to organize their personal shopping and meal planning
- Roommates coordinating chores and groceries
- Anyone seeking a centralized household management solution

---

## 📸 Screenshots

### Dashboard
<img src="docs/screenshots/dashboard/dashboard-main.png" alt="Dashboard with time-based greeting and quick actions" width="300"/>

*Dashboard featuring time-based greeting, quick action widgets, and household overview*

### Feature Showcase

<table>
  <tr>
    <td align="center">
      <img src="docs/screenshots/shopping/shopping-main.png" alt="Shopping Lists" width="250"/>
      <br/>
      <b>Shopping Lists</b>
      <br/>
      Multi-list management with frequently added items
    </td>
    <td align="center">
      <img src="docs/screenshots/recipes/recipes-main.png" alt="Recipes Grid" width="250"/>
      <br/>
      <b>Recipes</b>
      <br/>
      Grid view with category filters
    </td>
    <td align="center">
      <img src="docs/screenshots/chores/chores-main.png" alt="Chores Tracking" width="250"/>
      <br/>
      <b>Chores</b>
      <br/>
      Task tracking with progress visualization
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="docs/screenshots/recipes/recipes-detail.png" alt="Recipe Detail" width="250"/>
      <br/>
      <b>Recipe Detail</b>
      <br/>
      Ingredients, steps, and shopping list integration
    </td>
    <td align="center">
      <img src="docs/screenshots/shopping/shopping-quick-add-modal.png" alt="Quick Add" width="250"/>
      <br/>
      <b>Quick Add Modal</b>
      <br/>
      Fast item addition with grocery database
    </td>
    <td align="center">
      <img src="docs/screenshots/settings/settings-main.png" alt="Settings" width="250"/>
      <br/>
      <b>Settings</b>
      <br/>
      Profile, notifications, and household management
    </td>
  </tr>
</table>

---

## ✨ Features

### 🛒 Shopping Lists

The most comprehensive feature in Kitchen Hub, providing complete shopping list management with a two-column layout design.

**Core Features:**
- **Multi-List Management**: Create and manage multiple shopping lists (e.g., "Weekly Groceries", "Costco Run") with custom icons and colors
- **111-Item Grocery Database**: Pre-populated database organized into 9 categories (Produce, Dairy, Meat & Seafood, Pantry, Frozen Foods, Beverages, Snacks, Bakery, Household)
- **Smart Search with GrocerySearchBar**: Real-time search across all grocery items with dropdown results (up to 8 items), category filtering, and support for custom items not in the database
- **Category Browsing**: Visual category tiles with images and item counts for quick browsing
- **Frequently Added Grid**: Quick-access grid displaying up to 8 frequently used items for rapid addition
- **Swipeable Items**: Gesture-based item deletion using react-native-reanimated for smooth animations
- **Quantity Controls**: Adjust item quantities with increment/decrement controls
- **Two-Column Layout**: Left panel shows shopping lists and items, right panel displays category discovery

**Key Components:**
- `ShoppingListPanel`: List selector and shopping items viewer
- `GrocerySearchBar`: Intelligent search with quick-add buttons
- `CategoriesGrid`: Visual category browser
- `FrequentlyAddedGrid`: Quick access to common items
- `CategoryModal`: Browse all items in a specific category
- `AllItemsModal`: Complete grocery database browser with expandable category accordions
- `ShoppingQuickActionModal`: Quick add interface with list switcher

**Technical Implementation:**
- File: `src/features/shopping/screens/ShoppingListsScreen.tsx`
- State: Local state management with `useState`
- Mock Data: 111 grocery items with images and categories
- Dependencies: `react-native-gesture-handler`, `react-native-reanimated`

> 📖 See [docs/features/shopping.md](docs/features/shopping.md) for complete technical documentation

### 🍳 Recipes

Discover, create, and organize recipes with a beautiful grid layout and comprehensive recipe creation form.

**Core Features:**
- **Recipe Grid View**: Two-column grid layout with pastel-colored cards cycling through visual variety
- **Category Filtering**: Filter by category chips (All, Breakfast, Lunch, Dinner, Dessert, Snack)
- **Search Functionality**: Real-time search by recipe name
- **Recipe Creation**: Comprehensive form with ingredients and step-by-step instructions
- **Recipe Detail View**: Responsive layout (35% sidebar, 65% main content on tablets) showing:
  - Category badges and recipe metadata
  - Time and energy (calories) information
  - Ingredients list with individual and "Add All" shopping list integration
  - Step-by-step instructions with completion tracking
- **Ingredient Integration**: Reuses `GrocerySearchBar` component for ingredient search from the grocery database
- **Instruction Steps**: Numbered steps with "Mark as finished" toggle and visual feedback

**Key Components:**
- `RecipeCard`: Individual recipe display with cook time and category
- `RecipeSidebar`: Left sidebar with recipe info, ingredients, and "Add All" button
- `IngredientCard`: Individual ingredient with shopping list integration
- `InstructionStep`: Recipe step with completion tracking
- `AddRecipeModal`: Comprehensive creation form with:
  - Title, category, prep time, and description inputs
  - Dynamic ingredient addition with quantity, unit, and name
  - Dynamic instruction step management
  - Form validation (title and at least one ingredient required)

**Technical Implementation:**
- Files: `src/features/recipes/screens/RecipesScreen.tsx`, `RecipeDetailScreen.tsx`
- State: Local state with category and search filtering
- Card Width Calculation: `((width - spacing.lg * 3) / 2) * 0.85`
- Dependencies: `mockGroceriesDB`, `pastelColors`, `GrocerySearchBar`

> 📖 See [docs/features/recipes.md](docs/features/recipes.md) for complete technical documentation

### ✅ Chores

Household chore tracking with visual progress visualization and responsive layout design.

**Core Features:**
- **Progress Ring**: Animated circular progress indicator showing today's chore completion percentage
  - Dynamic color progression: gray → yellow → green
  - Shows percentage and thumbs-up emoji when ≥ 75% complete
  - SVG-based with smooth 1000ms animations using react-native-reanimated
- **Responsive Layout**: Adapts between single-column (< 768px) and two-column (≥ 768px) layouts
  - Mobile: Stacked progress ring, today's chores, and upcoming chores
  - Tablet: Left column (progress + today), right column (upcoming)
- **Swipeable Chore Cards**: Gesture-driven cards with swipe-to-delete
  - Swipe left or right to delete (30% threshold or high velocity)
  - Animated background reveals trash icon
  - Smooth spring animations with direction locking
- **Assignee Management**: Assign chores to household members (Mom, Dad, Kids, All)
- **Dual Sections**: "Today's Chores" and "Upcoming Chores" organization
- **Completion Tracking**: Tap cards to toggle completion status
- **Due Date & Time**: Full date/time picker integration for scheduling

**Key Components:**
- `ProgressRing`: Animated SVG progress circle with configurable size, stroke width, and colors
- `SwipeableChoreCard`: Pan gesture handler wrapper with delete functionality
- `ChoreDetailsModal`: Edit existing chore details (name, icon, assignee, due date/time)
- `ChoresQuickActionModal`: Quick chore creation form

**Technical Implementation:**
- File: `src/features/chores/screens/ChoresScreen.tsx`
- State: Local state with computed `todayChores`, `upcomingChores`, and memoized `progress`
- Responsive: Uses `useWindowDimensions` with 768px breakpoint
- Progress Calculation: `(completed / total) * 100` (memoized with `useMemo`)
- Dependencies: `react-native-gesture-handler`, `react-native-reanimated`, `pastelColors`

> 📖 See [docs/features/chores.md](docs/features/chores.md) for complete technical documentation

### 🏠 Dashboard

- **Time-Based Greeting**: Personalized greeting based on time of day
- **Quick Actions**: Widget-based access to common tasks (add shopping item, create recipe, add chore)
- **Overview Statistics**: At-a-glance view of active lists, recipes, and pending chores
- **Recent Activity**: See what's been updated recently across all features
- **Household Summary**: View household member count and preferences

### 👤 Authentication & Profile

- **Google Sign-In**: Secure authentication with Google OAuth
- **Guest Mode**: Use the app without creating an account
- **Profile Management**: Update name, preferences, and household information
- **Household Members**: Manage household members for chore assignments
- **Secure Storage**: User data persisted securely to AsyncStorage
- **Auth State Persistence**: Stay logged in across app restarts

### ⚙️ Settings

- **Notification Preferences**: Configure app notifications
- **Household Management**: Add/remove household members
- **Account Settings**: Update profile information and preferences
- **Data Controls**: Manage app data and clear caches
- **Theme Preferences**: Light theme with brand colors
- **Privacy Settings**: Control data sharing and permissions

---

## 🛠️ Technology Stack

### Core Framework
- **React Native**: 0.81.5 - Cross-platform mobile development
- **Expo SDK**: 54 - Development toolchain and runtime
- **TypeScript**: 5.9.2 - Static typing with strict mode enabled

### Navigation
- **React Navigation**: 7.1.26 - Routing and navigation
- **Drawer Navigator**: 7.7.10 - Side drawer menu
- **Native Stack Navigator**: 7.9.0 - Stack-based navigation
- **React Native Screens**: 4.16.0 - Native navigation optimization

### State Management & Storage
- **React Context API**: Built-in state management
- **AsyncStorage**: 2.2.0 - Persistent local storage
- **React Hooks**: Custom hooks for feature-specific logic

### UI Libraries
- **React Native Paper**: 5.14.5 - Material Design components
- **Expo Vector Icons**: 15.0.3 - Icon library
- **Lucide React**: 0.562.0 - Modern icon set
- **React Native SVG**: 15.12.1 - SVG rendering support

### Animations & Gestures
- **React Native Reanimated**: 4.1.1 - High-performance animations
- **React Native Gesture Handler**: 2.28.0 - Native gesture support
- **React Native Portal**: 1.3.0 - Modal and overlay management

### Utilities
- **DayJS**: 1.11.19 - Date manipulation and formatting
- **React Native Paper Dates**: 0.22.57 - Date picker components
- **React Native DateTimePicker**: 8.6.0 - Native date/time pickers

### Authentication
- **Expo Auth Session**: 7.0.10 - OAuth flow handling
- **Expo Web Browser**: 15.0.10 - In-app browser for auth
- **Expo Crypto**: 15.0.8 - Cryptographic utilities

### Development Tools
- **Babel Preset Expo**: 54.0.9 - Babel configuration
- **TypeScript**: 5.9.2 - Type checking
- **React Types**: 19.1.0 - React TypeScript definitions

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18 or higher ([Download](https://nodejs.org/))
- **npm or yarn**: Package manager (comes with Node.js)
- **Expo CLI**: Install globally with `npm install -g expo-cli`
- **Git**: For cloning the repository

### Platform-Specific Requirements

#### iOS Development
- **macOS**: Required for iOS development
- **Xcode**: Latest version from Mac App Store
- **iOS Simulator**: Included with Xcode
- **CocoaPods**: Install with `sudo gem install cocoapods`

#### Android Development
- **Android Studio**: [Download](https://developer.android.com/studio)
- **Android SDK**: Version 33 or higher
- **Android Emulator**: Configure via Android Studio AVD Manager
- **Java Development Kit (JDK)**: Version 11 or higher

#### Testing on Physical Device
- **Expo Go App**: Available on [iOS App Store](https://apps.apple.com/app/expo-go/id982107779) and [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

---

## 🚀 Installation

Kitchen Hub is organized as a monorepo with separate mobile and backend applications. Follow these steps to set up both:

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/kitchen-hub.git
cd kitchen-hub
```

### 2. Set Up Mobile App

```bash
cd mobile
npm install
```

This will install all required packages for the React Native/Expo mobile application.

### 3. Set Up Backend API

```bash
cd ../backend
npm install
```

This will install all required packages for the NestJS backend API.

### 4. Configure Environment

#### Mobile App Configuration

If you plan to use Google Sign-In:

1. Set up Google OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/)
2. Add your OAuth client ID to the app configuration
3. Update `mobile/app.json` with your credentials

#### Backend API Configuration

1. Create a `.env` file in the `backend/` directory
2. Copy the example environment variables (see [Backend README](backend/README.md))
3. Configure database connection, JWT secrets, and Supabase credentials

### 5. Set Up Database

```bash
cd backend
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Run database migrations
```

### 6. Start Development Servers

#### Mobile App

```bash
cd mobile
npm start
```

This will start the Expo development server and open Expo DevTools in your browser.

#### Backend API

```bash
cd backend
npm run start:dev
```

The API will be available at `http://localhost:3000/api/v1` with Swagger docs at `http://localhost:3000/api/docs`.

---

## 📱 Running the Applications

### Mobile App

#### Option 1: Expo Go (Easiest)

1. Install Expo Go on your iOS or Android device
2. Navigate to `mobile/` directory
3. Run `npm start`
4. Scan the QR code with:
   - **iOS**: Camera app
   - **Android**: Expo Go app
5. The app will load on your device

#### Option 2: iOS Simulator (macOS only)

```bash
cd mobile
npm run ios
```

This will:
- Start the Metro bundler
- Launch the iOS simulator
- Install and run Kitchen Hub

**Note**: First run may take several minutes while dependencies are built.

#### Option 3: Android Emulator

```bash
cd mobile
npm run android
```

Prerequisites:
- Android Studio installed
- An Android Virtual Device (AVD) created
- Android emulator running

#### Option 4: Web Browser

```bash
cd mobile
npm run web
```

This will open Kitchen Hub in your default web browser at `http://localhost:8081`.

**Note**: Some native features may have limited functionality on web.

#### Development Server Commands

The Expo development server runs on `http://localhost:8081` by default. You can:
- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Press `w` to open in web browser
- Press `r` to reload the app
- Press `m` to toggle menu

### Backend API

#### Development Mode

```bash
cd backend
npm run start:dev
```

The API will be available at:
- **API**: `http://localhost:3000/api/v1`
- **Swagger Docs**: `http://localhost:3000/api/docs`

#### Production Build

```bash
cd backend
npm run build
npm run start:prod
```

See [Backend README](backend/README.md) for more details.

---

## 📂 Project Structure

Kitchen Hub is organized as a **monorepo** with separate mobile and backend applications:

```
kitchen-hub/
├── mobile/                        # React Native/Expo mobile application
│   ├── src/                      # Mobile app source code
│   │   ├── features/             # Feature modules (main code)
│   │   │   ├── shopping/         # Shopping lists feature
│   │   │   │   ├── components/   # Shopping-specific components
│   │   │   │   ├── screens/      # Shopping screens
│   │   │   │   ├── services/     # Shopping services
│   │   │   │   ├── utils/        # Shopping utilities
│   │   │   │   └── index.ts      # Barrel export
│   │   │   ├── recipes/          # Recipes feature
│   │   │   ├── chores/           # Chores feature
│   │   │   ├── auth/             # Authentication feature
│   │   │   ├── dashboard/        # Dashboard feature
│   │   │   └── settings/        # Settings feature
│   │   ├── common/               # Shared/reusable code
│   │   │   ├── components/       # Shared components
│   │   │   ├── hooks/            # Shared hooks
│   │   │   ├── repositories/     # Cache-aware repositories
│   │   │   ├── storage/          # Storage utilities
│   │   │   ├── types/            # Shared types
│   │   │   └── utils/            # Shared utilities
│   │   ├── navigation/           # Navigation configuration
│   │   ├── contexts/             # React contexts
│   │   ├── services/             # External service integrations
│   │   ├── theme/                # Design system tokens
│   │   ├── data/                 # Static data
│   │   └── mocks/                # Mock data for development
│   ├── assets/                   # Static assets
│   ├── app.json                  # Expo configuration
│   ├── package.json              # Mobile dependencies
│   └── README.md                 # Mobile app documentation
│
├── backend/                      # NestJS REST API
│   ├── src/                      # Backend source code
│   │   ├── main.ts               # Bootstrap with Swagger
│   │   ├── app.module.ts          # Root module
│   │   ├── common/                # Shared code
│   │   │   ├── decorators/        # Custom decorators
│   │   │   ├── guards/            # Auth guards
│   │   │   ├── filters/           # Exception filters
│   │   │   ├── interceptors/       # Response transformation
│   │   │   └── utils/             # Shared utilities
│   │   ├── config/                # Configuration
│   │   ├── infrastructure/       # Infrastructure layer
│   │   │   ├── database/          # Prisma module and schema
│   │   │   └── ...
│   │   └── modules/               # Feature modules
│   │       ├── auth/              # Authentication
│   │       ├── households/        # Household management
│   │       ├── shopping/          # Shopping lists
│   │       ├── recipes/           # Recipes
│   │       ├── chores/            # Chores
│   │       ├── dashboard/         # Dashboard
│   │       ├── import/            # Data import
│   │       └── supabase/          # Supabase client
│   ├── package.json               # Backend dependencies
│   └── README.md                  # Backend API documentation
│
├── docs/                          # Documentation
│   ├── features/                 # Feature documentation
│   ├── architecture/             # Architecture docs
│   └── screenshots/               # App screenshots
│
├── .cursor/                       # Cursor IDE configuration
├── README.md                      # Monorepo overview (this file)
├── README-DETAILED.md            # This comprehensive documentation
└── CLAUDE.md                     # AI assistant guidance
```

### Mobile App Structure

The mobile app follows a **feature-based architecture** where each feature is self-contained. See [Mobile README](mobile/README.md) for detailed structure.

### Backend API Structure

The backend follows **NestJS module-based architecture** where each module mirrors a mobile feature. See [Backend README](backend/README.md) for detailed structure.

---

## 🏗️ Architecture

Kitchen Hub consists of two main applications with different architectural patterns:

### Mobile App Architecture

The mobile app uses a **feature-based architecture** rather than a traditional layers architecture. Each feature is a self-contained module with its own:

- **Components**: UI components specific to the feature
- **Screens**: Top-level screen components
- **Services**: Business logic and API integration
- **Utils**: Feature-specific utilities
- **Hooks**: Custom React hooks for business logic
- **Barrel Exports**: `index.ts` files for clean imports

#### Benefits of Feature-Based Architecture

1. **Scalability**: Easy to add new features without affecting existing ones
2. **Maintainability**: All related code is co-located
3. **Team Collaboration**: Multiple developers can work on different features simultaneously
4. **Code Discovery**: Clear where to find feature-specific code
5. **Testability**: Features can be tested in isolation

### Backend API Architecture

The backend uses **NestJS module-based architecture** where each module mirrors a mobile feature:

- **Modules**: Feature modules (auth, households, shopping, recipes, chores, dashboard, import)
- **Controllers**: HTTP request handlers
- **Services**: Business logic
- **Repositories**: Data access layer
- **DTOs**: Data Transfer Objects for validation

#### Benefits of Module-Based Architecture

1. **Separation of Concerns**: Clear boundaries between layers
2. **Dependency Injection**: Loose coupling and testability
3. **Scalability**: Easy to add new modules
4. **Type Safety**: Full TypeScript support with DTOs
5. **Testability**: Easy to mock dependencies

### Mobile App Navigation Structure

```
RootNavigator (AuthContext check)
├── AuthStackNavigator (if not authenticated)
│   └── LoginScreen
└── MainNavigator (if authenticated)
    └── MainTabsScreen
        ├── Dashboard
        ├── Shopping
        ├── Chores
        ├── Recipes
        └── Settings
```

**Key Navigation Concepts:**

- **Conditional Auth Flow**: `RootNavigator` checks authentication state and renders appropriate navigator
- **Tab Navigation**: Main app uses bottom tab navigation with 5 sections
- **Type-Safe Routes**: Navigation params are fully typed with TypeScript

### Backend API Structure

The backend API follows RESTful conventions with a global prefix `/api/v1`:

- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Household-level access control
- **Global Guards**: JWT authentication guard on all routes (opt-out with `@Public()`)
- **Response Format**: Consistent `ApiResponse<T>` format
- **Error Handling**: Global exception filter for consistent error responses

### Mobile App State Management

The mobile app uses **React Context API** for state management:

#### AuthContext
- Manages authentication state (logged in, guest, signed out)
- Provides user information (name, email, profile)
- Handles Google OAuth flow
- Persists auth state to AsyncStorage

#### HouseholdContext
- Manages household members
- Provides household-wide settings
- Shares data across features

#### NetworkContext
- Monitors network connectivity
- Provides online/offline status
- Triggers sync when network comes back online

#### AppLifecycleContext
- Tracks app state (foreground/background)
- Triggers sync when app comes to foreground

#### Local Component State
- Feature-specific state managed with `useState` and `useReducer`
- Custom hooks encapsulate complex state logic

### Mobile App Data Persistence

- **AsyncStorage**: User preferences, auth tokens, and cached data
- **Storage Keys**: Prefixed with `@kitchen_hub_` for namespace isolation
- **Persistence Strategy**: Critical data (auth state) persisted on change
- **Cache-Aware Repositories**: Handle local caching and sync with backend
- **Offline Support**: Local caching with sync queue when offline

### Backend Data Management

- **PostgreSQL Database**: Prisma ORM with migrations
- **Soft Deletes**: User-owned entities support soft-delete via `deleted_at` timestamp
- **Automatic Timestamps**: `created_at` and `updated_at` maintained automatically
- **Row Level Security**: Supabase RLS policies for multi-tenant isolation
- **Master Grocery Catalog**: Centralized grocery database with categories

### Component Patterns

#### Shared Components (common/components/)
Reusable across multiple features:
- `FloatingActionButton`: Circular action button with icon
- `CenteredModal`: Full-screen centered modal wrapper
- `ShareModal`: Share functionality with copy/export options
- `HeaderActions`: Reusable header action buttons

#### Feature Components (features/[feature]/components/)
Specific to a single feature:
- `ShoppingListCard`: Display shopping list summary
- `RecipeCard`: Recipe grid item
- `ChoreCard`: Swipeable chore task card
- `FrequentlyAddedGrid`: Quick-add grocery items

### Theme System

Centralized design tokens in `src/theme/`:

```typescript
// src/theme/colors.ts
export const colors = {
  primary: '#FF6B35',      // Warm orange
  shopping: '#4CAF50',     // Green
  recipes: '#FF6B35',      // Orange
  chores: '#9C27B0',       // Purple
  // ... more colors
};

// src/theme/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// src/theme/typography.ts
export const typography = {
  h1: { fontSize: 32, fontWeight: 'bold' },
  h2: { fontSize: 24, fontWeight: 'bold' },
  body: { fontSize: 16, fontWeight: 'normal' },
  // ... more styles
};
```

**Usage:**
```typescript
import { colors, spacing, typography } from '../../../theme';

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h1,
    color: colors.primary,
  },
});
```

---

## 🔍 Key Features Deep Dive

### Smart Shopping Lists

Kitchen Hub's shopping list feature is powered by a comprehensive grocery database:

**Grocery Database Highlights:**
- 111 pre-defined grocery items
- Organized into 9 categories (Produce, Dairy, Meat & Seafood, Pantry, Frozen Foods, Beverages, Snacks, Bakery, Household)
- Each item includes:
  - Name
  - Category
  - Common unit (lb, oz, gallon, etc.)
  - Default quantity

**User Experience Flow:**
1. **Browse by Category**: Modal with category chips for quick filtering
2. **Search**: Real-time search across all items
3. **Frequently Added**: Quick-add grid for common items
4. **Custom Items**: Add items not in database
5. **Check Off**: Mark items as purchased (strikethrough effect)
6. **Share Lists**: Export lists via share modal

### Responsive Design

Kitchen Hub adapts to different screen sizes:

**Breakpoints:**
- **Phone** (< 768px): Single-column layout, stacked components
- **Tablet** (≥ 768px): Two-column layout, side-by-side views

**Responsive Components:**
- Recipe detail screen: Sidebar (35%) + main content (65%) on tablets
- Shopping lists: Grid layouts adjust column count
- Chores: Card widths adapt to screen size
- Modals: Full-screen on phone, centered on tablet

### Gesture-Based Interactions

Powered by React Native Reanimated and Gesture Handler:

- **Swipeable Cards**: Chore cards reveal action buttons on swipe
- **Pull to Refresh**: Refresh data with pull-down gesture
- **Animated Transitions**: Smooth page transitions
- **Interactive Elements**: Buttons with press feedback

### Authentication Flow

**Google Sign-In Process:**
1. User taps "Sign in with Google"
2. Expo Auth Session opens Google OAuth flow
3. User authenticates with Google
4. App receives OAuth token
5. User data stored in AsyncStorage
6. RootNavigator redirects to DrawerNavigator

**Guest Mode:**
1. User taps "Continue as Guest"
2. App creates temporary user profile
3. Data stored locally (not synced)
4. Full app access without account

---

## 💻 Development

### Mobile App Development

See [Mobile README](mobile/README.md) for detailed mobile development guidelines including:

- Feature-based structure rules
- Component organization
- Import path conventions
- Theme system usage
- Testing guidelines

### Backend API Development

See [Backend README](backend/README.md) for detailed backend development guidelines including:

- Module structure patterns
- Database patterns (soft-delete, timestamps)
- API endpoint conventions
- Testing guidelines
- Security patterns

### Code Organization Principles

Both mobile and backend follow consistent patterns:

#### Mobile App Structure

```bash
mobile/src/features/[feature-name]/
├── components/    # Feature-specific components
├── screens/       # Feature screens
├── services/      # Feature services
├── utils/         # Feature utilities
└── index.ts       # Barrel export
```

#### Backend API Structure

```bash
backend/src/modules/[feature-name]/
├── controllers/   # HTTP request handlers
├── services/      # Business logic
├── repositories/  # Data access layer
├── dtos/          # Data Transfer Objects
└── [feature].module.ts
```

### TypeScript Configuration

Both mobile and backend use **TypeScript strict mode** for maximum type safety:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noImplicitThis": true
  }
}
```

**Benefits:**
- Catch errors at compile time
- Better IDE autocomplete
- Safer refactoring
- Improved code documentation

### Available Scripts

#### Mobile App

```bash
cd mobile
npm start              # Start Expo dev server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run web            # Run in web browser
npm test               # Run tests
```

#### Backend API

```bash
cd backend
npm run start:dev      # Start development server
npm run build          # Build for production
npm run start:prod     # Start production server
npm test               # Run tests
npm run test:cov       # Run tests with coverage
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run database migrations
```

### Linting & Code Style

- Use TypeScript strict mode
- Follow framework conventions (React Native for mobile, NestJS for backend)
- Use meaningful variable names
- Keep components/modules small and focused
- Comprehensive test coverage with parameterized tests

---

## 📚 Documentation

### Available Documentation

- **[README.md](README.md)**: Monorepo overview and quick-start guide
- **[README-DETAILED.md](README-DETAILED.md)**: This comprehensive documentation
- **[Mobile README](mobile/README.md)**: Complete mobile app documentation
- **[Backend README](backend/README.md)**: Complete backend API documentation
- **[CLAUDE.md](CLAUDE.md)**: AI assistant development guidance
- **[docs/features/](docs/features/)**: Feature-specific documentation
  - [shopping.md](docs/features/shopping.md): Shopping lists documentation
  - [recipes.md](docs/features/recipes.md): Recipes documentation
  - [chores.md](docs/features/chores.md): Chores documentation

### Screenshot Library

High-quality screenshots for all features:

```
docs/screenshots/
├── dashboard/        # Dashboard screenshots
├── shopping/         # Shopping list screenshots
├── recipes/          # Recipe screenshots
├── chores/           # Chore screenshots
├── settings/         # Settings screenshots
└── auth/             # Authentication screenshots
```

---

## ⚙️ Configuration

### Expo Configuration (app.json)

```json
{
  "expo": {
    "name": "Kitchen Hub",
    "slug": "kitchen-hub",
    "version": "1.0.0",
    "scheme": "kitchen-hub",
    "newArchEnabled": true,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.kitchenhub.app"
    },
    "android": {
      "package": "com.kitchenhub.app"
    }
  }
}
```

### Babel Configuration (babel.config.js)

**Important**: React Native Reanimated requires the Reanimated plugin:

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'], // Must be last
  };
};
```

### TypeScript Configuration (tsconfig.json)

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 🎨 Design System

### Brand Colors

**Primary Brand Color**: `#FF6B35` (warm orange)

**Section Colors:**
- **Shopping**: `#4CAF50` (green)
- **Recipes**: `#FF6B35` (orange)
- **Chores**: `#9C27B0` (purple)
- **Settings**: `#2196F3` (blue)

### Color Palette

```typescript
colors = {
  // Brand
  primary: '#FF6B35',

  // Backgrounds
  background: '#FFFFFF',
  surface: '#F5F5F5',

  // Text
  text: '#333333',
  textSecondary: '#666666',
  textDisabled: '#999999',

  // Status
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',

  // Section-specific
  shopping: '#4CAF50',
  recipes: '#FF6B35',
  chores: '#9C27B0',
  settings: '#2196F3',
};
```

### Spacing Scale

```typescript
spacing = {
  xs: 4,    // 0.25rem
  sm: 8,    // 0.5rem
  md: 16,   // 1rem
  lg: 24,   // 1.5rem
  xl: 32,   // 2rem
  xxl: 48,  // 3rem
};
```

### Typography

```typescript
typography = {
  h1: { fontSize: 32, fontWeight: 'bold', lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: 'bold', lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  body: { fontSize: 16, fontWeight: 'normal', lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: 'normal', lineHeight: 20 },
  small: { fontSize: 12, fontWeight: 'normal', lineHeight: 16 },
};
```

### Component Styling Approach

1. Import theme tokens:
   ```typescript
   import { colors, spacing, typography } from '../../../theme';
   ```

2. Create StyleSheet with theme values:
   ```typescript
   const styles = StyleSheet.create({
     container: {
       padding: spacing.md,
       backgroundColor: colors.background,
     },
   });
   ```

3. Use theme consistently across all components

---

## 🐛 Troubleshooting

### Common Issues

#### Metro Bundler Won't Start

**Problem**: Metro bundler fails to start or shows port conflict

**Solution**:
```bash
# Kill existing Metro process
npx react-native start --reset-cache

# Or manually kill the process
lsof -ti:8081 | xargs kill

# Restart
npm start
```

#### iOS Simulator Not Starting

**Problem**: `npm run ios` fails or simulator doesn't appear

**Solution**:
```bash
# Reset Expo cache
npx expo start -c

# Ensure Xcode is installed and simulators are available
xcodebuild -version
xcrun simctl list devices

# Try opening simulator first, then run
open -a Simulator
npm run ios
```

#### Android Build Errors

**Problem**: Android build fails with Gradle or SDK errors

**Solution**:
```bash
# Clean Android build
cd android
./gradlew clean
cd ..

# Ensure ANDROID_HOME is set
echo $ANDROID_HOME

# Reinstall dependencies
rm -rf node_modules
npm install
npm run android
```

#### Node Modules Issues

**Problem**: Dependency conflicts or installation errors

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# If issues persist, try with legacy peer deps
npm install --legacy-peer-deps
```

#### Reanimated Plugin Not Working

**Problem**: Animations don't work or build fails with reanimated errors

**Solution**:
1. Ensure `react-native-reanimated/plugin` is last in `babel.config.js`
2. Clear Metro cache: `npx expo start -c`
3. Reinstall: `npx expo install react-native-reanimated`

#### TypeScript Errors

**Problem**: Type errors in IDE or during build

**Solution**:
```bash
# Regenerate TypeScript types
npx expo customize tsconfig.json

# Check for errors
npx tsc --noEmit

# Restart TypeScript server in VSCode
Cmd+Shift+P → "TypeScript: Restart TS Server"
```

#### Expo Go Connection Issues

**Problem**: Can't connect to development server on physical device

**Solution**:
1. Ensure device and computer are on same Wi-Fi network
2. Check firewall isn't blocking port 8081
3. Try tunnel mode: `npx expo start --tunnel`
4. Restart Expo Go app and development server

---

## 📧 Contact & Support

### Reporting Issues

If you encounter bugs or have feature requests:

1. Check existing issues: [GitHub Issues](https://github.com/yourusername/kitchen-hub/issues)
2. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Device/platform information

### Getting Help

- **Documentation**: Start with this file and [README.md](README.md)
- **Feature Docs**: Check [docs/features/](docs/features/) for specific features
- **Expo Documentation**: [docs.expo.dev](https://docs.expo.dev/)
- **React Native Docs**: [reactnative.dev](https://reactnative.dev/)

---

## 🎉 Acknowledgments

Built with:
- [React Native](https://reactnative.dev/)
- [Expo](https://expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

---

## 📄 License

Private repository - All rights reserved.

---

<div align="center">

**Kitchen Hub** - Simplifying Household Management

Built with ❤️ using React Native and Expo

[🏠 Back to Top](#kitchen-hub---detailed-documentation)

</div>
