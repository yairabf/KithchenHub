Kitchen Hub Project Plan

1. Project Overview

The Kitchen Hub is a centralized smart-home dashboard designed to streamline household management. The application focuses on high-frequency tasks such as grocery shopping, meal planning, and chore tracking. It utilizes a "Quick Action" philosophy to minimize user friction during data entry.

2. Information Architecture

The current implementation follows a hierarchical structure designed for clarity and rapid access:

A. Global Navigation

Top Bar: Search for recipes, notification center, and user profile context.

Bottom Pill Nav: Persistent navigation between primary modules.

B. Dashboard (Home)

Contextual Header: Dynamic greeting and primary action button (New List).

Overview Sidebar: High-level status indicators for active lists and pending tasks.

Main Action Widgets: Large-scale tap targets for the most frequently used modules.

C. Quick-Action Popup (Shopping)

Multi-List Context: A bubble-switcher to toggle between different grocery contexts.

Frictionless Entry: Auto-focusing input field with immediate visual feedback.

Task Management: Checkbox logic with visual strikethrough and item deletion.

3. Component Detailed Specifications

This section breaks down the individual building blocks of the Hub for development.

3.1. Dashboard Header (TopNav)

Visuals: Transparent background with high horizontal padding.

Search Bar: Pill-shaped, light gray background (#D1D5DB), 72px width on desktop.

Profile: 44px circular avatar with a 2px white border and shadow.

Logic: * Search input triggers filtering logic (planned for Phase 2).

Notification bell displays a red dot indicator if state hasNotifications is true.

3.2. Overview Sidebar Widgets

Structure: Card-based layout with a 2.5rem border radius.

Styling: Semi-transparent white background (white/40) with backdrop-blur.

Interactions: Hover state increases opacity to white/60 and translates the chevron icon to the right.

Function: Displays summary data (e.g., "3 active lists") fetched from global state.

3.3. Main Action Cards (Shopping/Chores)

Structure: Large square aspect ratio (1:1) with 3.5rem radius.

Visuals: Soft gray background (#D1D5DB). Contains a central white icon container with 2.5rem radius.

Interactions: onClick triggers the specific module modal. Hover provides a scale-up effect (1.02x) and a deep shadow (shadow-2xl).

3.4. Bottom Pill Navigation

Visuals: Floating fixed-position element at the bottom center. 2.5rem radius with glassmorphism (backdrop-blur-2xl).

Sub-Component (NavButton): * Active State: Indigo-600 background with white text/icon.

Inactive State: Gray-400 text, no background, indigo hover effect.

Logic: Updates activeTab state to switch between high-level application views.

3.5. Shopping Quick-Action Popup (Modal)

Backdrop: Dark slate (#1E293B/40) with heavy blur to isolate user focus.

Header: Dynamic color-coded icon background (Indigo, Emerald, or Orange) based on selected list.

List Switcher: Horizontal scrolling container for list "bubbles".

Selection: Updates activeListId which immediately filters the visible items array.

Quick-Add Form: * Logic: Prevents submission if empty. Auto-focuses on modal open.

Interaction: Submit via 'Enter' or the Plus button.

Item Row: * Transition: Uses opacity-50 and line-through when completed: true.

Controls: Left side toggle (Circle/Check) and right side trash icon (visible only on hover/focus).

4. Technical Stack & Design System

Framework: React (Functional Components with Hooks).

Styling: Tailwind CSS (Utility-first approach).

Icons: Lucide-React (Consistent, thin-stroke aesthetic).

Visual Language:

Background: Neutral Grays (#E5E7EB) for depth.

Surfaces: Glassmorphism (backdrop-blur) and high-radius corners (2.5rem).

Accents: Indigo (Primary), Emerald (Success), Orange (Alert).

5. Development Roadmap

Phase 1: Data Persistence (Priority: High)

Implement signInAnonymously using Firebase Auth.

Migrate local items and lists state to Firestore for cross-device syncing.

Pathing: /artifacts/{appId}/users/{userId}/shopping_items.

Phase 2: Module Expansion (Priority: Medium)

Chores Module: Implement the logic for the "Chores" widget, mirroring the quick-action popup style.

Recipe Integration: Develop the "Search Recipes" functionality to display card-based results.

Phase 3: Advanced UX (Priority: Low)

Auto-Categorization: Implement lookup to automatically categorize "Milk" into "Dairy", etc.

Shared Hub: Multi-user support for shared household lists.

6. Success Metrics

Time to Add: Users should be able to add a grocery item in under 3 seconds from dashboard entry.

Completion Rate: Tracking the percentage of checked-off items to analyze household efficiency.