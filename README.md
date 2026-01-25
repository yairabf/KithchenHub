# Kitchen Hub 🏠

> A full-stack household management application for shopping lists, recipes, and chores

![iOS](https://img.shields.io/badge/iOS-supported-4CAF50) ![Android](https://img.shields.io/badge/Android-supported-4CAF50) ![Web](https://img.shields.io/badge/Web-supported-4CAF50) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue) ![NestJS](https://img.shields.io/badge/NestJS-10.0.0-E0234E) ![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020)

## What is Kitchen Hub?

Kitchen Hub is a comprehensive full-stack application for household management. It consists of:

- **Mobile App**: React Native/Expo cross-platform mobile application (iOS, Android, Web)
- **Backend API**: NestJS REST API with PostgreSQL database

The app helps families organize shopping lists with a 111-item grocery database, discover and create recipes, track chores, and get a unified dashboard view—all with support for Google sign-in or guest mode.

## Screenshots

<table>
  <tr>
    <td><img src="docs/screenshots/dashboard/dashboard-main.png" alt="Dashboard" width="250"/></td>
    <td><img src="docs/screenshots/shopping/shopping-main.png" alt="Shopping Lists" width="250"/></td>
    <td><img src="docs/screenshots/recipes/recipes-main.png" alt="Recipes" width="250"/></td>
  </tr>
</table>

## Features

- **🛒 Shopping Lists** - Multi-list management with 111-item grocery database, smart search, and category browsing
- **🍳 Recipes** - Discover, create, and organize recipes with ingredient-to-shopping list integration
- **✅ Chores** - Task tracking with progress visualization and assignee management
- **🏠 Dashboard** - Quick overview with time-based greeting and action widgets
- **👤 Authentication** - Google sign-in and guest mode with profile management
- **⚙️ Settings** - Manage notifications, household members, and app preferences
- **🔄 Offline Support** - Local caching with automatic sync when online
- **👥 Multi-User** - Household management with member invitations

## Project Structure

Kitchen Hub is organized as a **monorepo** with two main applications:

```
kitchen-hub/
├── mobile/              # React Native/Expo mobile application
│   ├── src/            # Mobile app source code
│   ├── app.json        # Expo configuration
│   └── package.json    # Mobile dependencies
├── backend/             # NestJS REST API
│   ├── src/            # Backend source code
│   └── package.json    # Backend dependencies
├── docs/                # Documentation
│   ├── features/       # Feature documentation
│   ├── architecture/   # Architecture docs
│   └── screenshots/    # App screenshots
├── .cursor/            # Cursor IDE configuration
├── README.md           # This file
├── README-DETAILED.md  # Comprehensive documentation
└── CLAUDE.md          # AI assistant guidance
```

## Tech Stack

### Mobile App
- **Framework**: React Native 0.81.5 with Expo SDK 54
- **Language**: TypeScript (strict mode)
- **Navigation**: React Navigation (tabs, native stack)
- **State Management**: React Context, AsyncStorage
- **UI**: React Native Paper, Expo Vector Icons
- **Animation**: React Native Reanimated, Gesture Handler
- **Backend Integration**: Supabase client

### Backend API
- **Framework**: NestJS 10.0.0 with Fastify adapter
- **Language**: TypeScript 5.1.3
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Google OAuth (Supabase)
- **Documentation**: Swagger/OpenAPI
- **Infrastructure**: Supabase (Auth, Storage, RLS)

## Quick Start

### Prerequisites

- **Node.js**: Version 18 or higher
- **npm**: Package manager
- **PostgreSQL**: Database (or use Supabase)
- **Expo CLI**: `npm install -g expo-cli` (for mobile development)

### Mobile App

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start development server
npm start

# Run on specific platform
npm run ios       # iOS simulator
npm run android   # Android emulator
npm run web       # Web browser
```

See [Mobile README](mobile/README.md) for detailed mobile app documentation.

### Backend API

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run start:dev
```

The API will be available at:
- **API**: `http://localhost:3000/api/v1`
- **Swagger Docs**: `http://localhost:3000/api/docs`

See [Backend README](backend/README.md) for detailed backend documentation.

## Architecture Overview

### Mobile App Architecture

The mobile app follows a **feature-based architecture**:

- **Features**: Self-contained modules (shopping, recipes, chores, auth, dashboard, settings)
- **Common**: Shared components, hooks, utilities, and repositories
- **Navigation**: Tab-based navigation with conditional auth flow
- **State Management**: React Context for global state, local state for features
- **Data Persistence**: AsyncStorage with cache-aware repositories
- **Offline Support**: Local caching with sync queue

### Backend API Architecture

The backend follows **NestJS module-based architecture**:

- **Modules**: Feature modules mirroring mobile features (auth, households, shopping, recipes, chores, dashboard, import)
- **Common**: Shared guards, interceptors, filters, decorators, and utilities
- **Infrastructure**: Database (Prisma), Supabase integration, caching
- **Security**: JWT authentication, Row Level Security (RLS), guest mode protection
- **Data Patterns**: Soft deletes, automatic timestamps, master grocery catalog

### Data Flow

```
Mobile App (React Native)
    ↓
API Client (Supabase)
    ↓
Backend API (NestJS)
    ↓
Database (PostgreSQL via Prisma)
```

## Documentation

- **[Mobile App Documentation](mobile/README.md)** - Complete mobile app guide with features, architecture, and development guidelines
- **[Backend API Documentation](backend/README.md)** - Complete backend API guide with endpoints, architecture, and setup instructions
- **[Detailed Documentation](README-DETAILED.md)** - Comprehensive project documentation covering both mobile and backend
- **[CLAUDE.md](CLAUDE.md)** - Development guidance for AI assistants working with this codebase

## Development

### Mobile Development

See [Mobile README](mobile/README.md) for:
- Feature-based structure rules
- Component organization
- Import path conventions
- Theme system usage
- Testing guidelines

### Backend Development

See [Backend README](backend/README.md) for:
- Module structure patterns
- Database patterns (soft-delete, timestamps)
- API endpoint conventions
- Testing guidelines
- Security patterns

### Code Organization

Both mobile and backend follow consistent patterns:

- **Feature-based organization**: Related code grouped by feature
- **TypeScript strict mode**: Maximum type safety
- **Comprehensive testing**: Unit tests with parameterized test cases
- **Documentation**: Inline documentation and README files

## Contributing

This is a private repository. For development guidelines, see:
- [CLAUDE.md](CLAUDE.md) - AI assistant development rules
- [Mobile README](mobile/README.md) - Mobile app development guidelines
- [Backend README](backend/README.md) - Backend API development guidelines

## License

Private repository - All rights reserved.

---

Built with ❤️ using React Native, Expo, NestJS, and PostgreSQL
