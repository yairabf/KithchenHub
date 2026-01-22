# Guest Mode Specifications

## Overview
Guest Mode is a "try-before-you-buy" experience that allows users to explore the core functionality of KitchenHub without creating an account. This document defines the exact limitations, data persistence rules, and user-facing messaging to ensure a clear distinction between Guest and Signed-in states.

## 1. Core Principles
1.  **Local-Only:** All data created in Guest Mode resides **only** on the user's device (SQLite/Local Storage). No data is sent to the backend.
2.  **No Sync:** Data does not sync across devices.
3.  **Frictionless Entry:** Users can enter the app immediately without providing email or credentials.
4.  **Upsell awareness:** Users should be gently reminded of the benefits of an account when appropriate.

## 2. Limitations

| Feature | Guest Mode Behavior | Signed-In Behavior |
| :--- | :--- | :--- |
| **Data Storage** | Local device only. | Cloud synced + Local cache. |
| **Cross-Device Sync** | Disabled. | Enabled. |
| **Household Sharing** | Disabled. | Enabled (Invite/Join). |
| **Recipe Creation** | Enabled (Local only). | Enabled (Synced). |
| **Meal Planning** | Enabled (Local only). | Enabled (Synced). |
| **Shopping List** | Enabled (Local only). | Enabled (Synced). |
| **Pantry Management** | Enabled (Local only). | Enabled (Synced). |
| **Profile Settings** | Minimal (Theme, Units). | Full (Avatar, Email, etc.). |

## 3. Data Persistence & Migration
-   **Persistence:** Data persists as long as the app is installed and data is not cleared by the OS.
-   **Migration:** When a Guest user decides to sign up/sign in:
    -   **Prompt:** "Would you like to keep your existing data?"
    -   **Action:** If "Yes", local data is uploaded to the new account. If "No", local data is wiped.
-   **Wipe:** Uninstalls or explicit "Clear Data" actions in OS settings will lose all Guest data irrevocably.

## 4. User Messaging & Copy

### 4.1. Onboarding / Welcome Screen
*Context: The first screen a user sees.*

*   **Primary Action:** "Get Started" (leads to Sign Up/Login flow)
*   **Secondary Action:** "Use Offline" or "Continue as Guest"
*   **Guest Mode Disclaimer (Modal/Tooltip on selection):**
    > "Guest Mode allows you to use KitchenHub offline. Your data will be saved to this device only and won't be available on other devices."

### 4.2. Settings / Profile
*Context: Top of the Settings page for a Guest user.*

*   **Status Indicator:** "Guest Mode (Local Account)"
*   **Banner:**
    > "You are using a local account. Sign up to sync your recipes and share with your household."
    > [Sign Up Button]

### 4.3. Feature Blockers (Household/Sharing)
*Context: User tries to access a syncing feature (e.g., Share List).*

*   **Headline:** "Sync your kitchen"
*   **Body:**
    > "To share shopping lists and meal plans with your household, you need a KitchenHub account."
*   **Actions:** [Sign Up Free] [Not Now]

### 4.4. Sign Up Upgrade Prompt
*Context: When a Guest user clicks "Sign Up".*

*   **Copy:**
    > "Create an account to backup your recipes and access them everywhere."
